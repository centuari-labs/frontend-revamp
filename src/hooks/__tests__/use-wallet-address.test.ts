import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUsePrivy = vi.fn();
const mockUseWallets = vi.fn();

vi.mock("@privy-io/react-auth", () => ({
	usePrivy: () => mockUsePrivy(),
	useWallets: () => mockUseWallets(),
}));

import { useWalletAddress } from "@/hooks/use-wallet-address";

const VALID_LOWER = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
const VALID_CHECKSUMMED = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const ANOTHER_VALID_LOWER = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";
const ANOTHER_VALID_CHECKSUMMED = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

beforeEach(() => {
	mockUsePrivy.mockReturnValue({ user: null });
	mockUseWallets.mockReturnValue({ wallets: [] });
});

describe("useWalletAddress", () => {
	it("returns checksummed Privy address for SIWE users", () => {
		mockUsePrivy.mockReturnValue({
			user: { wallet: { address: VALID_LOWER } },
		});
		const { result } = renderHook(() => useWalletAddress());
		expect(result.current).toBe(VALID_CHECKSUMMED);
	});

	it("normalizes already-checksummed Privy address", () => {
		mockUsePrivy.mockReturnValue({
			user: { wallet: { address: VALID_CHECKSUMMED } },
		});
		const { result } = renderHook(() => useWalletAddress());
		expect(result.current).toBe(VALID_CHECKSUMMED);
	});

	it("falls back to embedded wallet when Privy user has no wallet", () => {
		mockUseWallets.mockReturnValue({
			wallets: [{ walletClientType: "privy", address: ANOTHER_VALID_LOWER }],
		});
		const { result } = renderHook(() => useWalletAddress());
		expect(result.current).toBe(ANOTHER_VALID_CHECKSUMMED);
	});

	it("falls back to first wallet when neither Privy user nor embedded wallet exist", () => {
		mockUseWallets.mockReturnValue({
			wallets: [{ walletClientType: "metamask", address: ANOTHER_VALID_LOWER }],
		});
		const { result } = renderHook(() => useWalletAddress());
		expect(result.current).toBe(ANOTHER_VALID_CHECKSUMMED);
	});

	it("returns undefined when no wallet sources are available", () => {
		const { result } = renderHook(() => useWalletAddress());
		expect(result.current).toBeUndefined();
	});

	it("returns undefined when Privy returns a malformed address", () => {
		mockUsePrivy.mockReturnValue({
			user: { wallet: { address: "0xnot-a-real-address" } },
		});
		const { result } = renderHook(() => useWalletAddress());
		expect(result.current).toBeUndefined();
	});

	it("returns undefined when Privy returns an empty string", () => {
		mockUsePrivy.mockReturnValue({ user: { wallet: { address: "" } } });
		const { result } = renderHook(() => useWalletAddress());
		expect(result.current).toBeUndefined();
	});

	it("skips malformed Privy address and falls back to a valid embedded wallet", () => {
		mockUsePrivy.mockReturnValue({ user: { wallet: { address: "garbage" } } });
		mockUseWallets.mockReturnValue({
			wallets: [{ walletClientType: "privy", address: ANOTHER_VALID_LOWER }],
		});
		const { result } = renderHook(() => useWalletAddress());
		expect(result.current).toBe(ANOTHER_VALID_CHECKSUMMED);
	});

	it("returns undefined when every source contains a malformed address", () => {
		mockUsePrivy.mockReturnValue({ user: { wallet: { address: "0xbad" } } });
		mockUseWallets.mockReturnValue({
			wallets: [
				{ walletClientType: "privy", address: "0xalsobad" },
				{ walletClientType: "metamask", address: "" },
			],
		});
		const { result } = renderHook(() => useWalletAddress());
		expect(result.current).toBeUndefined();
	});
});
