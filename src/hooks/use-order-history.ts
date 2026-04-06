"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getOrderHistory,
  type OrderHistoryItem,
  type OrderHistoryResponse,
} from "@/lib/api";
import { useAuthToken } from "@/hooks/use-auth-token";
import { usePrivy } from "@privy-io/react-auth";
import { QUERY_KEYS } from "@/lib/query-keys";

const EMPTY: OrderHistoryItem[] = [];

export function useOrderHistory(options?: {
  page?: number;
  limit?: number;
  assetId?: string;
  side?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
}) {
  const {
    page = 1,
    limit = 10,
    assetId,
    side,
    status,
    startDate,
    endDate,
    enabled = true,
  } = options ?? {};
  const { authFetch } = useAuthToken();
  const { user } = usePrivy();
  const address = user?.wallet?.address;

  const query = useQuery<OrderHistoryResponse>({
    queryKey: [
      QUERY_KEYS.ORDER_HISTORY,
      address,
      assetId,
      page,
      limit,
      side,
      status,
      startDate,
      endDate,
    ],
    queryFn: () =>
      authFetch((token) =>
        getOrderHistory(token, {
          page,
          limit,
          assetId,
          side,
          status,
          startDate,
          endDate,
        }),
      ),
    staleTime: 10_000,
    enabled: !!address && enabled,
    placeholderData: (prev) => prev,
  });

  return {
    transactions: query.data?.data ?? EMPTY,
    page: query.data?.meta?.page ?? page,
    total: query.data?.meta?.total ?? 0,
    totalPages: Math.ceil((query.data?.meta?.total ?? 0) / limit),
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
