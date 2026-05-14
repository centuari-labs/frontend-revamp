"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useEffect, useRef } from "react";
import { useDisconnect } from "wagmi";
import { apiClient } from "@/lib/api-client";
import type { AccountResponse } from "@/lib/api";
import { useAuthToken } from "@/hooks/use-auth-token";
import { useAccessContext } from "@/contexts/access-context";

const LS_USERNAME_KEY = "centuari_username";

export function useSyncAccount() {
	const { authenticated, ready, logout } = usePrivy();
	const { wallets } = useWallets();
	const { authFetch } = useAuthToken();
	const { disconnect } = useDisconnect();
	const { setHasAccess } = useAccessContext();
	const hasSynced = useRef(false);

	useEffect(() => {
		if (!ready || !authenticated || hasSynced.current) return;

		// Any wallet is sufficient to trigger sync — prefer external, fallback to embedded
		const wallet =
			wallets.find((w) => w.walletClientType !== "privy") ??
			wallets.find((w) => w.walletClientType === "privy");
		if (!wallet) return;

		hasSynced.current = true;

		authFetch((token) =>
			apiClient<AccountResponse>("/auth/login", { method: "POST", token }),
		)
			.then((account) => {
				setHasAccess(account.access_granted);

				const storedName = localStorage.getItem(LS_USERNAME_KEY);
				if (!storedName && account.name) {
					localStorage.setItem(LS_USERNAME_KEY, account.name);
					window.dispatchEvent(new Event("centuari_username_changed"));
				}
			})
			.catch((err) => {
				console.error("Failed to sync account:", err);
				hasSynced.current = false;
				logout();
				disconnect();
				localStorage.removeItem(LS_USERNAME_KEY);
			});
	}, [
		ready,
		authenticated,
		wallets,
		authFetch,
		logout,
		disconnect,
		setHasAccess,
	]);

	// Reset when user logs out
	useEffect(() => {
		if (!authenticated) {
			hasSynced.current = false;
		}
	}, [authenticated]);
}
