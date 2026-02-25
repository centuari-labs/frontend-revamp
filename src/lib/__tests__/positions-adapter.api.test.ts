import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  resolveMarketForAsset,
  aprToBasisPoints,
  normalizeOrderToLendPosition,
  normalizeOrderToBorrowPosition,
  submitLendLimitOrder,
  submitLendMarketOrder,
  submitBorrowLimitOrder,
  submitBorrowMarketOrder,
} from "@/lib/positions-adapter.api";
import type { MarketItem, OrderResponseData } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  createLendLimitOrder: vi.fn(),
  createLendMarketOrder: vi.fn(),
  createBorrowLimitOrder: vi.fn(),
  createBorrowMarketOrder: vi.fn(),
}));

import {
  createLendLimitOrder,
  createLendMarketOrder,
  createBorrowLimitOrder,
  createBorrowMarketOrder,
} from "@/lib/api";
const mockCreateOrder = vi.mocked(createLendLimitOrder);
const mockCreateLendMarket = vi.mocked(createLendMarketOrder);
const mockCreateBorrowLimit = vi.mocked(createBorrowLimitOrder);
const mockCreateBorrowMarket = vi.mocked(createBorrowMarketOrder);

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
  timestamp: 1740441600000,
  side: "LEND",
  type: "LIMIT",
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

// ─── normalizeOrderToLendPosition (market orderType) ─────────────────

describe("normalizeOrderToLendPosition with orderType", () => {
  it("defaults to limit when no orderType passed", () => {
    const pos = normalizeOrderToLendPosition(MOCK_RESPONSE, MARKETS);
    expect(pos.orderType).toBe("limit");
  });

  it("passes through market orderType", () => {
    const pos = normalizeOrderToLendPosition(MOCK_RESPONSE, MARKETS, "market");
    expect(pos.orderType).toBe("market");
    expect(pos.type).toBe("lend");
  });
});

// ─── normalizeOrderToBorrowPosition ──────────────────────────────────

describe("normalizeOrderToBorrowPosition", () => {
  const BORROW_RESPONSE: OrderResponseData = {
    ...MOCK_RESPONSE,
    side: "BORROW",
    rate: 10.1,
  };

  it("maps all fields correctly", () => {
    const position = normalizeOrderToBorrowPosition(BORROW_RESPONSE, MARKETS);

    expect(position.id).toBe("order-123");
    expect(position.type).toBe("borrow");
    expect(position.orderType).toBe("limit");
    expect(position.tokenValue).toBe("usdc");
    expect(position.tokenSymbol).toBe("USDC");
    expect(position.amount).toBe(1000);
    expect(position.apr).toBeCloseTo(0.101, 4);
    expect(position.maturity).toBe(1735689600000);
    expect(position.status).toBe("pending");
    expect(position.collateralTokens).toEqual([]);
    expect(position.assetImg).toBe("/tokens/usdc-icon.svg");
  });

  it("accepts market orderType", () => {
    const pos = normalizeOrderToBorrowPosition(BORROW_RESPONSE, MARKETS, "market");
    expect(pos.orderType).toBe("market");
    expect(pos.type).toBe("borrow");
  });

  it("maps all statuses correctly", () => {
    expect(normalizeOrderToBorrowPosition({ ...BORROW_RESPONSE, status: "OPEN" }, MARKETS).status).toBe("pending");
    expect(normalizeOrderToBorrowPosition({ ...BORROW_RESPONSE, status: "FILLED" }, MARKETS).status).toBe("success");
    expect(normalizeOrderToBorrowPosition({ ...BORROW_RESPONSE, status: "CANCELLED" }, MARKETS).status).toBe("failed");
    expect(normalizeOrderToBorrowPosition({ ...BORROW_RESPONSE, status: "PARTIALLY_FILLED" }, MARKETS).status).toBe("processing");
  });

  it("handles unknown assetId gracefully", () => {
    const unknown = { ...BORROW_RESPONSE, assetId: "unknown-uuid" };
    const pos = normalizeOrderToBorrowPosition(unknown, MARKETS);
    expect(pos.tokenValue).toBe("unknown");
  });
});

// ─── submitLendMarketOrder ───────────────────────────────────────────

describe("submitLendMarketOrder", () => {
  const baseParams = {
    tokenValue: "usdc",
    tokenLogo: "/tokens/usdc-icon.svg",
    tokenLabel: "USDC",
    amount: 1000,
    amountInUsd: 1000,
    maturity: 1735689600000,
    editingPosition: undefined,
  };

  it("converts params to correct DTO (no rate) and calls createLendMarketOrder", async () => {
    mockCreateLendMarket.mockResolvedValue({ ...MOCK_RESPONSE, type: "MARKET" });

    await submitLendMarketOrder(baseParams, MARKETS, "jwt-token");

    expect(mockCreateLendMarket).toHaveBeenCalledWith(
      {
        assetId: "asset-uuid-usdc",
        amount: "1000",
        marketIds: ["market-uuid-1"],
      },
      "jwt-token",
    );
  });

  it("returns a normalized LendPosition with orderType market", async () => {
    mockCreateLendMarket.mockResolvedValue({ ...MOCK_RESPONSE, type: "MARKET" });

    const result = await submitLendMarketOrder(baseParams, MARKETS, "token");

    expect(result.id).toBe("order-123");
    expect(result.type).toBe("lend");
    expect(result.orderType).toBe("market");
  });

  it("throws when token is not found in markets", async () => {
    await expect(
      submitLendMarketOrder({ ...baseParams, tokenValue: "unknown" }, MARKETS, "token"),
    ).rejects.toThrow('No asset found for token "unknown"');
  });

  it("propagates API errors", async () => {
    mockCreateLendMarket.mockRejectedValue(new Error("API error: 500"));

    await expect(
      submitLendMarketOrder(baseParams, MARKETS, "token"),
    ).rejects.toThrow("API error: 500");
  });
});

// ─── submitBorrowLimitOrder ──────────────────────────────────────────

describe("submitBorrowLimitOrder", () => {
  const baseParams = {
    tokenValue: "usdc",
    tokenLogo: "/tokens/usdc-icon.svg",
    tokenLabel: "USDC",
    amount: 500,
    maturity: 1735689600000,
    targetApr: 0.101,
    collateralTokens: ["btc", "eth"],
    editingPosition: undefined,
  };

  it("converts params to correct DTO with rate and calls createBorrowLimitOrder", async () => {
    mockCreateBorrowLimit.mockResolvedValue({ ...MOCK_RESPONSE, side: "BORROW", rate: 10.1 });

    await submitBorrowLimitOrder(baseParams, MARKETS, "jwt-borrow");

    expect(mockCreateBorrowLimit).toHaveBeenCalledWith(
      {
        assetId: "asset-uuid-usdc",
        amount: "500",
        marketIds: ["market-uuid-1"],
        rate: 1010,
      },
      "jwt-borrow",
    );
  });

  it("returns a normalized BorrowPosition", async () => {
    mockCreateBorrowLimit.mockResolvedValue({ ...MOCK_RESPONSE, side: "BORROW", rate: 10.1 });

    const result = await submitBorrowLimitOrder(baseParams, MARKETS, "token");

    expect(result.id).toBe("order-123");
    expect(result.type).toBe("borrow");
    expect(result.orderType).toBe("limit");
    expect(result.collateralTokens).toEqual([]);
  });

  it("throws when token is not found in markets", async () => {
    await expect(
      submitBorrowLimitOrder({ ...baseParams, tokenValue: "unknown" }, MARKETS, "token"),
    ).rejects.toThrow('No asset found for token "unknown"');
  });

  it("propagates API errors", async () => {
    mockCreateBorrowLimit.mockRejectedValue(new Error("Health factor too low"));

    await expect(
      submitBorrowLimitOrder(baseParams, MARKETS, "token"),
    ).rejects.toThrow("Health factor too low");
  });
});

// ─── submitBorrowMarketOrder ─────────────────────────────────────────

describe("submitBorrowMarketOrder", () => {
  const baseParams = {
    tokenValue: "usdc",
    tokenLogo: "/tokens/usdc-icon.svg",
    tokenLabel: "USDC",
    amount: 500,
    maturity: 1735689600000,
    collateralTokens: ["btc"],
    editingPosition: undefined,
  };

  it("converts params to correct DTO (no rate) and calls createBorrowMarketOrder", async () => {
    mockCreateBorrowMarket.mockResolvedValue({ ...MOCK_RESPONSE, side: "BORROW", type: "MARKET" });

    await submitBorrowMarketOrder(baseParams, MARKETS, "jwt-borrow");

    expect(mockCreateBorrowMarket).toHaveBeenCalledWith(
      {
        assetId: "asset-uuid-usdc",
        amount: "500",
        marketIds: ["market-uuid-1"],
      },
      "jwt-borrow",
    );
  });

  it("returns a normalized BorrowPosition with orderType market", async () => {
    mockCreateBorrowMarket.mockResolvedValue({ ...MOCK_RESPONSE, side: "BORROW", type: "MARKET" });

    const result = await submitBorrowMarketOrder(baseParams, MARKETS, "token");

    expect(result.id).toBe("order-123");
    expect(result.type).toBe("borrow");
    expect(result.orderType).toBe("market");
  });

  it("propagates API errors", async () => {
    mockCreateBorrowMarket.mockRejectedValue(new Error("API error: 400"));

    await expect(
      submitBorrowMarketOrder(baseParams, MARKETS, "token"),
    ).rejects.toThrow("API error: 400");
  });
});
