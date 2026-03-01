/**
 * useMarketData integration test — verifies response parsing from BE wire format.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHookWithProviders } from "@/__tests__/helpers/render-with-providers";
import { useMarketData } from "@/hooks/use-market-data";
import { MARKET_RESPONSE } from "@/__tests__/fixtures/api-responses";

vi.mock("@/lib/api", () => ({
	getMarket: vi.fn(),
}));

import { getMarket } from "@/lib/api";
const mockGetMarket = vi.mocked(getMarket);

beforeEach(() => {
	vi.clearAllMocks();
});

describe("useMarketData (API integration)", () => {
	it("parses total_deposit and active_loans as numbers", async () => {
		mockGetMarket.mockResolvedValue(MARKET_RESPONSE);

		const { result } = renderHookWithProviders(() => useMarketData());

		await vi.waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.totalDeposit).toBe(1500000);
		expect(result.current.activeLoans).toBe(750000);
	});

	it("markets array passes through correctly", async () => {
		mockGetMarket.mockResolvedValue(MARKET_RESPONSE);

		const { result } = renderHookWithProviders(() => useMarketData());

		await vi.waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.markets).toHaveLength(2);
		expect(result.current.markets[0].asset.symbol).toBe("USDC");
		expect(result.current.markets[1].asset.symbol).toBe("ETH");
	});

	it("rate values are percentages (not BPS)", async () => {
		mockGetMarket.mockResolvedValue(MARKET_RESPONSE);

		const { result } = renderHookWithProviders(() => useMarketData());

		await vi.waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		const usdc = result.current.markets[0];
		expect(usdc.lend_rate).toBe(6.5);
		expect(usdc.borrow_rate).toBe(10.1);
		expect(usdc.collateral_factor).toBe(75);
	});

	it("returns loading state initially", () => {
		mockGetMarket.mockReturnValue(new Promise(() => {}));

		const { result } = renderHookWithProviders(() => useMarketData());

		expect(result.current.isLoading).toBe(true);
		expect(result.current.totalDeposit).toBe(0);
		expect(result.current.activeLoans).toBe(0);
		expect(result.current.markets).toEqual([]);
	});

	it("returns error state on failure", async () => {
		mockGetMarket.mockRejectedValue(new Error("API error"));

		const { result } = renderHookWithProviders(() => useMarketData());

		await vi.waitFor(
			() => {
				expect(result.current.isError).toBe(true);
			},
			{ timeout: 5000 },
		);

		expect(result.current.totalDeposit).toBe(0);
		expect(result.current.markets).toEqual([]);
	});
});
