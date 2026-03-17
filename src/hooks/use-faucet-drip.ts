"use client";

import { useState, useCallback } from "react";
import { useWallets } from "@privy-io/react-auth";
import { requestFaucetTokens, type FaucetResponse } from "@/lib/api";
import { ACTIVE_CHAIN } from "@/lib/chain-config";

export type FaucetDripStatus = "idle" | "loading" | "success" | "error";

export function useFaucetDrip() {
	const { wallets } = useWallets();
	const [status, setStatus] = useState<FaucetDripStatus>("idle");
	const [error, setError] = useState<string | null>(null);

	const requestDrip = useCallback(
		async (tokenValues: string[]): Promise<FaucetResponse | null> => {
			if (tokenValues.length === 0) return null;

			setStatus("loading");
			setError(null);

			try {
				const wallet =
					wallets.find((w) => w.walletClientType !== "privy") ??
					wallets.find((w) => w.walletClientType === "privy") ??
					wallets[0];
				if (!wallet?.address) {
					throw new Error("No wallet connected");
				}

				const result = await requestFaucetTokens(
					ACTIVE_CHAIN.id,
					wallet.address,
					tokenValues,
				);
				setStatus("success");
				return result;
			} catch (err) {
				const message =
					err instanceof Error ? err.message : "Faucet request failed";
				setError(message);
				setStatus("error");
				return null;
			}
		},
		[wallets],
	);

	const reset = useCallback(() => {
		setStatus("idle");
		setError(null);
	}, []);

	return { requestDrip, status, error, reset };
}
