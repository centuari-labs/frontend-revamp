"use client";

import { useState, useCallback } from "react";
import { usePublicClient } from "wagmi";
import { useWallets } from "@privy-io/react-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	parseUnits,
	erc20Abi,
	createWalletClient,
	custom,
	type WalletClient,
} from "viem";
import hubDepositorAbi from "@/../abis/HubDepositor.json";
import { confirmDeposit, type DepositToken } from "@/lib/api";
import { useAuthToken } from "@/hooks/use-auth-token";
import { useWalletAddress } from "@/hooks/use-wallet-address";
import { ACTIVE_CHAIN, HUB_DEPOSITOR_ADDRESS } from "@/lib/chain-config";
import { assertAllowlistedAddress } from "@/lib/token-config";
import { assertValidDecimals } from "@/lib/erc20-decimals";
import { DecimalsMismatchError, UserCancelledError } from "@/lib/errors";
import { invalidateUserQueries } from "@/lib/query-keys";
import type { TxConfirmationDetails } from "@/components/centuari-tx-confirm-dialog";

const SPENDER_LABEL = "Centuari Treasury (HubDepositor)";

export type ConfirmTransactionFn = (
	details: TxConfirmationDetails,
) => Promise<void>;

export interface UseDepositOptions {
	confirmTransaction?: ConfirmTransactionFn;
}

const GAS_FEE_MULTIPLIER = BigInt(150); // 1.5x buffer to prevent "max fee per gas less than block base fee"

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

export function useDeposit(options: UseDepositOptions = {}) {
	const { confirmTransaction } = options;
	const address = useWalletAddress();
	const { wallets } = useWallets();
	const publicClient = usePublicClient();
	const queryClient = useQueryClient();
	const { authFetch } = useAuthToken();
	const [status, setStatus] = useState<DepositStatus>("idle");

	const mutation = useMutation({
		mutationFn: async ({
			assetId,
			amount,
			token,
		}: {
			assetId: string;
			amount: string;
			token?: DepositToken;
		}): Promise<DepositResult | null> => {
			setStatus("checkingAllowance");

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

				assertValidDecimals(token.decimals, token.symbol);
				const tokenAddress = assertAllowlistedAddress(
					ACTIVE_CHAIN.id,
					token.tokenAddress,
					`token ${token.symbol}`,
				);

				// Get the wallet client directly from Privy's wallet provider.
				// This bypasses wagmi's active connector, ensuring we always sign
				// with the correct wallet (login wallet for external, embedded for social).
				const targetWallet =
					wallets.find(
						(w) =>
							w.walletClientType !== "privy" &&
							w.address.toLowerCase() === address.toLowerCase(),
					) ?? wallets.find((w) => w.walletClientType === "privy");

				if (!targetWallet) {
					throw new Error("No wallet available for signing");
				}

				const provider = await targetWallet.getEthereumProvider();
				const walletClient: WalletClient = createWalletClient({
					account: address,
					chain: ACTIVE_CHAIN,
					transport: custom(provider),
				});

				// Step 1: Check current allowance
				const currentAllowance = await publicClient.readContract({
					address: tokenAddress,
					abi: erc20Abi,
					functionName: "allowance",
					args: [address, HUB_DEPOSITOR_ADDRESS],
				});

				// Cross-check on-chain decimals against API-served value. Defense in
				// depth on top of assertValidDecimals — catches a backend that returns
				// a plausible-but-wrong value (e.g. 18 for a 6-decimal token).
				let onChainDecimals: number;
				try {
					const raw = await publicClient.readContract({
						address: tokenAddress,
						abi: erc20Abi,
						functionName: "decimals",
					});
					onChainDecimals = Number(raw);
				} catch (rpcErr) {
					throw new Error(
						`Could not verify token ${token.symbol} on-chain decimals. ${rpcErr instanceof Error ? rpcErr.message : ""}`.trim(),
					);
				}
				if (onChainDecimals !== token.decimals) {
					console.error("[useDeposit] token_decimals_mismatch", {
						tokenAddress,
						symbol: token.symbol,
						apiDecimals: token.decimals,
						onChainDecimals,
					});
					throw new DecimalsMismatchError({
						tokenAddress,
						symbol: token.symbol,
						apiDecimals: token.decimals,
						onChainDecimals,
					});
				}
				const depositAmount = parseUnits(amount, onChainDecimals);

				// Estimate gas fees with buffer to avoid "max fee per gas less than block base fee"
				const block = await publicClient.getBlock();
				const baseFee = block.baseFeePerGas ?? BigInt(0);
				const maxFeePerGas = (baseFee * GAS_FEE_MULTIPLIER) / BigInt(100);
				const maxPriorityFeePerGas = (baseFee * BigInt(25)) / BigInt(100); // 25% of base fee as tip
				const gasOverrides = { maxFeePerGas, maxPriorityFeePerGas };

				// Step 2: Approve if needed (exact amount)
				if (currentAllowance < depositAmount) {
					if (confirmTransaction) {
						await confirmTransaction({
							action: "Approve",
							amount,
							symbol: token.symbol,
							tokenAddress,
							spender: HUB_DEPOSITOR_ADDRESS,
							spenderLabel: SPENDER_LABEL,
							chainName: ACTIVE_CHAIN.name,
							chainId: ACTIVE_CHAIN.id,
						});
					}
					setStatus("approving");
					const approveTxHash = await walletClient.writeContract({
						account: address,
						chain: ACTIVE_CHAIN,
						address: tokenAddress,
						abi: erc20Abi,
						functionName: "approve",
						args: [HUB_DEPOSITOR_ADDRESS, depositAmount],
						...gasOverrides,
					});

					setStatus("waitingApproval");
					const approveReceipt = await publicClient.waitForTransactionReceipt({
						hash: approveTxHash,
						timeout: 60_000,
					});

					if (approveReceipt.status === "reverted") {
						throw new Error("Approve transaction reverted on-chain");
					}
				}

				// Step 3: Call HubDepositor.deposit
				if (confirmTransaction) {
					await confirmTransaction({
						action: "Deposit",
						amount,
						symbol: token.symbol,
						tokenAddress,
						spender: HUB_DEPOSITOR_ADDRESS,
						spenderLabel: SPENDER_LABEL,
						chainName: ACTIVE_CHAIN.name,
						chainId: ACTIVE_CHAIN.id,
					});
				}
				setStatus("depositing");
				// Re-fetch gas fees in case base fee changed during approval
				const latestBlock = await publicClient.getBlock();
				const latestBaseFee = latestBlock.baseFeePerGas ?? BigInt(0);
				const latestMaxFeePerGas =
					(latestBaseFee * GAS_FEE_MULTIPLIER) / BigInt(100);
				const latestMaxPriorityFeePerGas =
					(latestBaseFee * BigInt(25)) / BigInt(100);

				const depositTxHash = await walletClient.writeContract({
					account: address,
					chain: ACTIVE_CHAIN,
					address: HUB_DEPOSITOR_ADDRESS,
					abi: hubDepositorAbi,
					functionName: "deposit",
					args: [tokenAddress, depositAmount],
					maxFeePerGas: latestMaxFeePerGas,
					maxPriorityFeePerGas: latestMaxPriorityFeePerGas,
				});

				// Step 4: Wait for deposit confirmation
				setStatus("confirming");
				const depositReceipt = await publicClient.waitForTransactionReceipt({
					hash: depositTxHash,
					timeout: 60_000,
				});

				if (depositReceipt.status === "reverted") {
					throw new Error("Deposit transaction reverted on-chain");
				}

				// Step 5: Confirm deposit with backend
				await authFetch((jwt) => confirmDeposit(depositTxHash, jwt));

				setStatus("success");
				return {
					transactionHash: depositTxHash,
					status: "confirmed",
				};
			} catch (err) {
				if (err instanceof UserCancelledError) {
					setStatus("idle");
				} else {
					setStatus("error");
				}
				throw err;
			}
		},
		onSuccess: () => invalidateUserQueries(queryClient),
	});

	const reset = useCallback(() => {
		setStatus("idle");
		mutation.reset();
	}, [mutation]);

	return {
		...mutation,
		deposit: (assetId: string, amount: string, token?: DepositToken) =>
			mutation.mutateAsync({ assetId, amount, token }),
		status,
		error: mutation.error instanceof Error ? mutation.error.message : null,
		reset,
	};
}
