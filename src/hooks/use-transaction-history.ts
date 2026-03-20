"use client";

import { useQuery } from "@tanstack/react-query";
import {
	getTransactionHistory,
	type TransactionHistoryItem,
	type TransactionHistoryResponse,
} from "@/lib/api";
import { useAuthToken } from "@/hooks/use-auth-token";
import { usePrivy } from "@privy-io/react-auth";

const EMPTY: TransactionHistoryItem[] = [];

export function useTransactionHistory(options?: {
	page?: number;
	limit?: number;
	assetId?: string;
	enabled?: boolean;
}) {
	const { page = 1, limit = 10, assetId, enabled = true } = options ?? {};
	const { getToken } = useAuthToken();
	const { user } = usePrivy();
	const address = user?.wallet?.address;

	const query = useQuery<TransactionHistoryResponse>({
		queryKey: ["transaction-history", address, assetId, page, limit],
		queryFn: async () => {
			const token = await getToken();
			if (!token) throw new Error("No auth token");
			return getTransactionHistory(token, { page, limit, assetId });
		},
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
