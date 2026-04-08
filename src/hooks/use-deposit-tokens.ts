"use client";

import { useQuery } from "@tanstack/react-query";
import { getDepositTokens, type DepositToken } from "@/lib/api";
import { useAuthToken } from "@/hooks/use-auth-token";
import { QUERY_CONFIG } from "@/lib/query-config";

export function useDepositTokens() {
	const { getToken } = useAuthToken();

	return useQuery({
		queryKey: ["deposit-tokens"],
		queryFn: async () => {
			const jwt = await getToken();
			return getDepositTokens(jwt ?? "");
		},
		staleTime: QUERY_CONFIG.DEPOSIT_TOKENS_STALE_TIME,
		retry: 1,
	});
}
