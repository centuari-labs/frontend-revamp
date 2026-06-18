"use client";

import { useCreateWallet, usePrivy, useWallets } from "@privy-io/react-auth";
import { useSetActiveWallet } from "@privy-io/wagmi";
import { useEffect, useRef } from "react";
import { useSyncAccount } from "@/hooks/use-sync-account";
import { useWalletDisconnectListener } from "@/hooks/use-wallet-disconnect-listener";

export function EmbeddedWalletGuard({
	children,
}: {
	children: React.ReactNode;
}) {
	const { authenticated, ready, user } = usePrivy();
	const { wallets } = useWallets();
	const { setActiveWallet } = useSetActiveWallet();
	const { createWallet } = useCreateWallet();
	const isCreating = useRef(false);

	useSyncAccount();
	useWalletDisconnectListener();

	// The wallet address the user authenticated with (via SIWE for external wallets)
	const _linkedWalletAddress = user?.wallet?.address?.toLowerCase();

	const hasExternalWallet = user?.linkedAccounts?.some(
		(a) =>
			a.type === "wallet" &&
			(a as { walletClientType?: string }).walletClientType !== "privy",
	);

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

	// Set embedded wallet as default active wallet.
	// For external wallet users, we intentionally do NOT set the login wallet
	// as active here — that would trigger a MetaMask connect popup on every
	// page refresh. Instead, the login wallet is activated on-demand when
	// the user initiates a transaction (see useDeposit).
	useEffect(() => {
		if (!ready || !authenticated || wallets.length === 0) return;

		const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");

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
