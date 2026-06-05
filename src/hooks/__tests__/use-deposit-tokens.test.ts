import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHookWithProviders } from "@/__tests__/helpers/render-with-providers";
import type { DepositToken } from "@/lib/api";

vi.mock("@/lib/chain-config", () => ({
	ACTIVE_CHAIN: { id: 421614, name: "Arbitrum Sepolia" },
	ACTIVE_CHAIN_LABEL: "Arbitrum Sepolia",
	HUB_DEPOSITOR_ADDRESS:
		"0xb0103A9a9CFb4e2EbE565594e487b29283ac02eB" as `0x${string}`,
	COLLATERAL_MANAGER_ADDRESS:
		"0xC54aBdb7095A07a92B41B34eD8E974EFb3962fF3" as `0x${string}`,
}));

vi.mock("@/lib/api", () => ({
	getDepositTokens: vi.fn(),
}));

vi.mock("@/hooks/use-auth-token", () => ({
	useAuthToken: () => ({
		getToken: vi.fn(async () => "mock-jwt"),
		authFetch: vi.fn(async (fn: (t: string) => Promise<unknown>) =>
			fn("mock-jwt"),
		),
	}),
}));

import { useDepositTokens } from "@/hooks/use-deposit-tokens";
import { getDepositTokens } from "@/lib/api";
const mockGetDepositTokens = vi.mocked(getDepositTokens);

const USDC: DepositToken = {
	id: "asset-usdc",
	symbol: "USDC",
	name: "USD Coin",
	tokenAddress: "0x6B8d9A4C6EBC58672c00b7b9CF5f450654f5e1F0",
	decimals: 6,
	imageUrl: null,
	chainId: 421614,
};

const USDT: DepositToken = {
	id: "asset-usdt",
	symbol: "USDT",
	name: "Tether",
	tokenAddress: "0x14e0361FEE0942FfC71ff39a463c8aa023Ae7F55",
	decimals: 6,
	imageUrl: null,
	chainId: 421614,
};

const NON_ALLOWLISTED: DepositToken = {
	id: "asset-bogus",
	symbol: "BOGUS",
	name: "Bogus Token",
	tokenAddress: "0x000000000000000000000000000000000000dEaD",
	decimals: 6,
	imageUrl: null,
	chainId: 421614,
};

beforeEach(() => {
	vi.clearAllMocks();
});

describe("useDepositTokens — allowlist filtering", () => {
	it("returns all entries when every token is allowlisted", async () => {
		mockGetDepositTokens.mockResolvedValue([USDC, USDT]);
		const { result } = renderHookWithProviders(() => useDepositTokens());

		await vi.waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.data).toEqual([USDC, USDT]);
	});

	it("drops entries whose tokenAddress is not in the allowlist", async () => {
		mockGetDepositTokens.mockResolvedValue([USDC, NON_ALLOWLISTED, USDT]);
		const { result } = renderHookWithProviders(() => useDepositTokens());

		await vi.waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.data).toEqual([USDC, USDT]);
	});

	it("returns an empty array when every entry is dropped", async () => {
		mockGetDepositTokens.mockResolvedValue([NON_ALLOWLISTED]);
		const { result } = renderHookWithProviders(() => useDepositTokens());

		await vi.waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.data).toEqual([]);
	});

	it("returns an empty array when the API returns no tokens", async () => {
		mockGetDepositTokens.mockResolvedValue([]);
		const { result } = renderHookWithProviders(() => useDepositTokens());

		await vi.waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.data).toEqual([]);
	});
});
