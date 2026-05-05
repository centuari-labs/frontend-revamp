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
	side?: string;
	startDate?: string;
	endDate?: string;
	enabled?: boolean;
}) {
	const {
		page = 1,
		limit = 10,
		assetId,
		side,
		startDate,
		endDate,
		enabled = true,
	} = options ?? {};
	const { authFetch } = useAuthToken();
	const { user } = usePrivy();
	const address = user?.wallet?.address;

	const query = useQuery<TransactionHistoryResponse>({
		queryKey: [
			"transaction-history",
			address,
			assetId,
			page,
			limit,
			side,
			startDate,
			endDate,
		],
		queryFn: () =>
			authFetch((token) =>
				getTransactionHistory(token, {
					page,
					limit,
					assetId,
					side,
					startDate,
					endDate,
				}),
			),
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
