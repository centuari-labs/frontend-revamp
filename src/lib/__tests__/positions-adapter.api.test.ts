import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  resolveMarketForAsset,
  aprToBasisPoints,
  normalizeOrderToLendPosition,
  submitLendLimitOrder,
} from "@/lib/positions-adapter.api";
import type { MarketItem, OrderResponseData } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  createLendLimitOrder: vi.fn(),
}));

import { createLendLimitOrder } from "@/lib/api";
const mockCreateOrder = vi.mocked(createLendLimitOrder);

// ─── Fixtures ─────────────────────────────────────────────────────────

const MARKETS: MarketItem[] = [
  {
    asset: {
      id: "asset-uuid-usdc",
      name: "USDC",
      symbol: "USDC",
      decimals: 6,
      image_url: null,
      token_address: "0xA0b8...usdc",
    },
    market: { market_id: "market-uuid-1", maturity: 1735689600 },
    borrow_rate: 10.1,
    lend_rate: 6.5,
    collateral_factor: 0.75,
  },
  {
    asset: {
      id: "asset-uuid-xsgd",
      name: "XSGD",
      symbol: "XSGD",
      decimals: 6,
      image_url: null,
      token_address: "0xB1c9...xsgd",
    },
    market: { market_id: "market-uuid-2", maturity: 1738368000 },
    borrow_rate: 9.3,
    lend_rate: 5.2,
    collateral_factor: 0.75,
  },
];

const MOCK_RESPONSE: OrderResponseData = {
  orderId: "order-123",
  walletAddress: "0xWallet",
  assetId: "asset-uuid-usdc",
  markets: [{ marketId: "market-uuid-1", maturity: 1735689600 }],
  status: "OPEN",
  originalAmount: "1000",
  settlementFeeAmount: "0.1",
  rate: 6.5,
  autoRollover: true,
  createdAt: "2026-02-25T00:00:00.000Z",
  updatedAt: "2026-02-25T00:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── resolveMarketForAsset ───────────────────────────────────────────

describe("resolveMarketForAsset", () => {
  it("returns assetId and marketId for known token", () => {
    expect(resolveMarketForAsset("usdc", MARKETS)).toEqual({
      assetId: "asset-uuid-usdc",
      marketId: "market-uuid-1",
    });
  });

  it("is case-insensitive", () => {
    expect(resolveMarketForAsset("USDC", MARKETS).assetId).toBe("asset-uuid-usdc");
    expect(resolveMarketForAsset("Xsgd", MARKETS).marketId).toBe("market-uuid-2");
  });

  it("throws for unknown token", () => {
    expect(() => resolveMarketForAsset("unknown", MARKETS)).toThrow(
      'No asset found for token "unknown"',
    );
  });

  it("throws when market_id is null", () => {
    const marketsWithNull: MarketItem[] = [
      {
        ...MARKETS[0],
        market: { market_id: null, maturity: 1735689600 },
      },
    ];
    expect(() => resolveMarketForAsset("usdc", marketsWithNull)).toThrow(
      'No market available for token "usdc"',
    );
  });
});

// ─── aprToBasisPoints ─────────────────────────────────────────────────

describe("aprToBasisPoints", () => {
  it("converts decimal APR to basis points", () => {
    expect(aprToBasisPoints(0.065)).toBe(650);
  });

  it("handles whole percentage APR", () => {
    expect(aprToBasisPoints(0.05)).toBe(500);
  });

  it("applies Math.round for floating-point precision", () => {
    // 0.0655 * 10000 = 655.0000000000001 without rounding
    expect(aprToBasisPoints(0.0655)).toBe(655);
  });

  it("converts 100% to 10000 basis points", () => {
    expect(aprToBasisPoints(1.0)).toBe(10000);
  });

  it("converts small APR correctly", () => {
    expect(aprToBasisPoints(0.0001)).toBe(1);
  });
});

// ─── normalizeOrderToLendPosition ─────────────────────────────────────

describe("normalizeOrderToLendPosition", () => {
  it("maps all fields correctly", () => {
    const position = normalizeOrderToLendPosition(MOCK_RESPONSE, MARKETS);

    expect(position.id).toBe("order-123");
    expect(position.type).toBe("lend");
    expect(position.orderType).toBe("limit");
    expect(position.tokenValue).toBe("usdc");
    expect(position.tokenSymbol).toBe("USDC");
    expect(position.amount).toBe(1000);
    expect(position.apr).toBeCloseTo(0.065, 4);
    expect(position.maturity).toBe(1735689600000);
    expect(position.status).toBe("pending");
    expect(position.assetImg).toBe("/tokens/usdc-icon.svg");
  });

  it("maps OPEN status to pending", () => {
    const pos = normalizeOrderToLendPosition(MOCK_RESPONSE, MARKETS);
    expect(pos.status).toBe("pending");
  });

  it("maps FILLED status to success", () => {
    const filled = { ...MOCK_RESPONSE, status: "FILLED" };
    const pos = normalizeOrderToLendPosition(filled, MARKETS);
    expect(pos.status).toBe("success");
  });

  it("maps CANCELLED status to failed", () => {
    const cancelled = { ...MOCK_RESPONSE, status: "CANCELLED" };
    const pos = normalizeOrderToLendPosition(cancelled, MARKETS);
    expect(pos.status).toBe("failed");
  });

  it("maps PARTIALLY_FILLED to processing", () => {
    const partial = { ...MOCK_RESPONSE, status: "PARTIALLY_FILLED" };
    const pos = normalizeOrderToLendPosition(partial, MARKETS);
    expect(pos.status).toBe("processing");
  });

  it("handles unknown assetId gracefully", () => {
    const unknown = { ...MOCK_RESPONSE, assetId: "unknown-uuid" };
    const pos = normalizeOrderToLendPosition(unknown, MARKETS);
    expect(pos.tokenValue).toBe("unknown");
  });
});

// ─── submitLendLimitOrder ─────────────────────────────────────────────

describe("submitLendLimitOrder", () => {
  const baseParams = {
    tokenValue: "usdc",
    tokenLogo: "/tokens/usdc-icon.svg",
    tokenLabel: "USDC",
    amount: 1000,
    amountInUsd: 1000,
    targetApr: 0.065,
    maturity: 1735689600000,
    autoRollover: true,
    editingPosition: undefined,
  };

  it("converts params to correct DTO and calls createLendLimitOrder", async () => {
    mockCreateOrder.mockResolvedValue(MOCK_RESPONSE);

    await submitLendLimitOrder(baseParams, MARKETS, "jwt-token-123");

    expect(mockCreateOrder).toHaveBeenCalledWith(
      {
        assetId: "asset-uuid-usdc",
        amount: "1000",
        marketIds: ["market-uuid-1"],
        rate: 650,
        autoRollover: true,
      },
      "jwt-token-123",
    );
  });

  it("returns a normalized LendPosition", async () => {
    mockCreateOrder.mockResolvedValue(MOCK_RESPONSE);

    const result = await submitLendLimitOrder(baseParams, MARKETS, "token");

    expect(result.id).toBe("order-123");
    expect(result.type).toBe("lend");
    expect(result.orderType).toBe("limit");
    expect(result.tokenValue).toBe("usdc");
  });

  it("passes autoRollover=false when set", async () => {
    mockCreateOrder.mockResolvedValue(MOCK_RESPONSE);

    await submitLendLimitOrder(
      { ...baseParams, autoRollover: false },
      MARKETS,
      "token",
    );

    expect(mockCreateOrder).toHaveBeenCalledWith(
      expect.objectContaining({ autoRollover: false }),
      "token",
    );
  });

  it("throws when token is not found in markets", async () => {
    await expect(
      submitLendLimitOrder(
        { ...baseParams, tokenValue: "unknown" },
        MARKETS,
        "token",
      ),
    ).rejects.toThrow('No asset found for token "unknown"');
  });

  it("propagates API errors", async () => {
    mockCreateOrder.mockRejectedValue(new Error("API error: 400 Bad Request"));

    await expect(
      submitLendLimitOrder(baseParams, MARKETS, "token"),
    ).rejects.toThrow("API error: 400 Bad Request");
  });
});
