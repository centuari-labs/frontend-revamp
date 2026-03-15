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
	const { authenticated, ready, user } = usePrivy();
	const { wallets } = useWallets();
	const { setActiveWallet } = useSetActiveWallet();
	const { createWallet } = useCreateWallet();
	const isCreating = useRef(false);

	useSyncAccount();
	useWalletDisconnectListener();

	// The wallet address the user authenticated with (via SIWE)
	const linkedWalletAddress = user?.wallet?.address?.toLowerCase();

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

	// Prefer the wallet used for login, fallback to embedded
	// Also auto-switch external wallet to the correct chain
	const hasSwitchedChain = useRef(false);
	useEffect(() => {
		if (!ready || !authenticated) return;

		const embeddedWallet = wallets.find(
			(w) => w.walletClientType === "privy",
		);

		// Match the exact wallet used for login by address
		const loginWallet = linkedWalletAddress
			? wallets.find(
					(w) =>
						w.walletClientType !== "privy" &&
						w.address.toLowerCase() === linkedWalletAddress,
				)
			: undefined;

		const activeWallet = loginWallet ?? embeddedWallet;
		if (activeWallet) {
			setActiveWallet(activeWallet);
		}

		// Auto-switch the login wallet to the correct chain on connect
		if (
			loginWallet &&
			loginWallet.chainId !== `eip155:${ACTIVE_CHAIN.id}` &&
			!hasSwitchedChain.current
		) {
			hasSwitchedChain.current = true;
			loginWallet.switchChain(ACTIVE_CHAIN.id).catch(() => {
				// Switch failed — NetworkSwitcher in navbar will handle it
			});
		}
	}, [ready, authenticated, wallets, linkedWalletAddress, setActiveWallet]);

	// Reset when user logs out
	useEffect(() => {
		if (!authenticated) {
			isCreating.current = false;
			hasSwitchedChain.current = false;
		}
	}, [authenticated]);

	return <>{children}</>;
}
