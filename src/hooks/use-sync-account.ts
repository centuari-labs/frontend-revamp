"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useEffect, useRef } from "react";
import { apiClient } from "@/lib/api-client";

export function useSyncAccount() {
	const { authenticated, ready, getAccessToken } = usePrivy();
	const { wallets } = useWallets();
	const hasSynced = useRef(false);

	useEffect(() => {
		if (!ready || !authenticated || hasSynced.current) return;

		const embeddedWallet = wallets.find(
			(w) => w.walletClientType === "privy",
		);
		if (!embeddedWallet) return;

		hasSynced.current = true;

		getAccessToken().then((token) => {
			if (!token) return;
			apiClient("/auth/login", { method: "POST", token }).catch((err) => {
				console.error("Failed to sync account:", err);
			});
		});
	}, [ready, authenticated, wallets, getAccessToken]);

	// Reset when user logs out
	useEffect(() => {
		if (!authenticated) {
			hasSynced.current = false;
		}
	}, [authenticated]);
}
