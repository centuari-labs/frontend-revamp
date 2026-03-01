"use client";

import { useWallets } from "@privy-io/react-auth";
import { AlertTriangle } from "lucide-react";
import { useCallback, useState } from "react";
import { ACTIVE_CHAIN, ACTIVE_CHAIN_LABEL } from "@/lib/chain-config";

const EXPECTED_CAIP2 = `eip155:${ACTIVE_CHAIN.id}`;

export function WrongNetworkBanner() {
	const { wallets } = useWallets();
	const [switching, setSwitching] = useState(false);

	// Find any connected external (non-embedded) wallet
	const externalWallet = wallets.find(
		(w) => w.walletClientType !== "privy",
	);

	// Check if the external wallet is on the wrong chain
	// Privy wallet chainId is in CAIP-2 format: "eip155:<chainId>"
	const isWrongNetwork =
		externalWallet != null &&
		externalWallet.chainId !== EXPECTED_CAIP2;

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

	if (!isWrongNetwork) return null;

	return (
		<div
			className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm"
			style={{ zIndex: 99999 }}
		>
			<div className="mx-4 flex max-w-md flex-col items-center gap-4 rounded-xl border border-white/10 bg-[#111] p-8 text-center">
				<AlertTriangle className="h-10 w-10 text-yellow-400" />
				<h2 className="text-lg font-semibold text-white">Wrong Network</h2>
				<p className="text-sm text-white/70">
					Centuari only supports{" "}
					<span className="font-medium text-white">{ACTIVE_CHAIN_LABEL}</span>. Please
					switch your wallet network to continue.
				</p>
				<button
					type="button"
					onClick={handleSwitch}
					disabled={switching}
					className="mt-2 rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
				>
					{switching ? "Switching..." : `Switch to ${ACTIVE_CHAIN_LABEL}`}
				</button>
			</div>
		</div>
	);
}
