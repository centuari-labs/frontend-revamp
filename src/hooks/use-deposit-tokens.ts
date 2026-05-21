"use client";

import { useQuery } from "@tanstack/react-query";
import { getDepositTokens, type DepositToken } from "@/lib/api";
import { useAuthToken } from "@/hooks/use-auth-token";
import { ACTIVE_CHAIN } from "@/lib/chain-config";
import { isAllowlistedAddress } from "@/lib/token-config";
import { QUERY_CONFIG } from "@/lib/query-config";

export function useDepositTokens() {
	const { getToken } = useAuthToken();

	return useQuery({
		queryKey: ["deposit-tokens"],
		queryFn: async () => {
			const jwt = await getToken();
			const raw = await getDepositTokens(jwt ?? "");
			return filterAllowlistedTokens(raw);
		},
		staleTime: QUERY_CONFIG.DEPOSIT_TOKENS_STALE_TIME,
		retry: 1,
	});
}

function filterAllowlistedTokens(tokens: DepositToken[]): DepositToken[] {
	const chainId = ACTIVE_CHAIN.id;
	return tokens.filter((t) => {
		if (isAllowlistedAddress(chainId, t.tokenAddress)) return true;
		console.warn(
			`[useDepositTokens] dropping non-allowlisted token: ${t.symbol} (${t.tokenAddress})`,
		);
		return false;
	});
}
