"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthToken } from "@/hooks/use-auth-token";
import { unflagCollateral } from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import { invalidateUserQueries } from "@/lib/query-keys";
import { formatTimestamp, humanizeSeconds } from "@/lib/utils";

/**
 * Remove a collateral flag. Branches on response shape rather than HTTP
 * status — `{ dequeued: true }` means the queue row was cleared (no on-chain
 * action), `{ applied: true, txHash }` means the backend submitted
 * `CollateralManager.unflagFor` and the indexer effect landed,
 * `{ applied: false, reason }` means the tx went out but the apply-effect
 * was rejected (rare).
 *
 * Spec: smart-contract-revamp/docs/collateral-frontend-implementation.md (line 185)
 */
export function useUnflagCollateral() {
	const { authFetch } = useAuthToken();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ asset }: { asset: `0x${string}` }) =>
			authFetch((token) => unflagCollateral(asset, token)),
		onSuccess: (response) => {
			invalidateUserQueries(queryClient);
			if ("dequeued" in response && response.dequeued) {
				toast.success("Pending collateral preference removed.");
			} else if ("applied" in response && response.applied) {
				toast.success(`Unflagged on-chain. Tx: ${response.txHash ?? ""}`);
			} else if ("applied" in response) {
				toast.warning(
					`Unflag couldn't be confirmed: ${response.reason ?? "unknown"}`,
				);
			}
		},
		onError: (err) => {
			if (err instanceof ApiError && err.code === "WOULD_MAKE_UNHEALTHY") {
				toast.error("Repaying debt is required to unflag this collateral.");
			} else if (
				err instanceof ApiError &&
				err.code === "FlagLockActive" &&
				err.unlocksAt !== undefined
			) {
				toast.error(
					`Unlocks at ${formatTimestamp(Number(err.unlocksAt) * 1000)}.`,
				);
			} else if (err instanceof ApiError && err.code === "RATE_LIMITED") {
				toast.error(
					`Too many actions — try again in ${humanizeSeconds(
						err.retryAfterSeconds ?? 0,
					)}.`,
				);
			} else {
				toast.error("Couldn't unflag. Try again.");
			}
		},
	});
}
