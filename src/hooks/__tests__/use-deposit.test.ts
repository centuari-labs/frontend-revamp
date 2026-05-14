import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHookWithProviders } from "@/__tests__/helpers/render-with-providers";

vi.mock("@/lib/chain-config", () => ({
	ACTIVE_CHAIN: { id: 421614, name: "Arbitrum Sepolia" },
	ACTIVE_CHAIN_LABEL: "Arbitrum Sepolia",
	HUB_DEPOSITOR_ADDRESS:
		"0xb0103A9a9CFb4e2EbE565594e487b29283ac02eB" as `0x${string}`,
	COLLATERAL_MANAGER_ADDRESS:
		"0xC54aBdb7095A07a92B41B34eD8E974EFb3962fF3" as `0x${string}`,
}));

const mockReadContract = vi.fn();
const mockGetBlock = vi.fn();
const mockWaitForTransactionReceipt = vi.fn();

vi.mock("wagmi", () => ({
	usePublicClient: () => ({
		readContract: mockReadContract,
		getBlock: mockGetBlock,
		waitForTransactionReceipt: mockWaitForTransactionReceipt,
	}),
}));

vi.mock("@privy-io/react-auth", () => ({
	useWallets: () => ({ wallets: [] }),
}));

vi.mock("@/hooks/use-wallet-address", () => ({
	useWalletAddress: () =>
		"0x1111111111111111111111111111111111111111" as `0x${string}`,
}));

vi.mock("@/hooks/use-auth-token", () => ({
	useAuthToken: () => ({
		getToken: vi.fn(async () => "mock-jwt"),
		authFetch: vi.fn(async (fn: (t: string) => Promise<unknown>) =>
			fn("mock-jwt"),
		),
	}),
}));

vi.mock("@/lib/api", () => ({
	confirmDeposit: vi.fn(async () => ({ success: true })),
}));

import { useDeposit } from "@/hooks/use-deposit";
import type { DepositToken } from "@/lib/api";

const USDC_LOWER = "0x218a9082c712fa709c044a6cea6ef333df04cc3d";

function makeToken(overrides: Partial<DepositToken> = {}): DepositToken {
	return {
		id: "asset-1",
		symbol: "USDC",
		name: "USDC",
		tokenAddress: USDC_LOWER,
		decimals: 6,
		imageUrl: null,
		chainId: 421614,
		...overrides,
	};
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe("useDeposit decimals validation (issue #2)", () => {
	it("rejects when decimals is null", async () => {
		const { result } = renderHookWithProviders(() => useDeposit());
		await expect(
			result.current.deposit("asset-1", "100", makeToken({ decimals: null })),
		).rejects.toThrow(/Invalid decimals for USDC/);
		expect(mockReadContract).not.toHaveBeenCalled();
	});

	it("rejects when decimals is undefined", async () => {
		const { result } = renderHookWithProviders(() => useDeposit());
		await expect(
			result.current.deposit(
				"asset-1",
				"100",
				makeToken({ decimals: undefined as unknown as number }),
			),
		).rejects.toThrow(/Invalid decimals for USDC/);
		expect(mockReadContract).not.toHaveBeenCalled();
	});

	it("rejects when decimals is negative", async () => {
		const { result } = renderHookWithProviders(() => useDeposit());
		await expect(
			result.current.deposit("asset-1", "100", makeToken({ decimals: -1 })),
		).rejects.toThrow(/Invalid decimals for USDC/);
		expect(mockReadContract).not.toHaveBeenCalled();
	});

	it("rejects when decimals is above the upper bound", async () => {
		const { result } = renderHookWithProviders(() => useDeposit());
		await expect(
			result.current.deposit("asset-1", "100", makeToken({ decimals: 100 })),
		).rejects.toThrow(/Invalid decimals for USDC/);
		expect(mockReadContract).not.toHaveBeenCalled();
	});

	it("surfaces a user-friendly remediation hint in the error message", async () => {
		const { result } = renderHookWithProviders(() => useDeposit());
		await expect(
			result.current.deposit("asset-1", "100", makeToken({ decimals: null })),
		).rejects.toThrow(/Token configuration is invalid\. Please refresh/);
	});

	it("does not throw a decimals error for valid decimals=6", async () => {
		const { result } = renderHookWithProviders(() => useDeposit());
		// With an empty wallet list, the deposit will fail downstream with a
		// "No wallet available for signing" error — which proves validation passed.
		await expect(
			result.current.deposit("asset-1", "100", makeToken({ decimals: 6 })),
		).rejects.not.toThrow(/Invalid decimals/);
	});
});

describe("useDeposit tokenAddress validation (issue #3)", () => {
	it("rejects empty string", async () => {
		const { result } = renderHookWithProviders(() => useDeposit());
		await expect(
			result.current.deposit("asset-1", "100", makeToken({ tokenAddress: "" })),
		).rejects.toThrow(/Invalid Ethereum address \(token USDC\)/);
		expect(mockReadContract).not.toHaveBeenCalled();
	});

	it("rejects null", async () => {
		const { result } = renderHookWithProviders(() => useDeposit());
		await expect(
			result.current.deposit(
				"asset-1",
				"100",
				makeToken({ tokenAddress: null as unknown as string }),
			),
		).rejects.toThrow(/Invalid Ethereum address \(token USDC\)/);
		expect(mockReadContract).not.toHaveBeenCalled();
	});

	it("rejects malformed hex string", async () => {
		const { result } = renderHookWithProviders(() => useDeposit());
		await expect(
			result.current.deposit(
				"asset-1",
				"100",
				makeToken({ tokenAddress: "0xinvalid" }),
			),
		).rejects.toThrow(/Invalid Ethereum address/);
		expect(mockReadContract).not.toHaveBeenCalled();
	});

	it("does not throw an address error for a valid lowercase address", async () => {
		const { result } = renderHookWithProviders(() => useDeposit());
		await expect(
			result.current.deposit(
				"asset-1",
				"100",
				makeToken({ tokenAddress: USDC_LOWER }),
			),
		).rejects.not.toThrow(/Invalid Ethereum address/);
	});

	it("does not throw an address error for a valid checksummed address", async () => {
		const { result } = renderHookWithProviders(() => useDeposit());
		await expect(
			result.current.deposit(
				"asset-1",
				"100",
				makeToken({
					tokenAddress: "0x218A9082C712FA709c044a6cea6Ef333df04cc3d",
				}),
			),
		).rejects.not.toThrow(/Invalid Ethereum address/);
	});

	it("rejects a valid 0x address that is not in the chain's allowlist", async () => {
		const { result } = renderHookWithProviders(() => useDeposit());
		await expect(
			result.current.deposit(
				"asset-1",
				"100",
				makeToken({
					tokenAddress: "0x000000000000000000000000000000000000dEaD",
				}),
			),
		).rejects.toThrow(/Address not in allowlist for chain 421614 \(token USDC\)/);
		expect(mockReadContract).not.toHaveBeenCalled();
	});

	it("does not throw an allowlist error for the allowlisted USDC address", async () => {
		const { result } = renderHookWithProviders(() => useDeposit());
		await expect(
			result.current.deposit("asset-1", "100", makeToken({ tokenAddress: USDC_LOWER })),
		).rejects.not.toThrow(/Address not in allowlist/);
	});
});
