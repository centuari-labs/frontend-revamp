"use client";

import { useQuery } from "@tanstack/react-query";
import { USE_MOCK } from "@/lib/use-mock";
import { getDepositTokens, type DepositToken } from "@/lib/api";
import { useAuthToken } from "@/hooks/use-auth-token";
import { TOKENS } from "@/lib/tokens";

const MOCK_TOKENS: DepositToken[] = TOKENS.map((t, i) => ({
	id: `mock-${t.value}`,
	symbol: t.label,
	name: t.label,
	tokenAddress: `0x${"0".repeat(39)}${i}`,
	decimals: 18,
	imageUrl: t.icon,
	chainId: 421614,
}));

export function useDepositTokens() {
	const { getToken } = useAuthToken();

	return useQuery({
		queryKey: ["deposit-tokens"],
		queryFn: async () => {
			if (USE_MOCK) {
				return MOCK_TOKENS;
			}
			const jwt = await getToken();
			if (!jwt) throw new Error("Not authenticated");
			return getDepositTokens(jwt);
		},
		staleTime: 5 * 60 * 1000,
		retry: 1,
	});
}
