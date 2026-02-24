"use client";

import { useCreateWallet, usePrivy, useWallets } from "@privy-io/react-auth";
import { useSetActiveWallet } from "@privy-io/wagmi";
import { useEffect, useRef } from "react";
import { useSyncAccount } from "@/hooks/use-sync-account";
import { useWalletDisconnectListener } from "@/hooks/use-wallet-disconnect-listener";

export function EmbeddedWalletGuard({
	children,
}: { children: React.ReactNode }) {
	const { authenticated, ready } = usePrivy();
	const { wallets } = useWallets();
	const { setActiveWallet } = useSetActiveWallet();
	const { createWallet } = useCreateWallet();
	const isCreating = useRef(false);

	useSyncAccount();
	useWalletDisconnectListener();

	// Create embedded wallet if user is authenticated via social login but has none
	useEffect(() => {
		if (!ready || !authenticated || isCreating.current) return;

		const hasEmbeddedWallet = wallets.some(
			(w) => w.walletClientType === "privy",
		);

		if (hasEmbeddedWallet) return;

		// Only create if user has no embedded wallet (social login users)
		isCreating.current = true;
		createWallet().catch(() => {
			// Wallet may already exist — safe to ignore
		});
	}, [ready, authenticated, wallets, createWallet]);

	// Set embedded wallet as active when it becomes available
	useEffect(() => {
		if (!ready || !authenticated) return;

		const embeddedWallet = wallets.find(
			(w) => w.walletClientType === "privy",
		);

		if (embeddedWallet) {
			setActiveWallet(embeddedWallet);
		}
	}, [ready, authenticated, wallets, setActiveWallet]);

	// Reset when user logs out
	useEffect(() => {
		if (!authenticated) {
			isCreating.current = false;
		}
	}, [authenticated]);

	return <>{children}</>;
}
