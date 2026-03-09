"use client";

import { useQuery } from "@tanstack/react-query";
import { getDepositTokens, type DepositToken } from "@/lib/api";
import { useAuthToken } from "@/hooks/use-auth-token";

export function useDepositTokens() {
	const { getToken } = useAuthToken();

	return useQuery({
		queryKey: ["deposit-tokens"],
		queryFn: async () => {
			const jwt = await getToken();
			// We no longer throw error if !jwt to allow unauthenticated viewing
			return getDepositTokens(jwt ?? "");
		},
		staleTime: 5 * 60 * 1000,
		retry: 1,
	});
}
