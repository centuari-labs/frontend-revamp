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
import { invalidateUserQueries } from "@/lib/query-keys";

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

export function useDeposit() {
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

        const decimals = token.decimals ?? 18;
        const tokenAddress = token.tokenAddress as `0x${string}`;
        const depositAmount = parseUnits(amount, decimals);

        // Get the wallet client directly from Privy's wallet provider.
        // This bypasses wagmi's active connector, ensuring we always sign
        // with the correct wallet (login wallet for external, embedded for social).
        const targetWallet =
          wallets.find(
            (w) =>
              w.walletClientType !== "privy" &&
              w.address.toLowerCase() === address.toLowerCase(),
          ) ??
          wallets.find((w) => w.walletClientType === "privy");

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

        // Estimate gas fees with buffer to avoid "max fee per gas less than block base fee"
        const block = await publicClient.getBlock();
        const baseFee = block.baseFeePerGas ?? BigInt(0);
        const maxFeePerGas = (baseFee * GAS_FEE_MULTIPLIER) / BigInt(100);
        const maxPriorityFeePerGas = (baseFee * BigInt(25)) / BigInt(100); // 25% of base fee as tip
        const gasOverrides = { maxFeePerGas, maxPriorityFeePerGas };

        // Step 2: Approve if needed (exact amount)
        if (currentAllowance < depositAmount) {
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
        setStatus("error");
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
