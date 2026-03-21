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
	// return the correct address and writeContractAsync signs with the right wallet.
	useEffect(() => {
		if (!ready || !authenticated || wallets.length === 0) return;

		const embeddedWallet = wallets.find(
			(w) => w.walletClientType === "privy",
		);

		if (hasExternalWallet && linkedWalletAddress) {
			// Find the wallet used during SIWE login
			const loginWallet = wallets.find(
				(w) =>
					w.walletClientType !== "privy" &&
					w.address.toLowerCase() === linkedWalletAddress,
			);

			if (loginWallet && loginWallet.walletClientType !== "metamask") {
				// Non-MetaMask external wallets (Rabby, Phantom, etc.) auto-approve
				// reconnection, so it's safe to set them as active.
				setActiveWallet(loginWallet);
			} else if (embeddedWallet) {
				// MetaMask or unknown: fall back to embedded wallet to avoid
				// triggering a MetaMask connect popup on every page refresh.
				setActiveWallet(embeddedWallet);
			}
		} else if (embeddedWallet) {
			// Social login users: always set embedded wallet as active
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
