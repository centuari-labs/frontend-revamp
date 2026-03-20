"use client";

import { useCreateWallet, usePrivy, useWallets } from "@privy-io/react-auth";
import { useSetActiveWallet } from "@privy-io/wagmi";
import { useEffect, useRef } from "react";
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

	// The wallet address the user authenticated with (via SIWE for external wallets)
	const linkedWalletAddress = user?.wallet?.address?.toLowerCase();

	const hasExternalWallet = user?.linkedAccounts?.some(
		(a) =>
			a.type === "wallet" &&
			(a as { walletClientType?: string }).walletClientType !== "privy",
	);

	// Debug: log wallet state
	useEffect(() => {
		if (!ready) return;
		console.log("[WalletGuard]", {
			authenticated,
			hasExternalWallet,
			walletsCount: wallets.length,
			wallets: wallets.map((w) => ({
				type: w.walletClientType,
				address: w.address,
			})),
			privyUserWallet: user?.wallet?.address,
		});
	}, [ready, authenticated, wallets, user, hasExternalWallet]);

	// Create embedded wallet for social login users who don't have one yet.
	// Privy's `createOnLogin: "users-without-wallets"` handles most cases,
	// but this is a safety net for edge cases where it doesn't fire.
	useEffect(() => {
		if (!ready || !authenticated || isCreating.current || hasExternalWallet)
			return;

		const hasEmbeddedWallet = wallets.some(
			(w) => w.walletClientType === "privy",
		);
		if (hasEmbeddedWallet) return;

		isCreating.current = true;
		createWallet().catch(() => {
			// Wallet may already exist — safe to ignore
		});
	}, [ready, authenticated, wallets, createWallet, hasExternalWallet]);

	// Set the active wallet in wagmi so hooks like useAccount/useBalance
	// return the correct address for the current user.
	useEffect(() => {
		if (!ready || !authenticated || wallets.length === 0) return;

		const embeddedWallet = wallets.find(
			(w) => w.walletClientType === "privy",
		);

		if (hasExternalWallet) {
			// For external wallet users: find the wallet that matches the
			// address used during SIWE login. Do NOT call setActiveWallet
			// with external wallets — it triggers a MetaMask connect popup.
			// Instead, set the embedded wallet (if any) as a safe default.
			if (embeddedWallet) {
				setActiveWallet(embeddedWallet);
			}
		} else if (embeddedWallet) {
			// For social login users: always set embedded wallet as active
			setActiveWallet(embeddedWallet);
		}
	}, [
		ready,
		authenticated,
		wallets,
		hasExternalWallet,
		linkedWalletAddress,
		setActiveWallet,
	]);

	// Reset when user logs out
	useEffect(() => {
		if (!authenticated) {
			isCreating.current = false;
		}
	}, [authenticated]);

	return <>{children}</>;
}
