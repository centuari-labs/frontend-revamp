"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { MarketIds } from "@/lib/positions-adapter.api";
import { invalidateUserQueries } from "@/lib/query-keys";

export interface SubmitOrderOptions {
	token?: string;
	marketIds?: MarketIds;
}

export function useSubmitOrder<LimitParams, MarketParams, LimitResult, MarketResult>(
	limitFn: (
		params: LimitParams,
		marketIds: MarketIds,
		token: string,
	) => Promise<LimitResult>,
	marketFn: (
		params: MarketParams,
		marketIds: MarketIds,
		token: string,
	) => Promise<MarketResult>,
) {
	const queryClient = useQueryClient();

	const limitMutation = useMutation({
		mutationFn: async ({
			params,
			options,
		}: {
			params: LimitParams;
			options?: SubmitOrderOptions;
		}) => {
			const { token, marketIds } = options ?? {};
			if (!token || !marketIds) {
				throw new Error("Auth token and market IDs required");
			}
			return await limitFn(params, marketIds, token);
		},
		onSuccess: () => invalidateUserQueries(queryClient),
	});

	const marketMutation = useMutation({
		mutationFn: async ({
			params,
			options,
		}: {
			params: MarketParams;
			options?: SubmitOrderOptions;
		}) => {
			const { token, marketIds } = options ?? {};
			if (!token || !marketIds) {
				throw new Error("Auth token and market IDs required");
			}
			return await marketFn(params, marketIds, token);
		},
		onSuccess: () => invalidateUserQueries(queryClient),
	});

	return {
		submitLimit: (params: LimitParams, options?: SubmitOrderOptions) =>
			limitMutation.mutateAsync({ params, options }),
		submitMarket: (params: MarketParams, options?: SubmitOrderOptions) =>
			marketMutation.mutateAsync({ params, options }),
		isPending: limitMutation.isPending || marketMutation.isPending,
	};
}
