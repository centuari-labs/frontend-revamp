import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	submitBorrowLimitOrder,
	submitBorrowMarketOrder,
	type MarketIds,
} from "@/lib/positions-adapter.api";
import type {
	BorrowPosition,
	SubmitBorrowLimitParams,
	SubmitBorrowMarketParams,
} from "@/types/positions";

export interface SubmitBorrowOptions {
	token?: string;
	marketIds?: MarketIds;
}

export function useSubmitBorrow() {
	const queryClient = useQueryClient();

	const limitMutation = useMutation({
		mutationFn: async ({
			params,
			options,
		}: {
			params: SubmitBorrowLimitParams;
			options?: SubmitBorrowOptions;
		}) => {
			const { token, marketIds } = options ?? {};
			if (!token || !marketIds) {
				throw new Error("Auth token and market IDs required");
			}
			return await submitBorrowLimitOrder(params, marketIds, token);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["my-assets"] });
			queryClient.invalidateQueries({ queryKey: ["my-portfolio"] });
			queryClient.invalidateQueries({ queryKey: ["lend-borrow-assets"] });
			queryClient.invalidateQueries({ queryKey: ["my-positions"] });
			queryClient.invalidateQueries({ queryKey: ["open-orders"] });
			queryClient.invalidateQueries({ queryKey: ["order-history"] });
		},
	});

	const marketMutation = useMutation({
		mutationFn: async ({
			params,
			options,
		}: {
			params: SubmitBorrowMarketParams;
			options?: SubmitBorrowOptions;
		}) => {
			const { token, marketIds } = options ?? {};
			if (!token || !marketIds) {
				throw new Error("Auth token and market IDs required");
			}
			return await submitBorrowMarketOrder(params, marketIds, token);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["my-assets"] });
			queryClient.invalidateQueries({ queryKey: ["my-portfolio"] });
			queryClient.invalidateQueries({ queryKey: ["lend-borrow-assets"] });
			queryClient.invalidateQueries({ queryKey: ["my-positions"] });
			queryClient.invalidateQueries({ queryKey: ["open-orders"] });
			queryClient.invalidateQueries({ queryKey: ["order-history"] });
		},
	});

	return {
		submitLimit: (
			params: SubmitBorrowLimitParams,
			options?: SubmitBorrowOptions,
		) => limitMutation.mutateAsync({ params, options }),
		submitMarket: (
			params: SubmitBorrowMarketParams,
			options?: SubmitBorrowOptions,
		) => marketMutation.mutateAsync({ params, options }),
		isPending: limitMutation.isPending || marketMutation.isPending,
	};
}
