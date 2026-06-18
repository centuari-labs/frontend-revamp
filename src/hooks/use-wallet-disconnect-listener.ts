"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAccessContext } from "@/contexts/access-context";
import { useDetectedWallets } from "./use-detected-wallets";
export function useWalletDisconnectListener() {
	const { authenticated, ready, user, logout } = usePrivy();
	const detectedWallets = useDetectedWallets();
	const queryClient = useQueryClient();
	const { resetAccess } = useAccessContext();

	useEffect(() => {
		if (!ready || !authenticated || detectedWallets.length === 0) return;

		// Only listen if the user logged in via an external wallet (not email/social)
		const hasExternalWallet = user?.linkedAccounts?.some(
			(a) =>
				a.type === "wallet" &&
				(a as { walletClientType?: string }).walletClientType !== "privy",
		);
		if (!hasExternalWallet) return;

		// Log the user out AND wipe the TanStack Query cache so the previous
		// wallet's cached data never paints under the new wallet's address.
		const logoutAndClear = () => {
			resetAccess();
			logout();
			queryClient.clear();
		};

		const handleAccountsChanged = async (accounts: unknown) => {
			const addrs = accounts as string[];
			if (addrs.length === 0) {
				logoutAndClear();
				return;
			}

			// If the first address in the wallet doesn't match the current Privy user's address,
			// logout to force a re-sync with the new address.
			const newAddress = addrs[0]?.toLowerCase();
			const currentAddress = user?.wallet?.address?.toLowerCase();

			if (newAddress && currentAddress && newAddress !== currentAddress) {
				logoutAndClear();
			}
		};

		for (const wallet of detectedWallets) {
			wallet.provider.on("accountsChanged", handleAccountsChanged);
		}

		return () => {
			for (const wallet of detectedWallets) {
				wallet.provider.removeListener(
					"accountsChanged",
					handleAccountsChanged,
				);
			}
		};
	}, [
		ready,
		authenticated,
		user,
		detectedWallets,
		logout,
		queryClient,
		resetAccess,
	]);
}
