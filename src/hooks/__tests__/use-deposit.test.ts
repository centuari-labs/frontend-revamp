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

// biome-ignore lint/suspicious/noExplicitAny: test-only wallet shape
let mockWallets: any[] = [];

vi.mock("@privy-io/react-auth", () => ({
	useWallets: () => ({ wallets: mockWallets }),
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
	mockWallets = [];
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
		).rejects.toThrow(
			/Address not in allowlist for chain 421614 \(token USDC\)/,
		);
		expect(mockReadContract).not.toHaveBeenCalled();
	});

	it("does not throw an allowlist error for the allowlisted USDC address", async () => {
		const { result } = renderHookWithProviders(() => useDeposit());
		await expect(
			result.current.deposit(
				"asset-1",
				"100",
				makeToken({ tokenAddress: USDC_LOWER }),
			),
		).rejects.not.toThrow(/Address not in allowlist/);
	});
});

describe("useDeposit on-chain decimals cross-check (issue #5)", () => {
	const USDC_CHECKSUMMED = "0x218A9082C712FA709c044a6cea6Ef333df04cc3d";

	function setWallet(request?: ReturnType<typeof vi.fn>) {
		const provider = {
			request:
				request ??
				vi.fn(async () => {
					throw new Error("test stop: provider not mocked");
				}),
		};
		mockWallets = [
			{
				walletClientType: "metamask",
				address: "0x1111111111111111111111111111111111111111",
				getEthereumProvider: async () => provider,
			},
		];
		return provider.request;
	}

	beforeEach(() => {
		mockGetBlock.mockResolvedValue({ baseFeePerGas: BigInt(100_000_000) });
	});

	it("reads on-chain decimals from the validated token contract", async () => {
		setWallet();
		mockReadContract.mockImplementation(
			({ functionName }: { functionName: string }) => {
				if (functionName === "decimals") return 6;
				if (functionName === "allowance") return BigInt(0);
				return undefined;
			},
		);

		const { result } = renderHookWithProviders(() => useDeposit());
		await expect(
			result.current.deposit("asset-1", "100", makeToken({ decimals: 6 })),
		).rejects.toThrow();

		expect(mockReadContract).toHaveBeenCalledWith(
			expect.objectContaining({
				functionName: "decimals",
				address: USDC_CHECKSUMMED,
			}),
		);
	});

	it("rejects with DecimalsMismatchError when on-chain differs from API", async () => {
		setWallet();
		mockReadContract.mockImplementation(
			({ functionName }: { functionName: string }) => {
				if (functionName === "decimals") return 18;
				if (functionName === "allowance") return BigInt(0);
				return undefined;
			},
		);

		const { result } = renderHookWithProviders(() => useDeposit());
		await expect(
			result.current.deposit("asset-1", "100", makeToken({ decimals: 6 })),
		).rejects.toThrow(/Decimals mismatch for USDC/);
	});

	it("does not call the wallet provider when decimals mismatch", async () => {
		const providerRequest = setWallet();
		mockReadContract.mockImplementation(
			({ functionName }: { functionName: string }) => {
				if (functionName === "decimals") return 18;
				if (functionName === "allowance") return BigInt(0);
				return undefined;
			},
		);

		const { result } = renderHookWithProviders(() => useDeposit());
		await expect(
			result.current.deposit("asset-1", "100", makeToken({ decimals: 6 })),
		).rejects.toThrow(/Decimals mismatch/);

		expect(providerRequest).not.toHaveBeenCalled();
	});

	it("surfaces an RPC failure on decimals() as 'could not verify token'", async () => {
		setWallet();
		mockReadContract.mockImplementation(
			({ functionName }: { functionName: string }) => {
				if (functionName === "decimals") {
					throw new Error("network error");
				}
				if (functionName === "allowance") return BigInt(0);
				return undefined;
			},
		);

		const { result } = renderHookWithProviders(() => useDeposit());
		await expect(
			result.current.deposit("asset-1", "100", makeToken({ decimals: 6 })),
		).rejects.toThrow(/Could not verify token USDC/);
	});
});

describe("useDeposit confirmTransaction gate (issue #6)", () => {
	function setWallet(request?: ReturnType<typeof vi.fn>) {
		const provider = {
			request:
				request ??
				vi.fn(async () => {
					throw new Error("test stop: provider not mocked");
				}),
		};
		mockWallets = [
			{
				walletClientType: "metamask",
				address: "0x1111111111111111111111111111111111111111",
				getEthereumProvider: async () => provider,
			},
		];
		return provider.request;
	}

	beforeEach(() => {
		mockGetBlock.mockResolvedValue({ baseFeePerGas: BigInt(100_000_000) });
		mockReadContract.mockImplementation(
			({ functionName }: { functionName: string }) => {
				if (functionName === "decimals") return 6;
				if (functionName === "allowance") return BigInt(0);
				return undefined;
			},
		);
	});

	it("calls confirmTransaction with Approve details before signing approve", async () => {
		const providerRequest = setWallet();
		const confirmTransaction = vi.fn(async () => {});
		const { result } = renderHookWithProviders(() =>
			useDeposit({ confirmTransaction }),
		);

		await expect(
			result.current.deposit("asset-1", "100", makeToken({ decimals: 6 })),
		).rejects.toThrow();

		expect(confirmTransaction).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "Approve",
				symbol: "USDC",
				tokenAddress: "0x218A9082C712FA709c044a6cea6Ef333df04cc3d",
				spender: "0xb0103A9a9CFb4e2EbE565594e487b29283ac02eB",
				chainName: "Arbitrum Sepolia",
				chainId: 421614,
			}),
		);
		expect(providerRequest).toHaveBeenCalled();
	});

	it("does not call the wallet when confirmTransaction rejects with UserCancelledError", async () => {
		const providerRequest = setWallet();
		const { UserCancelledError } = await import("@/lib/errors");
		const confirmTransaction = vi.fn(async () => {
			throw new UserCancelledError();
		});
		const { result } = renderHookWithProviders(() =>
			useDeposit({ confirmTransaction }),
		);

		await expect(
			result.current.deposit("asset-1", "100", makeToken({ decimals: 6 })),
		).rejects.toThrow(/cancel/i);

		expect(providerRequest).not.toHaveBeenCalled();
	});

	it("returns status to idle (not error) after UserCancelledError", async () => {
		setWallet();
		const { UserCancelledError } = await import("@/lib/errors");
		const confirmTransaction = vi.fn(async () => {
			throw new UserCancelledError();
		});
		const { result } = renderHookWithProviders(() =>
			useDeposit({ confirmTransaction }),
		);

		await expect(
			result.current.deposit("asset-1", "100", makeToken({ decimals: 6 })),
		).rejects.toThrow();

		expect(result.current.status).toBe("idle");
	});

	it("works without a confirmTransaction callback (backwards compat)", async () => {
		const providerRequest = setWallet();
		const { result } = renderHookWithProviders(() => useDeposit());

		await expect(
			result.current.deposit("asset-1", "100", makeToken({ decimals: 6 })),
		).rejects.toThrow();

		// No callback was provided; the wallet provider should still be reached
		expect(providerRequest).toHaveBeenCalled();
	});
});

describe("useDeposit wallet selection (issue #10)", () => {
	beforeEach(() => {
		mockGetBlock.mockResolvedValue({ baseFeePerGas: BigInt(100_000_000) });
		mockReadContract.mockImplementation(
			({ functionName }: { functionName: string }) => {
				if (functionName === "decimals") return 6;
				if (functionName === "allowance") return BigInt(0);
				return undefined;
			},
		);
	});

	it("signs with the external wallet whose address matches", async () => {
		const externalProviderRequest = vi.fn(async () => {
			throw new Error("test stop: external provider reached");
		});
		const embeddedProviderRequest = vi.fn(async () => {
			throw new Error("embedded provider should NOT be called");
		});
		mockWallets = [
			{
				walletClientType: "privy",
				address: "0x1111111111111111111111111111111111111111",
				getEthereumProvider: async () => ({
					request: embeddedProviderRequest,
				}),
			},
			{
				walletClientType: "metamask",
				address: "0x1111111111111111111111111111111111111111",
				getEthereumProvider: async () => ({
					request: externalProviderRequest,
				}),
			},
		];

		const { result } = renderHookWithProviders(() => useDeposit());
		await expect(
			result.current.deposit("asset-1", "100", makeToken({ decimals: 6 })),
		).rejects.toThrow(/test stop: external provider reached/);

		expect(externalProviderRequest).toHaveBeenCalled();
		expect(embeddedProviderRequest).not.toHaveBeenCalled();
	});

	it("matches the external wallet case-insensitively", async () => {
		const externalProviderRequest = vi.fn(async () => {
			throw new Error("test stop: external provider reached");
		});
		mockWallets = [
			{
				walletClientType: "metamask",
				// Checksummed form — useWalletAddress returns lowercase
				address: "0x1111111111111111111111111111111111111111".toUpperCase(),
				getEthereumProvider: async () => ({
					request: externalProviderRequest,
				}),
			},
		];

		const { result } = renderHookWithProviders(() => useDeposit());
		await expect(
			result.current.deposit("asset-1", "100", makeToken({ decimals: 6 })),
		).rejects.toThrow(/test stop: external provider reached/);

		expect(externalProviderRequest).toHaveBeenCalled();
	});

	it("throws WalletNotConnectedError when only the embedded wallet is available", async () => {
		const embeddedProviderRequest = vi.fn();
		mockWallets = [
			{
				walletClientType: "privy",
				address: "0x1111111111111111111111111111111111111111",
				getEthereumProvider: async () => ({
					request: embeddedProviderRequest,
				}),
			},
		];

		const { result } = renderHookWithProviders(() => useDeposit());
		await expect(
			result.current.deposit("asset-1", "100", makeToken({ decimals: 6 })),
		).rejects.toMatchObject({ name: "WalletNotConnectedError" });

		expect(embeddedProviderRequest).not.toHaveBeenCalled();
	});

	it("throws WalletNotConnectedError when no external wallet matches the active address", async () => {
		const externalProviderRequest = vi.fn();
		mockWallets = [
			{
				walletClientType: "metamask",
				// Different address — not the active wallet
				address: "0x2222222222222222222222222222222222222222",
				getEthereumProvider: async () => ({
					request: externalProviderRequest,
				}),
			},
		];

		const { result } = renderHookWithProviders(() => useDeposit());
		await expect(
			result.current.deposit("asset-1", "100", makeToken({ decimals: 6 })),
		).rejects.toMatchObject({ name: "WalletNotConnectedError" });

		expect(externalProviderRequest).not.toHaveBeenCalled();
	});
});
