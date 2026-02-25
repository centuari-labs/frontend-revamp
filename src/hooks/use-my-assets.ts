"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyAssets, type MyAssetItem } from "@/lib/api";
import { USE_MOCK } from "@/lib/use-mock";
import { useAuthToken } from "@/hooks/use-auth-token";

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
    refetchInterval: 15_000,
    enabled: !USE_MOCK,
  });

  return {
    assets: query.data?.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
