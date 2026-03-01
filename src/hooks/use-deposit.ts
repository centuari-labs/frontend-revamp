"use client";

import { useState, useCallback } from "react";
import { USE_MOCK } from "@/lib/use-mock";
import { submitDeposit, type DepositResponse } from "@/lib/api";
import { useAuthToken } from "@/hooks/use-auth-token";

export type DepositStatus = "idle" | "loading" | "success" | "error";

export function useDeposit() {
	const { getToken } = useAuthToken();
	const [status, setStatus] = useState<DepositStatus>("idle");
	const [error, setError] = useState<string | null>(null);
	const [data, setData] = useState<DepositResponse | null>(null);

	const deposit = useCallback(
		async (
			assetId: string,
			amount: string,
		): Promise<DepositResponse | null> => {
			setStatus("loading");
			setError(null);

			try {
				if (USE_MOCK) {
					await new Promise((r) => setTimeout(r, 1500));
					const mock: DepositResponse = {
						transactionHash: `0x${"0".repeat(64)}`,
						status: "submitted",
					};
					setData(mock);
					setStatus("success");
					return mock;
				}

				const jwt = await getToken();
				if (!jwt) {
					throw new Error("Not authenticated");
				}

				const result = await submitDeposit(assetId, amount, jwt);
				setData(result);
				setStatus("success");
				return result;
			} catch (err) {
				const message =
					err instanceof Error ? err.message : "Deposit failed";
				setError(message);
				setStatus("error");
				return null;
			}
		},
		[getToken],
	);

	const reset = useCallback(() => {
		setStatus("idle");
		setError(null);
		setData(null);
	}, []);

	return { deposit, status, error, data, reset };
}
