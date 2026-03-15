"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useAccount, useDisconnect } from "wagmi";
import { AlertTriangle, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ACTIVE_CHAIN, ACTIVE_CHAIN_LABEL } from "@/lib/chain-config";

const EXPECTED_CAIP2 = `eip155:${ACTIVE_CHAIN.id}`;

export function WrongNetworkBanner() {
	const { wallets } = useWallets();
	const { logout, authenticated, ready } = usePrivy();
	const { disconnect } = useDisconnect();
	const { address: activeAddress } = useAccount();
	const [switching, setSwitching] = useState(false);
	const [dismissed, setDismissed] = useState(false);

	// Find the external wallet that matches the active wagmi account
	const externalWallet = wallets.find(
		(w) =>
			w.walletClientType !== "privy" &&
			(!activeAddress ||
				w.address.toLowerCase() === activeAddress.toLowerCase()),
	);

	// Check if the external wallet is on the wrong chain
	// Privy wallet chainId is in CAIP-2 format: "eip155:<chainId>"
	const isWrongNetwork =
		ready &&
		authenticated &&
		externalWallet != null &&
		externalWallet.chainId !== EXPECTED_CAIP2;

	// Reset dismissed state when network changes to correct one and back
	useEffect(() => {
		if (!isWrongNetwork) {
			setDismissed(false);
		}
	}, [isWrongNetwork]);

	const handleSwitch = useCallback(async () => {
		if (!externalWallet) return;
		setSwitching(true);
		try {
			await externalWallet.switchChain(ACTIVE_CHAIN.id);
		} catch {
			// User rejected or switch failed — keep banner visible
		} finally {
			setSwitching(false);
		}
	}, [externalWallet]);

	const handleDisconnect = useCallback(async () => {
		try {
			disconnect();
			await logout();
		} catch {
			// If disconnect/logout fails, still dismiss the dialog
		}
		setDismissed(true);
	}, [disconnect, logout]);

	if (!isWrongNetwork || dismissed) return null;

	return (
		<div
			className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm"
			style={{ zIndex: 99999 }}
		>
			<div className="relative mx-4 flex max-w-md flex-col items-center gap-4 rounded-xl border border-white/10 bg-[#111] p-8 text-center">
				<button
					type="button"
					onClick={() => setDismissed(true)}
					className="absolute right-3 top-3 rounded-md p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
				>
					<X className="h-4 w-4" />
				</button>
				<AlertTriangle className="h-10 w-10 text-yellow-400" />
				<h2 className="text-lg font-semibold text-white">Wrong Network</h2>
				<p className="text-sm text-white/70">
					Centuari only supports{" "}
					<span className="font-medium text-white">{ACTIVE_CHAIN_LABEL}</span>. Please
					switch your wallet network to continue.
				</p>
				<div className="mt-2 flex flex-col gap-2">
					<button
						type="button"
						onClick={handleSwitch}
						disabled={switching}
						className="rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
					>
						{switching ? "Switching..." : `Switch to ${ACTIVE_CHAIN_LABEL}`}
					</button>
					<button
						type="button"
						onClick={handleDisconnect}
						className="rounded-lg border border-white/20 px-6 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
					>
						Disconnect Wallet
					</button>
				</div>
			</div>
		</div>
	);
}
