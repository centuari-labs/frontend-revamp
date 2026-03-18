"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyPositions, type MyPositionItem } from "@/lib/api";
import { useAuthToken } from "@/hooks/use-auth-token";
import { usePrivy } from "@privy-io/react-auth";

const EMPTY_POSITIONS: MyPositionItem[] = [];

export interface UseMyPositionsOptions {
  type?: "LEND" | "BORROW";
  page?: number;
  limit?: number;
  assetId?: string;
  enabled?: boolean;
}

export function useMyPositions(options?: UseMyPositionsOptions) {
  const { type, page = 1, limit = 10, assetId, enabled = true } = options ?? {};
  const { getToken } = useAuthToken();
  const { user } = usePrivy();
  const address = user?.wallet?.address;

  const query = useQuery({
    queryKey: ["my-positions", address, type, page, limit, assetId],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("No auth token");
      return getMyPositions(token, { type, page, limit, assetId });
    },
    staleTime: 10_000,
    refetchInterval: 15_000,
    enabled: !!address && enabled,
    placeholderData: (prev) => prev,
  });

  const positions = useMemo(
    () => query.data?.data ?? EMPTY_POSITIONS,
    [query.data],
  );

  return {
    positions,
    page: query.data?.page ?? page,
    totalData: query.data?.totalData ?? 0,
    totalPages: query.data?.totalPages ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
