"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { getAddress, isAddress } from "viem";

function toCheckedAddress(
	value: string | undefined,
): `0x${string}` | undefined {
	if (!value || !isAddress(value)) return undefined;
	return getAddress(value);
}

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
 *
 * All return paths are guarded with viem's `isAddress` and normalized
 * via `getAddress` so callers never receive a malformed value.
 */
export function useWalletAddress(): `0x${string}` | undefined {
	const { user } = usePrivy();
	const { wallets } = useWallets();

	const privyAddress = toCheckedAddress(user?.wallet?.address);
	if (privyAddress) return privyAddress;

	const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
	const embeddedAddress = toCheckedAddress(embeddedWallet?.address);
	if (embeddedAddress) return embeddedAddress;

	return toCheckedAddress(wallets[0]?.address);
}
