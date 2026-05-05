"use client";

import { useQuery } from "@tanstack/react-query";
import { getDepositBalance, type BalanceResponse } from "@/lib/api";
import { useAuthToken } from "@/hooks/use-auth-token";
import { QUERY_CONFIG } from "@/lib/query-config";

export function useDepositBalance(assetId: string | undefined) {
	const { authFetch } = useAuthToken();

	return useQuery({
		queryKey: ["deposit-balance", assetId],
		queryFn: (): Promise<BalanceResponse> =>
			authFetch((jwt) => getDepositBalance(assetId!, jwt)),
		enabled: !!assetId,
		refetchInterval: QUERY_CONFIG.LONG_POLLING_INTERVAL,
		retry: 1,
	});
}
