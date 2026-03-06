"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useEffect, useRef } from "react";
import { apiClient } from "@/lib/api-client";
import type { AccountResponse } from "@/lib/api";
import { useAuthToken } from "@/hooks/use-auth-token";

const LS_USERNAME_KEY = "centuari_username";

export function useSyncAccount() {
	const { authenticated, ready } = usePrivy();
	const { wallets } = useWallets();
	const { getToken } = useAuthToken();
	const hasSynced = useRef(false);

	useEffect(() => {
		if (!ready || !authenticated || hasSynced.current) return;

		// Any wallet is sufficient to trigger sync — prefer external, fallback to embedded
		const wallet = wallets.find((w) => w.walletClientType !== "privy")
			?? wallets.find((w) => w.walletClientType === "privy");
		if (!wallet) return;

		hasSynced.current = true;

		getToken().then((token) => {
			if (!token) return;
			apiClient<AccountResponse>("/auth/login", { method: "POST", token })
				.then((account) => {
					const storedName = localStorage.getItem(LS_USERNAME_KEY);
					if (!storedName && account.name) {
						localStorage.setItem(LS_USERNAME_KEY, account.name);
						window.dispatchEvent(new Event("centuari_username_changed"));
					}
				})
				.catch((err) => {
					console.error("Failed to sync account:", err);
				});
		});
	}, [ready, authenticated, wallets, getToken]);

	// Reset when user logs out
	useEffect(() => {
		if (!authenticated) {
			hasSynced.current = false;
		}
	}, [authenticated]);
}
