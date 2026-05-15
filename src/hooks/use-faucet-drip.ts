"use client";

import { useState, useCallback } from "react";
import { requestFaucetTokens, type FaucetResponse } from "@/lib/api";
import { ACTIVE_CHAIN } from "@/lib/chain-config";
import { useWalletAddress } from "@/hooks/use-wallet-address";
import { useAuthToken } from "@/hooks/use-auth-token";

export type FaucetDripStatus = "idle" | "loading" | "success" | "error";

export function useFaucetDrip() {
	const address = useWalletAddress();
	const { getToken } = useAuthToken();
	const [status, setStatus] = useState<FaucetDripStatus>("idle");
	const [error, setError] = useState<string | null>(null);
	const [transactionHash, setTransactionHash] = useState<string | null>(null);

	const requestDrip = useCallback(
		async (tokenValues: string[]): Promise<FaucetResponse | null> => {
			if (tokenValues.length === 0) return null;

			setStatus("loading");
			setError(null);
			setTransactionHash(null);

			try {
				if (!address) {
					throw new Error("No wallet connected");
				}

				const jwt = await getToken();
				const result = await requestFaucetTokens(
					ACTIVE_CHAIN.id,
					address,
					tokenValues,
					jwt ?? "",
				);
				setStatus("success");
				setTransactionHash(result.transactionHash);
				return result;
			} catch (err) {
				const message =
					err instanceof Error ? err.message : "Faucet request failed";
				setError(message);
				setStatus("error");
				return null;
			}
		},
		[address, getToken],
	);

	const reset = useCallback(() => {
		setStatus("idle");
		setError(null);
		setTransactionHash(null);
	}, []);

	return { requestDrip, status, error, transactionHash, reset };
}
