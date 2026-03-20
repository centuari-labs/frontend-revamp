"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	submitLendLimitOrder,
	submitLendMarketOrder,
	type MarketIds,
} from "@/lib/positions-adapter.api";
import type {
	LendPosition,
	SubmitLendLimitParams,
	SubmitLendMarketParams,
} from "@/types/positions";

export interface SubmitLimitOptions {
	token?: string;
	marketIds?: MarketIds;
}

export function useSubmitLend() {
	const queryClient = useQueryClient();

	const limitMutation = useMutation({
		mutationFn: async ({
			params,
			options,
		}: {
			params: SubmitLendLimitParams;
			options?: SubmitLimitOptions;
		}) => {
			const { token, marketIds } = options ?? {};
			if (!token || !marketIds) {
				throw new Error("Auth token and market IDs required");
			}
			return await submitLendLimitOrder(params, marketIds, token);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["my-assets"] });
			queryClient.invalidateQueries({ queryKey: ["my-portfolio"] });
			queryClient.invalidateQueries({ queryKey: ["lend-borrow-assets"] });
			queryClient.invalidateQueries({ queryKey: ["my-positions"] });
			queryClient.invalidateQueries({ queryKey: ["open-orders"] });
			queryClient.invalidateQueries({ queryKey: ["transaction-history"] });
		},
	});

	const marketMutation = useMutation({
		mutationFn: async ({
			params,
			options,
		}: {
			params: SubmitLendMarketParams;
			options?: SubmitLimitOptions;
		}) => {
			const { token, marketIds } = options ?? {};
			if (!token || !marketIds) {
				throw new Error("Auth token and market IDs required");
			}
			return await submitLendMarketOrder(params, marketIds, token);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["my-assets"] });
			queryClient.invalidateQueries({ queryKey: ["my-portfolio"] });
			queryClient.invalidateQueries({ queryKey: ["lend-borrow-assets"] });
			queryClient.invalidateQueries({ queryKey: ["my-positions"] });
			queryClient.invalidateQueries({ queryKey: ["open-orders"] });
			queryClient.invalidateQueries({ queryKey: ["transaction-history"] });
		},
	});

	return {
		submitLimit: (
			params: SubmitLendLimitParams,
			options?: SubmitLimitOptions,
		) => limitMutation.mutateAsync({ params, options }),
		submitMarket: (
			params: SubmitLendMarketParams,
			options?: SubmitLimitOptions,
		) => marketMutation.mutateAsync({ params, options }),
		isPending: limitMutation.isPending || marketMutation.isPending,
	};
}
