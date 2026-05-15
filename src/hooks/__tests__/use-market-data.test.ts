import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHookWithProviders } from "@/__tests__/helpers/render-with-providers";
import { useMarketData } from "@/hooks/use-market-data";

vi.mock("@/lib/api", () => ({
  getMarket: vi.fn(),
}));

import { getMarket } from "@/lib/api";
const mockGetMarket = vi.mocked(getMarket);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useMarketData", () => {
  it("returns loading state initially", () => {
    mockGetMarket.mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHookWithProviders(() => useMarketData());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.totalDeposit).toBe(0);
    expect(result.current.activeLoans).toBe(0);
    expect(result.current.markets).toEqual([]);
  });

  it("returns data on success", async () => {
    mockGetMarket.mockResolvedValue({
      total_deposit: "1000000",
      active_loans: "500000",
      markets: [
        {
          assetId: "1",
          market: { market_id: "m-1", maturity: 1735689600 },
          borrow_rate: 10.1,
          lend_rate: 6.5,
          collateral_factor: 0.75,
        },
      ],
    });

    const { result } = renderHookWithProviders(() => useMarketData());

    // Wait for query to resolve
    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.totalDeposit).toBe(1000000);
    expect(result.current.activeLoans).toBe(500000);
    expect(result.current.markets).toHaveLength(1);
  });

  it("returns error state on failure", async () => {
    mockGetMarket.mockRejectedValue(new Error("API error"));

    const { result } = renderHookWithProviders(() => useMarketData());

    // Hook has retry:1, so wait longer for both attempts to fail
    await vi.waitFor(
      () => {
        expect(result.current.isError).toBe(true);
      },
      { timeout: 5000 },
    );

    expect(result.current.totalDeposit).toBe(0);
  });

  it("returns empty markets array when data is undefined", () => {
    mockGetMarket.mockReturnValue(new Promise(() => {}));
    const { result } = renderHookWithProviders(() => useMarketData());
    expect(result.current.markets).toEqual([]);
  });
});
