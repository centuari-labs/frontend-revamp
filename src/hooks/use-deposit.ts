"use client";

import { useState, useCallback } from "react";
import { useWriteContract, usePublicClient } from "wagmi";
import { parseUnits, erc20Abi } from "viem";
import { USE_MOCK } from "@/lib/use-mock";
import { verifyDeposit, type DepositResponse, type DepositToken } from "@/lib/api";
import { useAuthToken } from "@/hooks/use-auth-token";

const TREASURY_ADDRESS =
	"0x122ea513fE68d78CdAD06F982237B1b67a335439" as const;

export type DepositStatus =
	| "idle"
	| "pendingApproval"
	| "pendingConfirmation"
	| "verifying"
	| "success"
	| "error";

export function useDeposit() {
	const { getToken } = useAuthToken();
	const publicClient = usePublicClient();
	const { writeContractAsync } = useWriteContract();
	const [status, setStatus] = useState<DepositStatus>("idle");
	const [error, setError] = useState<string | null>(null);
	const [data, setData] = useState<DepositResponse | null>(null);

	const deposit = useCallback(
		async (
			assetId: string,
			amount: string,
			token?: DepositToken,
		): Promise<DepositResponse | null> => {
			setStatus("pendingApproval");
			setError(null);

			try {
				if (USE_MOCK) {
					await new Promise((r) => setTimeout(r, 1500));
					const mock: DepositResponse = {
						transactionHash: `0x${"0".repeat(64)}`,
						status: "confirmed",
					};
					setData(mock);
					setStatus("success");
					return mock;
				}

				if (!token) {
					throw new Error("Token info is required for deposits");
				}

				if (!publicClient) {
					throw new Error("Wallet not connected");
				}

				const decimals = token.decimals ?? 18;
				const tokenAddress = token.tokenAddress as `0x${string}`;

				// Step 1: Send ERC20 transfer via wallet (user approves in wallet popup)
				const txHash = await writeContractAsync({
					address: tokenAddress,
					abi: erc20Abi,
					functionName: "transfer",
					args: [TREASURY_ADDRESS, parseUnits(amount, decimals)],
				});

				// Step 2: Wait for tx to be mined
				setStatus("pendingConfirmation");
				const receipt = await publicClient.waitForTransactionReceipt({
					hash: txHash,
				});

				if (receipt.status === "reverted") {
					throw new Error("Transaction reverted on-chain");
				}

				// Step 3: Call backend to verify and credit the deposit
				setStatus("verifying");
				const jwt = await getToken();
				if (!jwt) {
					throw new Error("Not authenticated");
				}

				const result = await verifyDeposit(txHash, assetId, amount, jwt);
				setData(result);
				setStatus("success");
				return result;
			} catch (err) {
				const message =
					err instanceof Error ? err.message : "Deposit failed";

				const isUserRejection =
					message.includes("User rejected") ||
					message.includes("user rejected") ||
					message.includes("User denied") ||
					message.includes("ACTION_REJECTED");

				setError(
					isUserRejection ? "Transaction was rejected" : message,
				);
				setStatus("error");
				return null;
			}
		},
		[getToken, publicClient, writeContractAsync],
	);

	const reset = useCallback(() => {
		setStatus("idle");
		setError(null);
		setData(null);
	}, []);

	return { deposit, status, error, data, reset };
}
