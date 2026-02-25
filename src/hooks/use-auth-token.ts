"use client";

import { useCallback } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";

const IS_DEV_AUTH =
	process.env.NEXT_PUBLIC_AUTH_MODE === "development";

/**
 * Returns a `getToken()` function that produces the correct auth token
 * for the current auth mode:
 * - `NEXT_PUBLIC_AUTH_MODE=development` → `DEV_TOKEN_<walletAddress>`
 * - Otherwise → real Privy JWT from `getAccessToken()`
 */
export function useAuthToken() {
	const { getAccessToken } = usePrivy();
	const { wallets } = useWallets();

	const getToken = useCallback(async (): Promise<string | null> => {
		if (IS_DEV_AUTH) {
			const wallet = wallets.find((w) => w.walletClientType === "privy");
			if (wallet?.address) {
				return `DEV_TOKEN_${wallet.address}`;
			}
			// Fallback: try any connected wallet
			if (wallets.length > 0 && wallets[0].address) {
				return `DEV_TOKEN_${wallets[0].address}`;
			}
			return null;
		}
		return getAccessToken();
	}, [getAccessToken, wallets]);

	return { getToken };
}
