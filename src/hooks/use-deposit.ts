"use client";

import { useState, useCallback } from "react";
import { useWriteContract, usePublicClient, useAccount } from "wagmi";
import { parseUnits, erc20Abi } from "viem";
import { treasuryAbi } from "@/../abis/treasury";
import type { DepositToken } from "@/lib/api";

const TREASURY_ADDRESS = process.env
	.NEXT_PUBLIC_TREASURY_ADDRESS as `0x${string}`;

export type DepositStatus =
	| "idle"
	| "checkingAllowance"
	| "approving"
	| "waitingApproval"
	| "depositing"
	| "confirming"
	| "success"
	| "error";

interface DepositResult {
	transactionHash: string;
	status: string;
}

export function useDeposit() {
	const { address } = useAccount();
	const publicClient = usePublicClient();
	const { writeContractAsync } = useWriteContract();
	const [status, setStatus] = useState<DepositStatus>("idle");
	const [error, setError] = useState<string | null>(null);

	const deposit = useCallback(
		async (
			_assetId: string,
			amount: string,
			token?: DepositToken,
		): Promise<DepositResult | null> => {
			setStatus("checkingAllowance");
			setError(null);

			try {
				if (!address) {
					throw new Error("Wallet not connected");
				}

				if (!publicClient) {
					throw new Error("Public client not available");
				}

				if (!token) {
					throw new Error("Token info is required for deposits");
				}

				const decimals = token.decimals ?? 18;
				const tokenAddress = token.tokenAddress as `0x${string}`;
				const depositAmount = parseUnits(amount, decimals);

				// Step 1: Check current allowance
				const currentAllowance = await publicClient.readContract({
					address: tokenAddress,
					abi: erc20Abi,
					functionName: "allowance",
					args: [address, TREASURY_ADDRESS],
				});

				// Step 2: Approve if needed (exact amount)
				if (currentAllowance < depositAmount) {
					setStatus("approving");
					const approveTxHash = await writeContractAsync({
						address: tokenAddress,
						abi: erc20Abi,
						functionName: "approve",
						args: [TREASURY_ADDRESS, depositAmount],
					});

					setStatus("waitingApproval");
					const approveReceipt =
						await publicClient.waitForTransactionReceipt({
							hash: approveTxHash,
							timeout: 60_000,
						});

					if (approveReceipt.status === "reverted") {
						throw new Error("Approve transaction reverted on-chain");
					}
				}

				// Step 3: Call Treasury.deposit
				setStatus("depositing");
				const depositTxHash = await writeContractAsync({
					address: TREASURY_ADDRESS,
					abi: treasuryAbi,
					functionName: "deposit",
					args: [tokenAddress, depositAmount],
				});

				// Step 4: Wait for deposit confirmation
				setStatus("confirming");
				const depositReceipt =
					await publicClient.waitForTransactionReceipt({
						hash: depositTxHash,
						timeout: 60_000,
					});

				if (depositReceipt.status === "reverted") {
					throw new Error("Deposit transaction reverted on-chain");
				}

				setStatus("success");
				return {
					transactionHash: depositTxHash,
					status: "confirmed",
				};
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
		[address, publicClient, writeContractAsync],
	);

	const reset = useCallback(() => {
		setStatus("idle");
		setError(null);
	}, []);

	return { deposit, status, error, reset };
}
