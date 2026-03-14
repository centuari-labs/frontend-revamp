"use client";

import { useCreateWallet, usePrivy, useWallets } from "@privy-io/react-auth";
import { useSetActiveWallet } from "@privy-io/wagmi";
import { useEffect, useRef } from "react";
import { ACTIVE_CHAIN } from "@/lib/chain-config";
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

	// Prefer external wallet for on-chain interactions, fallback to embedded
	// Also auto-switch external wallet to the correct chain
	const hasSwitchedChain = useRef(false);
	useEffect(() => {
		if (!ready || !authenticated) return;

		const externalWallet = wallets.find(
			(w) => w.walletClientType !== "privy",
		);
		const embeddedWallet = wallets.find(
			(w) => w.walletClientType === "privy",
		);

		const activeWallet = externalWallet ?? embeddedWallet;
		if (activeWallet) {
			setActiveWallet(activeWallet);
		}

		// Auto-switch external wallet to the correct chain on connect
		if (
			externalWallet &&
			externalWallet.chainId !== `eip155:${ACTIVE_CHAIN.id}` &&
			!hasSwitchedChain.current
		) {
			hasSwitchedChain.current = true;
			externalWallet.switchChain(ACTIVE_CHAIN.id).catch(() => {
				// Switch failed (unsupported chain or user rejected) — WrongNetworkBanner will handle it
			});
		}
	}, [ready, authenticated, wallets, setActiveWallet]);

	// Reset when user logs out
	useEffect(() => {
		if (!authenticated) {
			isCreating.current = false;
			hasSwitchedChain.current = false;
		}
	}, [authenticated]);

	return <>{children}</>;
}
