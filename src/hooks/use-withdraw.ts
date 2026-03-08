"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthToken } from "./use-auth-token";
import { submitWithdraw } from "@/lib/api";
import { USE_MOCK } from "@/lib/use-mock";

export type WithdrawStatus =
	| "idle"
	| "withdrawing"
	| "confirming"
	| "success"
	| "error";

interface UseWithdrawReturn {
	withdraw: (assetId: string, amount: string) => Promise<void>;
	status: WithdrawStatus;
	error: string | null;
	txHash: string | null;
	reset: () => void;
}

export function useWithdraw(): UseWithdrawReturn {
	const { getToken } = useAuthToken();
	const queryClient = useQueryClient();
	const [status, setStatus] = useState<WithdrawStatus>("idle");
	const [error, setError] = useState<string | null>(null);
	const [txHash, setTxHash] = useState<string | null>(null);

	const withdraw = useCallback(
		async (assetId: string, amount: string) => {
			setStatus("withdrawing");
			setError(null);
			setTxHash(null);

			try {
				if (USE_MOCK) {
					// Mock mode: simulate processing
					await new Promise((resolve) => setTimeout(resolve, 1500));
					setTxHash("0xmock_tx_hash");
					setStatus("success");
					return;
				}

				const token = await getToken();
				if (!token) {
					throw new Error("Authentication required");
				}

				setStatus("confirming");
				const result = await submitWithdraw(assetId, amount, token);

				setTxHash(result.txHash);
				setStatus("success");

				// Invalidate relevant queries
				queryClient.invalidateQueries({ queryKey: ["my-assets"] });
				queryClient.invalidateQueries({ queryKey: ["my-portfolio"] });
				queryClient.invalidateQueries({
					queryKey: ["lend-borrow-assets"],
				});
			} catch (err) {
				const message =
					err instanceof Error ? err.message : "Withdrawal failed";
				setError(message);
				setStatus("error");
			}
		},
		[getToken, queryClient],
	);

	const reset = useCallback(() => {
		setStatus("idle");
		setError(null);
		setTxHash(null);
	}, []);

	return { withdraw, status, error, txHash, reset };
}
