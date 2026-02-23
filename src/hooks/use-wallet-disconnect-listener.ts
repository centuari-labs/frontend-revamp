"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect } from "react";
import { useDetectedWallets } from "./use-detected-wallets";

export function useWalletDisconnectListener() {
	const { authenticated, ready, user, logout } = usePrivy();
	const detectedWallets = useDetectedWallets();

	useEffect(() => {
		if (!ready || !authenticated || detectedWallets.length === 0) return;

		// Only listen if the user logged in via an external wallet (not email/social)
		const hasExternalWallet = user?.linkedAccounts?.some(
			(a) => a.type === "wallet" && (a as { walletClientType?: string }).walletClientType !== "privy",
		);
		if (!hasExternalWallet) return;

		const handleAccountsChanged = (accounts: unknown) => {
			const addrs = accounts as string[];
			if (addrs.length === 0) {
				logout();
			}
		};

		for (const wallet of detectedWallets) {
			wallet.provider.on("accountsChanged", handleAccountsChanged);
		}

		return () => {
			for (const wallet of detectedWallets) {
				wallet.provider.removeListener("accountsChanged", handleAccountsChanged);
			}
		};
	}, [ready, authenticated, user, detectedWallets, logout]);
}
