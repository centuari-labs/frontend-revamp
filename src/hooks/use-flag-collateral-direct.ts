"use client";

import { useWallets } from "@privy-io/react-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createWalletClient, custom } from "viem";
import { collateralManagerAbi } from "@/../abis/collateralManager";
import { useWalletAddress } from "@/hooks/use-wallet-address";
import { ACTIVE_CHAIN, COLLATERAL_MANAGER_ADDRESS } from "@/lib/chain-config";
import { invalidateUserQueries } from "@/lib/query-keys";

/**
 * Emergency direct-flag path for pre-liquidation HF rescue. User pays gas
 * and signs via Privy. Calls `CollateralManager.flag(asset)`. Returns
 * optimistically after the wallet submits the tx — the Phase 3 badge
 * component re-polls the portfolio query (invalidated below) to reflect the
 * on-chain state once the indexer tail stamps `used_as_collateral=true`.
 *
 * Phase 2 known constraint: the `flag(address)` entry point is part of a
 * pending testnet upgrade. Until the upgrade ships, this call will revert
 * on-chain (the wallet still returns a txHash, but the tx fails). The
 * frontend wiring is forward-compat.
 *
 * Spec: smart-contract-revamp/docs/collateral-frontend-implementation.md (line 152)
 */
export function useFlagCollateralDirect() {
	const { wallets } = useWallets();
	const address = useWalletAddress();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ asset }: { asset: `0x${string}` }) => {
			if (!address) throw new Error("Wallet not connected");

			// Pick the signing wallet the same way `use-deposit.ts` does:
			// external wallet matching the active address first, embedded as fallback.
			const targetWallet =
				wallets.find(
					(w) =>
						w.walletClientType !== "privy" &&
						w.address.toLowerCase() === address.toLowerCase(),
				) ?? wallets.find((w) => w.walletClientType === "privy");

			if (!targetWallet) throw new Error("No wallet available for signing");

			const provider = await targetWallet.getEthereumProvider();
			const walletClient = createWalletClient({
				account: address,
				chain: ACTIVE_CHAIN,
				transport: custom(provider),
			});

			const txHash = await walletClient.writeContract({
				account: address,
				chain: ACTIVE_CHAIN,
				address: COLLATERAL_MANAGER_ADDRESS,
				abi: collateralManagerAbi,
				functionName: "flag",
				args: [asset],
			});

			return { txHash };
		},
		onSuccess: ({ txHash }) => {
			invalidateUserQueries(queryClient);
			toast.success(`Flag landing on-chain. Tx: ${txHash}`);
		},
		onError: (err) => {
			// viem surfaces user-rejected as { code: 4001 } either directly
			// or wrapped in `cause`. Catch both.
			const e = err as { code?: number; cause?: { code?: number } };
			const code = e?.code ?? e?.cause?.code;
			if (code === 4001) {
				toast.error("You rejected the transaction.");
			} else {
				toast.error(
					"Couldn't flag on-chain. Try again or use the cheap option.",
				);
			}
		},
	});
}
