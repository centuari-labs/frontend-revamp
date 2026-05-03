"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthToken } from "@/hooks/use-auth-token";
import { type DepositToken, getDepositTokens } from "@/lib/api";
import { ACTIVE_CHAIN } from "@/lib/chain-config";
import { QUERY_CONFIG } from "@/lib/query-config";
import { QUERY_KEYS } from "@/lib/query-keys";
import { readTokenCache, setTokenCache } from "@/lib/token-cache";

export function useDepositTokens() {
	const { getToken } = useAuthToken();

	return useQuery<DepositToken[]>({
		queryKey: [QUERY_KEYS.DEPOSIT_TOKENS, ACTIVE_CHAIN.id],
		queryFn: async () => {
			const jwt = await getToken();
			const tokens = await getDepositTokens(jwt ?? "");
			setTokenCache(ACTIVE_CHAIN.id, tokens);
			return tokens;
		},
		initialData: () => readTokenCache(ACTIVE_CHAIN.id) ?? undefined,
		staleTime: QUERY_CONFIG.DEPOSIT_TOKENS_STALE_TIME,
		gcTime: Number.POSITIVE_INFINITY,
		retry: 1,
	});
}
