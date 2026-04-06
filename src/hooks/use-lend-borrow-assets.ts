"use client";

import { useQuery } from "@tanstack/react-query";
import { getLendBorrowAssets, type LendBorrowAssetsResponse } from "@/lib/api";
import { useAuthToken } from "@/hooks/use-auth-token";
import { QUERY_KEYS } from "@/lib/query-keys";
import { usePrivy } from "@privy-io/react-auth";

export function useLendBorrowAssets() {
  const { authFetch } = useAuthToken();
  const { user } = usePrivy();
  const address = user?.wallet?.address;

  const query = useQuery<LendBorrowAssetsResponse>({
    queryKey: [QUERY_KEYS.LEND_BORROW_ASSETS, address],
    queryFn: () => authFetch((token) => getLendBorrowAssets(token)),
    staleTime: 10_000,
    enabled: !!address,
  });

  return {
    lendBorrow: query.data ?? null,
    chartData: query.data?.chartData ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
