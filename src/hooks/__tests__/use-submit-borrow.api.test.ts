import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { MarketItem } from "@/lib/api";
import { makeBorrowPosition } from "@/__tests__/helpers/fixtures/positions";

// ─── USE_MOCK = false for API mode tests ──────────────────────────────

vi.mock("@/lib/use-mock", () => ({ USE_MOCK: false }));

vi.mock("@/lib/positions-adapter.mock", () => ({
  submitOpenOrder: vi.fn(),
  submitFilledBorrowPosition: vi.fn(),
  updateOpenOrder: vi.fn(),
  updateFilledPosition: vi.fn(),
  buildBorrowLimitPosition: vi.fn(),
  buildBorrowMarketPosition: vi.fn(),
}));

vi.mock("@/lib/positions-adapter.api", () => ({
  submitBorrowLimitOrder: vi.fn(),
  submitBorrowMarketOrder: vi.fn(),
}));

import { submitBorrowLimitOrder, submitBorrowMarketOrder } from "@/lib/positions-adapter.api";
import * as mockAdapter from "@/lib/positions-adapter.mock";

const mockSubmitLimitApi = vi.mocked(submitBorrowLimitOrder);
const mockSubmitMarketApi = vi.mocked(submitBorrowMarketOrder);

const MARKETS: MarketItem[] = [
  {
    asset: {
      id: "asset-uuid-usdc",
      name: "USDC",
      symbol: "USDC",
      decimals: 6,
      image_url: null,
    },
    market: { market_id: "market-uuid-1", maturity: 1735689600 },
    borrow_rate: 10.1,
    lend_rate: 6.5,
    collateral_factor: 0.75,
  },
];

const API_BORROW_LIMIT_POSITION = makeBorrowPosition({
  id: "api-borrow-limit-123",
  orderType: "limit",
});

const API_BORROW_MARKET_POSITION = makeBorrowPosition({
  id: "api-borrow-market-456",
  orderType: "market",
});

beforeEach(() => {
  vi.clearAllMocks();
});

async function getHook() {
  const { useSubmitBorrow } = await import("@/hooks/use-submit-borrow");
  return useSubmitBorrow;
}

// ─── submitLimit (API mode) ──────────────────────────────────────────

describe("useSubmitBorrow.submitLimit (API mode)", () => {
  const limitParams = {
    tokenValue: "usdc",
    tokenLogo: "/tokens/usdc-icon.webp",
    tokenLabel: "USDC",
    amount: 500,
    maturity: 1735689600000,
    targetApr: 0.101,
    collateralTokens: ["btc", "eth"],
  };

  it("isPending starts as false", async () => {
    const useSubmitBorrow = await getHook();
    const { result } = renderHook(() => useSubmitBorrow());
    expect(result.current.isPending).toBe(false);
  });

  it("calls API adapter with params, token, and markets", async () => {
    mockSubmitLimitApi.mockResolvedValue(API_BORROW_LIMIT_POSITION);
    const useSubmitBorrow = await getHook();
    const { result } = renderHook(() => useSubmitBorrow());

    await act(async () => {
      await result.current.submitLimit(limitParams, {
        token: "jwt-borrow",
        markets: MARKETS,
      });
    });

    expect(mockSubmitLimitApi).toHaveBeenCalledWith(limitParams, MARKETS, "jwt-borrow");
    expect(mockAdapter.buildBorrowLimitPosition).not.toHaveBeenCalled();
  });

  it("returns normalized BorrowPosition from API", async () => {
    mockSubmitLimitApi.mockResolvedValue(API_BORROW_LIMIT_POSITION);
    const useSubmitBorrow = await getHook();
    const { result } = renderHook(() => useSubmitBorrow());

    let returned: unknown;
    await act(async () => {
      returned = await result.current.submitLimit(limitParams, {
        token: "jwt",
        markets: MARKETS,
      });
    });

    expect(returned).toBe(API_BORROW_LIMIT_POSITION);
  });

  it("throws when token is missing in API mode", async () => {
    const useSubmitBorrow = await getHook();
    const { result } = renderHook(() => useSubmitBorrow());

    await expect(
      act(async () => {
        await result.current.submitLimit(limitParams);
      }),
    ).rejects.toThrow("Auth token and market data required");
  });

  it("throws when markets is missing in API mode", async () => {
    const useSubmitBorrow = await getHook();
    const { result } = renderHook(() => useSubmitBorrow());

    await expect(
      act(async () => {
        await result.current.submitLimit(limitParams, { token: "jwt" });
      }),
    ).rejects.toThrow("Auth token and market data required");
  });

  it("propagates API adapter errors", async () => {
    mockSubmitLimitApi.mockRejectedValue(new Error("Health factor too low"));
    const useSubmitBorrow = await getHook();
    const { result } = renderHook(() => useSubmitBorrow());

    await expect(
      act(async () => {
        await result.current.submitLimit(limitParams, {
          token: "jwt",
          markets: MARKETS,
        });
      }),
    ).rejects.toThrow("Health factor too low");

    expect(result.current.isPending).toBe(false);
  });

  it("does not call mock adapter functions in API mode", async () => {
    mockSubmitLimitApi.mockResolvedValue(API_BORROW_LIMIT_POSITION);
    const useSubmitBorrow = await getHook();
    const { result } = renderHook(() => useSubmitBorrow());

    await act(async () => {
      await result.current.submitLimit(limitParams, {
        token: "jwt",
        markets: MARKETS,
      });
    });

    expect(mockAdapter.submitOpenOrder).not.toHaveBeenCalled();
    expect(mockAdapter.buildBorrowLimitPosition).not.toHaveBeenCalled();
    expect(mockAdapter.updateOpenOrder).not.toHaveBeenCalled();
  });
});

// ─── submitMarket (API mode) ─────────────────────────────────────────

describe("useSubmitBorrow.submitMarket (API mode)", () => {
  const marketParams = {
    tokenValue: "usdc",
    tokenLogo: "/tokens/usdc-icon.webp",
    tokenLabel: "USDC",
    amount: 300,
    maturity: 1735689600000,
    collateralTokens: ["btc"],
  };

  it("calls API adapter with params, token, and markets", async () => {
    mockSubmitMarketApi.mockResolvedValue(API_BORROW_MARKET_POSITION);
    const useSubmitBorrow = await getHook();
    const { result } = renderHook(() => useSubmitBorrow());

    await act(async () => {
      await result.current.submitMarket(marketParams, {
        token: "jwt-market",
        markets: MARKETS,
      });
    });

    expect(mockSubmitMarketApi).toHaveBeenCalledWith(marketParams, MARKETS, "jwt-market");
    expect(mockAdapter.buildBorrowMarketPosition).not.toHaveBeenCalled();
  });

  it("returns normalized BorrowPosition from API", async () => {
    mockSubmitMarketApi.mockResolvedValue(API_BORROW_MARKET_POSITION);
    const useSubmitBorrow = await getHook();
    const { result } = renderHook(() => useSubmitBorrow());

    let returned: unknown;
    await act(async () => {
      returned = await result.current.submitMarket(marketParams, {
        token: "jwt",
        markets: MARKETS,
      });
    });

    expect(returned).toBe(API_BORROW_MARKET_POSITION);
  });

  it("throws when token is missing in API mode", async () => {
    const useSubmitBorrow = await getHook();
    const { result } = renderHook(() => useSubmitBorrow());

    await expect(
      act(async () => {
        await result.current.submitMarket(marketParams);
      }),
    ).rejects.toThrow("Auth token and market data required");
  });

  it("propagates API adapter errors", async () => {
    mockSubmitMarketApi.mockRejectedValue(new Error("API error: 400"));
    const useSubmitBorrow = await getHook();
    const { result } = renderHook(() => useSubmitBorrow());

    await expect(
      act(async () => {
        await result.current.submitMarket(marketParams, {
          token: "jwt",
          markets: MARKETS,
        });
      }),
    ).rejects.toThrow("API error: 400");

    expect(result.current.isPending).toBe(false);
  });

  it("does not call mock adapter functions in API mode", async () => {
    mockSubmitMarketApi.mockResolvedValue(API_BORROW_MARKET_POSITION);
    const useSubmitBorrow = await getHook();
    const { result } = renderHook(() => useSubmitBorrow());

    await act(async () => {
      await result.current.submitMarket(marketParams, {
        token: "jwt",
        markets: MARKETS,
      });
    });

    expect(mockAdapter.submitFilledBorrowPosition).not.toHaveBeenCalled();
    expect(mockAdapter.buildBorrowMarketPosition).not.toHaveBeenCalled();
    expect(mockAdapter.updateFilledPosition).not.toHaveBeenCalled();
  });
});
