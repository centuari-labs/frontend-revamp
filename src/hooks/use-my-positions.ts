"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyPositions, type MyPositionItem } from "@/lib/api";
import { USE_MOCK } from "@/lib/use-mock";
import { useAuthToken } from "@/hooks/use-auth-token";

export function useMyPositions() {
  const { getToken } = useAuthToken();

  const query = useQuery<MyPositionItem[]>({
    queryKey: ["my-positions"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("No auth token");
      return getMyPositions(token);
    },
    staleTime: 10_000,
    refetchInterval: 15_000,
    enabled: !USE_MOCK,
  });

  return {
    positions: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
