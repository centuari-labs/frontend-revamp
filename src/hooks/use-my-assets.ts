"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyAssets, type MyAssetItem } from "@/lib/api";
import { USE_MOCK } from "@/lib/use-mock";
import { useAuthToken } from "@/hooks/use-auth-token";

const EMPTY_ASSETS: MyAssetItem[] = [];

export function useMyAssets() {
  const { getToken } = useAuthToken();

  const query = useQuery({
    queryKey: ["my-assets"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("No auth token");
      return getMyAssets(token);
    },
    staleTime: 10_000,
    enabled: !USE_MOCK,
  });

  const assets = useMemo(() => query.data ?? EMPTY_ASSETS, [query.data]);

  return {
    assets,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
