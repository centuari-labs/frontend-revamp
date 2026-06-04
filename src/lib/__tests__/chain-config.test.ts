import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { arbitrum, arbitrumSepolia } from "viem/chains";

// chain-config reads env at module-load time and throws on missing config,
// so each case stubs env then re-imports a fresh module instance.
const VALID_ADDR = "0x1111111111111111111111111111111111111111";

beforeEach(() => {
	// Defaults that satisfy the address + privy guards unless a case overrides them.
	vi.stubEnv("NEXT_PUBLIC_HUB_DEPOSITOR_ADDRESS", VALID_ADDR);
	vi.stubEnv("NEXT_PUBLIC_COLLATERAL_MANAGER_ADDRESS", VALID_ADDR);
	vi.stubEnv("NEXT_PUBLIC_PRIVY_APP_ID", "test-privy-app-id");
	vi.resetModules();
});

afterEach(() => {
	vi.unstubAllEnvs();
	vi.resetModules();
});

describe("chain-config ACTIVE_CHAIN selection", () => {
	it("selects Arbitrum Sepolia when NEXT_PUBLIC_CHAIN_ENV=testnet", async () => {
		vi.stubEnv("NODE_ENV", "test");
		vi.stubEnv("NEXT_PUBLIC_CHAIN_ENV", "testnet");
		vi.resetModules();
		const { ACTIVE_CHAIN } = await import("@/lib/chain-config");
		expect(ACTIVE_CHAIN.id).toBe(arbitrumSepolia.id);
	});

	it("falls back to Arbitrum Sepolia when unset outside production", async () => {
		vi.stubEnv("NODE_ENV", "development");
		vi.stubEnv("NEXT_PUBLIC_CHAIN_ENV", undefined);
		vi.resetModules();
		const { ACTIVE_CHAIN } = await import("@/lib/chain-config");
		expect(ACTIVE_CHAIN.id).toBe(arbitrumSepolia.id);
	});

	it("selects Arbitrum One when NEXT_PUBLIC_CHAIN_ENV=mainnet in production", async () => {
		vi.stubEnv("NODE_ENV", "production");
		vi.stubEnv("NEXT_PUBLIC_CHAIN_ENV", "mainnet");
		vi.resetModules();
		const { ACTIVE_CHAIN } = await import("@/lib/chain-config");
		expect(ACTIVE_CHAIN.id).toBe(arbitrum.id);
	});

	it("throws on an unrecognized NEXT_PUBLIC_CHAIN_ENV", async () => {
		vi.stubEnv("NODE_ENV", "test");
		vi.stubEnv("NEXT_PUBLIC_CHAIN_ENV", "staging");
		vi.resetModules();
		await expect(import("@/lib/chain-config")).rejects.toThrow(
			/Unrecognized NEXT_PUBLIC_CHAIN_ENV/,
		);
	});
});

describe("chain-config production fail-closed", () => {
	it("throws when NEXT_PUBLIC_CHAIN_ENV is unset in a production build", async () => {
		vi.stubEnv("NODE_ENV", "production");
		vi.stubEnv("NEXT_PUBLIC_CHAIN_ENV", undefined);
		vi.resetModules();
		await expect(import("@/lib/chain-config")).rejects.toThrow(
			/NEXT_PUBLIC_CHAIN_ENV must be set/,
		);
	});
});

describe("chain-config PRIVY_APP_ID guard", () => {
	it("exports the configured Privy app id", async () => {
		vi.stubEnv("NODE_ENV", "test");
		vi.stubEnv("NEXT_PUBLIC_CHAIN_ENV", "testnet");
		vi.stubEnv("NEXT_PUBLIC_PRIVY_APP_ID", "app-123");
		vi.resetModules();
		const { PRIVY_APP_ID } = await import("@/lib/chain-config");
		expect(PRIVY_APP_ID).toBe("app-123");
	});

	it("throws when NEXT_PUBLIC_PRIVY_APP_ID is empty", async () => {
		vi.stubEnv("NODE_ENV", "test");
		vi.stubEnv("NEXT_PUBLIC_CHAIN_ENV", "testnet");
		vi.stubEnv("NEXT_PUBLIC_PRIVY_APP_ID", "");
		vi.resetModules();
		await expect(import("@/lib/chain-config")).rejects.toThrow(
			/NEXT_PUBLIC_PRIVY_APP_ID/,
		);
	});
});
