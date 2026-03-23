"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getOpenOrders,
  type OpenOrderItem,
  type OpenOrdersResponse,
} from "@/lib/api";
import { useAuthToken } from "@/hooks/use-auth-token";
import { usePrivy } from "@privy-io/react-auth";

const EMPTY: OpenOrderItem[] = [];

export function useOpenOrders(options?: {
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
  const { getToken } = useAuthToken();
  const { user } = usePrivy();
  const address = user?.wallet?.address;

  const query = useQuery<OpenOrdersResponse>({
    queryKey: [
      "open-orders",
      address,
      assetId,
      page,
      limit,
      side,
      status,
      startDate,
      endDate,
    ],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("No auth token");
      return getOpenOrders(token, {
        page,
        limit,
        assetId,
        side,
        status,
        startDate,
        endDate,
      });
    },
    staleTime: 10_000,
    enabled: !!address && enabled,
    placeholderData: (prev) => prev,
  });

  return {
    orders: query.data?.data ?? EMPTY,
    page: query.data?.meta?.page ?? page,
    totalData: query.data?.meta?.totalData ?? 0,
    totalPages: query.data?.meta?.totalPages ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
