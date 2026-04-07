"use client";

import { useQuery } from "@tanstack/react-query";
import { getDepositBalance, type BalanceResponse } from "@/lib/api";
import { useAuthToken } from "@/hooks/use-auth-token";

export function useDepositBalance(assetId: string | undefined) {
	const { authFetch } = useAuthToken();

	return useQuery({
		queryKey: ["deposit-balance", assetId],
		queryFn: (): Promise<BalanceResponse> =>
			authFetch((jwt) => getDepositBalance(assetId!, jwt)),
		enabled: !!assetId,
		refetchInterval: 30_000,
		staleTime: 10_000,
		retry: 1,
	});
}
