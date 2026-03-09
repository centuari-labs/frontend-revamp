"use client";

import { useQuery } from "@tanstack/react-query";
import { getLendBorrowAssets, type LendBorrowAssetsResponse } from "@/lib/api";
import { USE_MOCK } from "@/lib/use-mock";
import { useAuthToken } from "@/hooks/use-auth-token";

export function useLendBorrowAssets() {
  const { getToken } = useAuthToken();

  const query = useQuery<LendBorrowAssetsResponse>({
    queryKey: ["lend-borrow-assets"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("No auth token");
      return getLendBorrowAssets(token);
    },
    staleTime: 10_000,
    enabled: !USE_MOCK,
  });

  return {
    lendBorrow: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
