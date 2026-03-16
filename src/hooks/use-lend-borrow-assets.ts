"use client";

import { useQuery } from "@tanstack/react-query";
import { getLendBorrowAssets, type LendBorrowAssetsResponse } from "@/lib/api";
import { USE_MOCK } from "@/lib/use-mock";
import { useAuthToken } from "@/hooks/use-auth-token";
import { usePrivy } from "@privy-io/react-auth";

export function useLendBorrowAssets({ enabled = true }: { enabled?: boolean } = {}) {
  const { getToken } = useAuthToken();
  const { user } = usePrivy();
  const address = user?.wallet?.address;

  const query = useQuery<LendBorrowAssetsResponse>({
    queryKey: ["lend-borrow-assets", address],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("No auth token");
      return getLendBorrowAssets(token);
    },
    staleTime: 10_000,
    enabled: !USE_MOCK && !!address && enabled,
  });

  return {
    lendBorrow: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
