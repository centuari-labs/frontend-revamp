"use client";

import { useQuery } from "@tanstack/react-query";
import { getDepositBalance, type BalanceResponse } from "@/lib/api";
import { useAuthToken } from "@/hooks/use-auth-token";

export function useDepositBalance(assetId: string | undefined) {
	const { getToken } = useAuthToken();

	return useQuery({
		queryKey: ["deposit-balance", assetId],
		queryFn: async (): Promise<BalanceResponse> => {
			const jwt = await getToken();
			if (!jwt) throw new Error("Not authenticated");
			return getDepositBalance(assetId!, jwt);
		},
		enabled: !!assetId,
		refetchInterval: 30_000,
		staleTime: 10_000,
		retry: 1,
	});
}
