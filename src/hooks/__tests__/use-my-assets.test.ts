import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHookWithProviders } from "@/__tests__/helpers/render-with-providers";

vi.mock("@privy-io/react-auth", () => ({
	usePrivy: vi.fn(() => ({
		user: { wallet: { address: "0x123" } },
		getAccessToken: vi.fn().mockResolvedValue("test-jwt-token"),
	})),
}));

vi.mock("@/hooks/use-auth-token", () => ({
	useAuthToken: () => ({
		getToken: vi.fn().mockResolvedValue("test-jwt-token"),
		authFetch: vi.fn((fn: (t: string) => Promise<unknown>) =>
			fn("test-jwt-token"),
		),
	}),
}));

vi.mock("@/lib/api", () => ({
	getMyAssets: vi.fn(),
}));

import { getMyAssets } from "@/lib/api";
const mockGetMyAssets = vi.mocked(getMyAssets);

beforeEach(() => {
	vi.clearAllMocks();
});

describe("useMyAssets (API mode)", () => {
	async function getHook() {
		const { useMyAssets } = await import("@/hooks/use-my-assets");
		return useMyAssets;
	}

	it("returns empty assets initially while loading", async () => {
		mockGetMyAssets.mockReturnValue(new Promise(() => {})); // never resolves
		const useMyAssets = await getHook();
		const { result } = renderHookWithProviders(() => useMyAssets());

		expect(result.current.assets).toEqual([]);
		expect(result.current.isLoading).toBe(true);
	});

	it("returns assets on successful fetch", async () => {
		const mockAssets = [
			{
				assetId: "usdc-test",
				tokenAddress: "0x0000000000000000000000000000000000000001" as const,
				symbol: "USDC",
				name: "USD Coin",
				walletBalance: 5000,
				amountInUsd: 5000,
				isCollateral: false,
				pendingCollateralFlag: false,
				flaggedAt: 0,
				unlocksAt: 0,
				imageUrl: null,
				ltv: 0.9,
				liquidationThreshold: 0.92,
			},
			{
				assetId: "eth-test",
				tokenAddress: "0x0000000000000000000000000000000000000004" as const,
				symbol: "ETH",
				name: "Ethereum",
				walletBalance: 2.5,
				amountInUsd: 7500,
				isCollateral: true,
				pendingCollateralFlag: false,
				flaggedAt: 0,
				unlocksAt: 0,
				imageUrl: null,
				ltv: 0.75,
				liquidationThreshold: 0.8,
			},
		];

		mockGetMyAssets.mockResolvedValue({
			data: mockAssets,
			page: 1,
			limit: 10,
			totalData: 2,
			totalPages: 1,
		});

		const useMyAssets = await getHook();
		const { result } = renderHookWithProviders(() => useMyAssets());

		await vi.waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.assets).toEqual(mockAssets);
		expect(result.current.assets).toHaveLength(2);
		expect(result.current.isError).toBe(false);
	});

	it("passes auth token to getMyAssets", async () => {
		mockGetMyAssets.mockResolvedValue({
			data: [],
			page: 1,
			limit: 10,
			totalData: 0,
			totalPages: 0,
		});

		const useMyAssets = await getHook();
		renderHookWithProviders(() => useMyAssets());

		await vi.waitFor(() => {
			expect(mockGetMyAssets).toHaveBeenCalledWith(
				"test-jwt-token",
				expect.any(Object),
			);
		});
	});

	it("returns error state on failure", async () => {
		mockGetMyAssets.mockRejectedValue(new Error("API error"));

		const useMyAssets = await getHook();
		const { result } = renderHookWithProviders(() => useMyAssets());

		await vi.waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		expect(result.current.assets).toEqual([]);
	});

	it("returns empty assets when user has no wallet", async () => {
		const { usePrivy } = await import("@privy-io/react-auth");
		vi.mocked(usePrivy).mockReturnValue({
			user: null,
			getAccessToken: vi.fn(),
		} as any);

		const useMyAssets = await getHook();
		const { result } = renderHookWithProviders(() => useMyAssets());

		expect(result.current.assets).toEqual([]);
		expect(mockGetMyAssets).not.toHaveBeenCalled();
	});
});
