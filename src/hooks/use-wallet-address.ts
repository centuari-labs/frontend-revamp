"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";

/**
 * Returns the correct wallet address for the current user.
 *
 * Uses Privy as the source of truth:
 * - External wallet users (SIWE): returns the address used during login
 * - Social login users: returns the embedded wallet address
 *
 * This should be used instead of wagmi's `useAccount()` for reading
 * operations (balance queries, allowance checks, etc.) because
 * external wallets are intentionally NOT set as active in wagmi
 * to prevent MetaMask from showing a connect popup on page refresh.
 */
export function useWalletAddress(): `0x${string}` | undefined {
	const { user } = usePrivy();
	const { wallets } = useWallets();

	// Privy user wallet address — set for SIWE users
	const privyAddress = user?.wallet?.address;
	if (privyAddress) return privyAddress as `0x${string}`;

	// Fallback to embedded wallet for social login users
	const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
	if (embeddedWallet) return embeddedWallet.address as `0x${string}`;

	// Fallback to first available wallet
	return wallets[0]?.address as `0x${string}` | undefined;
}
