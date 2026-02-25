import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { MarketItem } from "@/lib/api";
import { makeLendPosition } from "@/__tests__/helpers/fixtures/positions";

// ─── USE_MOCK = false for API mode tests ──────────────────────────────

vi.mock("@/lib/use-mock", () => ({ USE_MOCK: false }));

vi.mock("@/lib/positions-adapter.mock", () => ({
  submitOpenOrder: vi.fn(),
  submitFilledLendPosition: vi.fn(),
  updateOpenOrder: vi.fn(),
  updateFilledPosition: vi.fn(),
  buildLendLimitPosition: vi.fn(),
  buildLendMarketPosition: vi.fn(),
  getBestLendAPR: vi.fn(() => 6.5),
}));

vi.mock("@/lib/positions-adapter.api", () => ({
  submitLendLimitOrder: vi.fn(),
  submitLendMarketOrder: vi.fn(),
}));

import { submitLendLimitOrder, submitLendMarketOrder } from "@/lib/positions-adapter.api";
import * as mockAdapter from "@/lib/positions-adapter.mock";

const mockSubmitApi = vi.mocked(submitLendLimitOrder);
const mockSubmitMarketApi = vi.mocked(submitLendMarketOrder);

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

const API_LEND_POSITION = makeLendPosition({
  id: "api-order-123",
  orderType: "limit",
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useSubmitLend (API mode)", () => {
  // Dynamic import to get the version with USE_MOCK=false
  async function getHook() {
    const { useSubmitLend } = await import("@/hooks/use-submit-lend");
    return useSubmitLend;
  }

  it("isPending starts as false", async () => {
    const useSubmitLend = await getHook();
    const { result } = renderHook(() => useSubmitLend());
    expect(result.current.isPending).toBe(false);
  });

  it("calls API adapter with params, token, and markets", async () => {
    mockSubmitApi.mockResolvedValue(API_LEND_POSITION);
    const useSubmitLend = await getHook();
    const { result } = renderHook(() => useSubmitLend());

    const params = {
      tokenValue: "usdc",
      tokenLogo: "/tokens/usdc-icon.svg",
      tokenLabel: "USDC",
      amount: 1000,
      amountInUsd: 1000,
      targetApr: 0.065,
      maturity: 1735689600000,
      autoRollover: true,
    };

    await act(async () => {
      await result.current.submitLimit(params, {
        token: "jwt-123",
        markets: MARKETS,
      });
    });

    expect(mockSubmitApi).toHaveBeenCalledWith(params, MARKETS, "jwt-123");
    expect(mockAdapter.buildLendLimitPosition).not.toHaveBeenCalled();
  });

  it("returns normalized LendPosition from API", async () => {
    mockSubmitApi.mockResolvedValue(API_LEND_POSITION);
    const useSubmitLend = await getHook();
    const { result } = renderHook(() => useSubmitLend());

    let returned: unknown;
    await act(async () => {
      returned = await result.current.submitLimit(
        {
          tokenValue: "usdc",
          tokenLogo: "/tokens/usdc-icon.svg",
          tokenLabel: "USDC",
          amount: 500,
          amountInUsd: 500,
          targetApr: 0.05,
          maturity: 1735689600000,
          autoRollover: false,
        },
        { token: "jwt-456", markets: MARKETS },
      );
    });

    expect(returned).toBe(API_LEND_POSITION);
  });

  it("sets isPending during submission and resets after", async () => {
    let resolveFn: (value: unknown) => void;
    mockSubmitApi.mockReturnValue(
      new Promise((resolve) => {
        resolveFn = resolve;
      }),
    );

    const useSubmitLend = await getHook();
    const { result } = renderHook(() => useSubmitLend());

    const promise = act(async () => {
      const p = result.current.submitLimit(
        {
          tokenValue: "usdc",
          tokenLogo: "/tokens/usdc-icon.svg",
          tokenLabel: "USDC",
          amount: 100,
          amountInUsd: 100,
          targetApr: 0.065,
          maturity: 1735689600000,
          autoRollover: true,
        },
        { token: "jwt", markets: MARKETS },
      );
      return p;
    });

    // Resolve the pending promise
    await act(async () => {
      resolveFn!(API_LEND_POSITION);
    });
    await promise;

    expect(result.current.isPending).toBe(false);
  });

  it("throws when token is missing in API mode", async () => {
    const useSubmitLend = await getHook();
    const { result } = renderHook(() => useSubmitLend());

    await expect(
      act(async () => {
        await result.current.submitLimit({
          tokenValue: "usdc",
          tokenLogo: "/tokens/usdc-icon.svg",
          tokenLabel: "USDC",
          amount: 100,
          amountInUsd: 100,
          targetApr: 0.065,
          maturity: 1000,
          autoRollover: true,
        });
      }),
    ).rejects.toThrow("Auth token and market data required");
  });

  it("throws when markets is missing in API mode", async () => {
    const useSubmitLend = await getHook();
    const { result } = renderHook(() => useSubmitLend());

    await expect(
      act(async () => {
        await result.current.submitLimit(
          {
            tokenValue: "usdc",
            tokenLogo: "/tokens/usdc-icon.svg",
            tokenLabel: "USDC",
            amount: 100,
            amountInUsd: 100,
            targetApr: 0.065,
            maturity: 1000,
            autoRollover: true,
          },
          { token: "jwt" },
        );
      }),
    ).rejects.toThrow("Auth token and market data required");
  });

  it("propagates API adapter errors", async () => {
    mockSubmitApi.mockRejectedValue(new Error("API error: 401 Unauthorized"));
    const useSubmitLend = await getHook();
    const { result } = renderHook(() => useSubmitLend());

    await expect(
      act(async () => {
        await result.current.submitLimit(
          {
            tokenValue: "usdc",
            tokenLogo: "/tokens/usdc-icon.svg",
            tokenLabel: "USDC",
            amount: 100,
            amountInUsd: 100,
            targetApr: 0.065,
            maturity: 1735689600000,
            autoRollover: true,
          },
          { token: "jwt", markets: MARKETS },
        );
      }),
    ).rejects.toThrow("API error: 401 Unauthorized");

    expect(result.current.isPending).toBe(false);
  });

  it("does not call mock adapter functions in API mode", async () => {
    mockSubmitApi.mockResolvedValue(API_LEND_POSITION);
    const useSubmitLend = await getHook();
    const { result } = renderHook(() => useSubmitLend());

    await act(async () => {
      await result.current.submitLimit(
        {
          tokenValue: "usdc",
          tokenLogo: "/tokens/usdc-icon.svg",
          tokenLabel: "USDC",
          amount: 1000,
          amountInUsd: 1000,
          targetApr: 0.065,
          maturity: 1735689600000,
          autoRollover: true,
        },
        { token: "jwt", markets: MARKETS },
      );
    });

    expect(mockAdapter.submitOpenOrder).not.toHaveBeenCalled();
    expect(mockAdapter.buildLendLimitPosition).not.toHaveBeenCalled();
    expect(mockAdapter.updateOpenOrder).not.toHaveBeenCalled();
  });
});

// ─── submitMarket (API mode) ─────────────────────────────────────────

const API_MARKET_POSITION = makeLendPosition({
  id: "api-market-order-456",
  orderType: "market",
});

describe("useSubmitLend.submitMarket (API mode)", () => {
  async function getHook() {
    const { useSubmitLend } = await import("@/hooks/use-submit-lend");
    return useSubmitLend;
  }

  const marketParams = {
    tokenValue: "usdc",
    tokenLogo: "/tokens/usdc-icon.svg",
    tokenLabel: "USDC",
    amount: 2000,
    amountInUsd: 2000,
    maturity: 1735689600000,
  };

  it("calls API adapter with params, token, and markets", async () => {
    mockSubmitMarketApi.mockResolvedValue(API_MARKET_POSITION);
    const useSubmitLend = await getHook();
    const { result } = renderHook(() => useSubmitLend());

    await act(async () => {
      await result.current.submitMarket(marketParams, {
        token: "jwt-market",
        markets: MARKETS,
      });
    });

    expect(mockSubmitMarketApi).toHaveBeenCalledWith(marketParams, MARKETS, "jwt-market");
    expect(mockAdapter.buildLendMarketPosition).not.toHaveBeenCalled();
  });

  it("returns normalized LendPosition from API", async () => {
    mockSubmitMarketApi.mockResolvedValue(API_MARKET_POSITION);
    const useSubmitLend = await getHook();
    const { result } = renderHook(() => useSubmitLend());

    let returned: unknown;
    await act(async () => {
      returned = await result.current.submitMarket(marketParams, {
        token: "jwt",
        markets: MARKETS,
      });
    });

    expect(returned).toBe(API_MARKET_POSITION);
  });

  it("throws when token is missing in API mode", async () => {
    const useSubmitLend = await getHook();
    const { result } = renderHook(() => useSubmitLend());

    await expect(
      act(async () => {
        await result.current.submitMarket(marketParams);
      }),
    ).rejects.toThrow("Auth token and market data required");
  });

  it("propagates API adapter errors", async () => {
    mockSubmitMarketApi.mockRejectedValue(new Error("API error: 500"));
    const useSubmitLend = await getHook();
    const { result } = renderHook(() => useSubmitLend());

    await expect(
      act(async () => {
        await result.current.submitMarket(marketParams, {
          token: "jwt",
          markets: MARKETS,
        });
      }),
    ).rejects.toThrow("API error: 500");

    expect(result.current.isPending).toBe(false);
  });

  it("does not call mock adapter functions in API mode", async () => {
    mockSubmitMarketApi.mockResolvedValue(API_MARKET_POSITION);
    const useSubmitLend = await getHook();
    const { result } = renderHook(() => useSubmitLend());

    await act(async () => {
      await result.current.submitMarket(marketParams, {
        token: "jwt",
        markets: MARKETS,
      });
    });

    expect(mockAdapter.submitFilledLendPosition).not.toHaveBeenCalled();
    expect(mockAdapter.buildLendMarketPosition).not.toHaveBeenCalled();
    expect(mockAdapter.updateFilledPosition).not.toHaveBeenCalled();
  });
});
