"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyPortfolio, type MyPortfolioResponse } from "@/lib/api";
import { useAuthToken } from "@/hooks/use-auth-token";
import { QUERY_KEYS } from "@/lib/query-keys";
import { QUERY_CONFIG } from "@/lib/query-config";
import { usePrivy } from "@privy-io/react-auth";

export function useMyPortfolio() {
	const { authFetch } = useAuthToken();
	const { user } = usePrivy();
	const address = user?.wallet?.address;

	const query = useQuery<MyPortfolioResponse>({
		queryKey: [QUERY_KEYS.MY_PORTFOLIO, address],
		queryFn: () => authFetch((token) => getMyPortfolio(token)),
		refetchInterval: QUERY_CONFIG.POLLING_INTERVAL,
		enabled: !!address,
	});

	return {
		portfolio: query.data ?? null,
		isLoading: query.isLoading,
		isError: query.isError,
		refetch: query.refetch,
	};
}
