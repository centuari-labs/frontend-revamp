"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyAssets, type MyAssetItem } from "@/lib/api";
import { useAuthToken } from "@/hooks/use-auth-token";
import { QUERY_KEYS } from "@/lib/query-keys";
import { usePrivy } from "@privy-io/react-auth";

const EMPTY_ASSETS: MyAssetItem[] = [];

export interface UseMyAssetsOptions {
  page?: number;
  limit?: number;
}

export function useMyAssets(options?: UseMyAssetsOptions) {
  const { page = 1, limit = 10 } = options ?? {};
  const { authFetch } = useAuthToken();
  const { user } = usePrivy();
  const address = user?.wallet?.address;

  const query = useQuery({
    queryKey: [QUERY_KEYS.MY_ASSETS, address, page, limit],
    queryFn: () => authFetch((token) => getMyAssets(token, { page, limit })),
    staleTime: 10_000,
    enabled: !!address,
    placeholderData: (prev) => prev,
  });

  const assets = useMemo(() => query.data?.data ?? EMPTY_ASSETS, [query.data]);

  return {
    assets,
    page: query.data?.page ?? page,
    totalData: query.data?.totalData ?? 0,
    totalPages: query.data?.totalPages ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
