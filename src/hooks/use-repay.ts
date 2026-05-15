"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitRepay } from "@/lib/api";
import { useAuthToken } from "@/hooks/use-auth-token";
import { invalidateUserQueries } from "@/lib/query-keys";
import type { RepayBorrowParams } from "@/types/positions";

export function useRepay() {
	const { authFetch } = useAuthToken();
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: (params: RepayBorrowParams) =>
			authFetch((token) =>
				submitRepay(params.marketId, String(params.amount), token),
			),
		onSuccess: () => invalidateUserQueries(queryClient),
		onError: (error: Error) => {
			console.error("Repay mutation error:", error);
		},
	});

	return {
		...mutation,
		repay: mutation.mutateAsync,
	};
}
