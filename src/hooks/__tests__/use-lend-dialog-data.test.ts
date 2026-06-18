import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHookWithProviders } from "@/__tests__/helpers/render-with-providers";

vi.mock("@privy-io/react-auth", () => ({
	usePrivy: vi.fn(() => ({
		user: { wallet: { address: "0x123" } },
		getAccessToken: vi.fn().mockResolvedValue("mock-token"),
	})),
}));

vi.mock("@/hooks/use-auth-token", () => ({
	useAuthToken: vi.fn(() => ({
		getToken: vi.fn(),
		authFetch: vi.fn((fn: (t: string) => Promise<unknown>) => fn("mock-token")),
	})),
}));

vi.mock("@/hooks/use-my-assets", () => ({
	useMyAssets: vi.fn(() => ({ assets: [], isLoading: false, isError: false })),
}));

import { useLendDialogData } from "@/hooks/use-lend-dialog-data";
import { useMyAssets } from "@/hooks/use-my-assets";

beforeEach(() => {
	vi.clearAllMocks();
});

describe("useLendDialogData", () => {
	it("returns 0 balance when no matching asset", () => {
		const { result } = renderHookWithProviders(() =>
			useLendDialogData("UNKNOWN"),
		);
		expect(result.current.availableBalance).toBe(0);
		expect(result.current.tokenPrice).toBe(0);
	});

	it("returns wallet balance and price for matching asset", () => {
		vi.mocked(useMyAssets).mockReturnValue({
			assets: [
				{
					symbol: "USDC",
					name: "USD Coin",
					walletBalance: 15000,
					amountInUsd: 15000,
					isCollateral: false,
					imageUrl: null,
					ltv: 0,
					liquidationThreshold: 0,
				},
			],
			isLoading: false,
			isError: false,
			page: 1,
			totalData: 1,
			totalPages: 1,
			refetch: vi.fn(),
		} as any);

		const { result } = renderHookWithProviders(() => useLendDialogData("USDC"));
		expect(result.current.availableBalance).toBe(15000);
		expect(result.current.tokenPrice).toBe(1);
		expect(result.current.isLoading).toBe(false);
		expect(result.current.isError).toBe(false);
	});

	it("derives balance correctly for high-price token", () => {
		vi.mocked(useMyAssets).mockReturnValue({
			assets: [
				{
					symbol: "BTC",
					name: "Bitcoin",
					walletBalance: 2.222,
					amountInUsd: 100000,
					isCollateral: false,
					imageUrl: null,
					ltv: 0,
					liquidationThreshold: 0,
				},
			],
			isLoading: false,
			isError: false,
			page: 1,
			totalData: 1,
			totalPages: 1,
			refetch: vi.fn(),
		} as any);

		const { result } = renderHookWithProviders(() => useLendDialogData("BTC"));
		expect(result.current.availableBalance).toBe(2.222);
		expect(result.current.tokenPrice).toBeCloseTo(100000 / 2.222, 1);
	});

	it("returns totalSupply as 0", () => {
		const { result } = renderHookWithProviders(() => useLendDialogData("USDC"));
		expect(result.current.totalSupply).toBe(0);
	});

	it("returns loading state from assets", () => {
		vi.mocked(useMyAssets).mockReturnValue({
			assets: [],
			isLoading: true,
			isError: false,
			page: 1,
			totalData: 0,
			totalPages: 0,
			refetch: vi.fn(),
		} as any);

		const { result } = renderHookWithProviders(() => useLendDialogData("USDC"));
		expect(result.current.isLoading).toBe(true);
	});

	it("returns error state from assets", () => {
		vi.mocked(useMyAssets).mockReturnValue({
			assets: [],
			isLoading: false,
			isError: true,
			page: 1,
			totalData: 0,
			totalPages: 0,
			refetch: vi.fn(),
		} as any);

		const { result } = renderHookWithProviders(() => useLendDialogData("USDC"));
		expect(result.current.isError).toBe(true);
	});
});
