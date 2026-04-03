"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyPortfolio, type MyPortfolioResponse } from "@/lib/api";
import { useAuthToken } from "@/hooks/use-auth-token";
import { QUERY_KEYS } from "@/lib/query-keys";
import { usePrivy } from "@privy-io/react-auth";

export function useMyPortfolio() {
  const { getToken } = useAuthToken();
  const { user } = usePrivy();
  const address = user?.wallet?.address;

  const query = useQuery<MyPortfolioResponse>({
    queryKey: [QUERY_KEYS.MY_PORTFOLIO, address],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("No auth token");
      return getMyPortfolio(token);
    },
    staleTime: 10_000,
    refetchInterval: 15_000,
    enabled: !!address,
  });

  return {
    portfolio: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
