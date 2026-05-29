"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthToken } from "./use-auth-token";
import { getWithdrawableMax, type WithdrawableMaxResponse } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/query-keys";
import { USE_MOCK } from "@/lib/use-mock";

/**
 * HF-aware withdrawal limits for a single asset. Powers the withdraw dialog's
 * max-withdrawable + projected-HF and the "Remove as collateral" button's
 * enabled state.
 *
 * Only fetches for collateral assets — the limits/`canUnflag` are moot for a
 * non-collateral asset (its whole balance is freely withdrawable). In mock
 * mode the query stays disabled and returns null, so consumers fall back to
 * permissive defaults (full balance, button enabled).
 */
export function useWithdrawableMax(
	assetId: string | undefined | null,
	isCollateral: boolean | undefined,
) {
	const { getToken } = useAuthToken();

	const query = useQuery<WithdrawableMaxResponse>({
		queryKey: [QUERY_KEYS.WITHDRAWABLE_MAX, assetId],
		queryFn: async () => {
			if (!assetId) throw new Error("Missing assetId");
			const token = await getToken();
			if (!token) throw new Error("No auth token");
			return getWithdrawableMax(assetId, token);
		},
		enabled: !USE_MOCK && !!assetId && isCollateral === true,
	});

	return {
		withdrawableMax: query.data ?? null,
		isLoading: query.isLoading,
		isError: query.isError,
	};
}
