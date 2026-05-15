"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthToken } from "@/hooks/use-auth-token";
import { flagCollateral } from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import { invalidateUserQueries } from "@/lib/query-keys";
import { humanizeSeconds } from "@/lib/utils";

/**
 * Queue a collateral flag for the next match settlement. No wallet signature,
 * no gas. Pass the `asset` address exactly as it appears in the indexer
 * portfolio response — hub-chain address for bridgeable tokens, spoke-chain
 * address for SPOKE_NATIVE tokens.
 *
 * Spec: smart-contract-revamp/docs/collateral-frontend-implementation.md (line 130)
 */
export function useFlagCollateral() {
	const { authFetch } = useAuthToken();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ asset }: { asset: `0x${string}` }) =>
			authFetch((token) => flagCollateral(asset, token)),
		onSuccess: () => {
			invalidateUserQueries(queryClient);
			toast.success(
				"Collateral preference saved. Will apply at your next match.",
			);
		},
		onError: (err) => {
			if (err instanceof ApiError && err.code === "COLLATERAL_LIMIT_EXCEEDED") {
				toast.error(
					`You've queued ${err.currentCount ?? "?"}/${err.cap ?? "?"} collateral flags.`,
				);
			} else if (err instanceof ApiError && err.code === "RATE_LIMITED") {
				toast.error(
					`Too many actions — try again in ${humanizeSeconds(
						err.retryAfterSeconds ?? 0,
					)}.`,
				);
			} else {
				toast.error("Couldn't save collateral preference. Try again.");
			}
		},
	});
}
