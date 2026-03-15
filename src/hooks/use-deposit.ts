"use client";

import { useState, useCallback } from "react";
import { useWriteContract, usePublicClient, useAccount } from "wagmi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { parseUnits, erc20Abi } from "viem";
import { treasuryAbi } from "@/../abis/treasury";
import { confirmDeposit, type DepositToken } from "@/lib/api";
import { useAuthToken } from "@/hooks/use-auth-token";

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
  const queryClient = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const { getToken } = useAuthToken();
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
          const approveReceipt = await publicClient.waitForTransactionReceipt({
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
        const depositReceipt = await publicClient.waitForTransactionReceipt({
          hash: depositTxHash,
          timeout: 60_000,
        });

        if (depositReceipt.status === "reverted") {
          throw new Error("Deposit transaction reverted on-chain");
        }

        // Step 5: Confirm deposit with backend
        const jwt = await getToken();
        if (!jwt) {
          throw new Error("Not authenticated");
        }
        await confirmDeposit(depositTxHash, jwt);

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
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["my-assets"] });
      queryClient.invalidateQueries({ queryKey: ["my-portfolio"] });
      queryClient.invalidateQueries({
        queryKey: ["lend-borrow-assets"],
      });
    },
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
