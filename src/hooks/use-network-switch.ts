"use client";

import { useState, useCallback } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { toast } from "sonner";
import { ACTIVE_CHAIN } from "@/lib/chain-config";

const EXPECTED_CAIP2 = `eip155:${ACTIVE_CHAIN.id}`;

export function useNetworkSwitch() {
	const { user } = usePrivy();
	const { wallets } = useWallets();
	const [switchingChain, setSwitchingChain] = useState(false);

	const linkedAddr = user?.wallet?.address?.toLowerCase();
	const loginWallet = linkedAddr
		? wallets.find(
				(w) =>
					w.walletClientType !== "privy" &&
					w.address.toLowerCase() === linkedAddr,
			)
		: undefined;

	const isWrongNetwork =
		loginWallet != null && loginWallet.chainId !== EXPECTED_CAIP2;

	const handleSwitchChain = useCallback(async () => {
		if (!loginWallet || switchingChain) return;
		setSwitchingChain(true);
		try {
			await loginWallet.switchChain(ACTIVE_CHAIN.id);
		} catch {
			toast.error("Failed to switch network");
		} finally {
			setSwitchingChain(false);
		}
	}, [loginWallet, switchingChain]);

	return { isWrongNetwork, switchingChain, handleSwitchChain };
}
