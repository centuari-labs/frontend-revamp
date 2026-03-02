"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyPortfolio, type MyPortfolioResponse } from "@/lib/api";
import { USE_MOCK } from "@/lib/use-mock";
import { useAuthToken } from "@/hooks/use-auth-token";

export function useMyPortfolio() {
  const { getToken } = useAuthToken();

  const query = useQuery<MyPortfolioResponse>({
    queryKey: ["my-portfolio"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("No auth token");
      return getMyPortfolio(token);
    },
    staleTime: 10_000,
    refetchInterval: 15_000,
    enabled: !USE_MOCK,
  });

  return {
    portfolio: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
