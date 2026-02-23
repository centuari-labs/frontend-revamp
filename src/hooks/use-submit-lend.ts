"use client";

import { useState, useCallback } from "react";
import {
	submitOpenOrder,
	submitFilledLendPosition,
	updateOpenOrder,
	updateFilledPosition,
	buildLendLimitPosition,
	buildLendMarketPosition,
} from "@/lib/positions-adapter.mock";
import { USE_MOCK } from "@/lib/use-mock";
import {
	useCreateLendLimitOrder,
	useCreateLendMarketOrder,
} from "./use-order-mutations";
import { useAssetId, useMarketIds } from "./use-market-data";
import type {
	LendPosition,
	SubmitLendLimitParams,
	SubmitLendMarketParams,
} from "@/types/positions";
import { useAuthToken } from "./use-auth-token";

export function useSubmitLend() {
	const [isPending, setIsPending] = useState(false);

	// API mode hooks
	const limitMutation = useCreateLendLimitOrder();
	const marketMutation = useCreateLendMarketOrder();

	const submitLimit = useCallback(
		async (params: SubmitLendLimitParams) => {
			if (USE_MOCK) {
				setIsPending(true);
				try {
					const position = buildLendLimitPosition(params);
					if (params.editingPosition) {
						await updateOpenOrder(position);
						return position;
					}
					const result = await submitOpenOrder(position);
					return result as LendPosition;
				} finally {
					setIsPending(false);
				}
			}

			// API mode
			const rateBps = Math.round(params.targetApr * 10000);
			const result = await limitMutation.mutateAsync({
				assetId: (params as SubmitLendLimitParams & { assetId?: string }).assetId ?? "",
				amount: String(params.amount),
				marketIds: (params as SubmitLendLimitParams & { marketIds?: string[] }).marketIds ?? [],
				rate: rateBps,
			});
			return result as unknown as LendPosition;
		},
		[limitMutation],
	);

	const submitMarket = useCallback(
		async (params: SubmitLendMarketParams) => {
			if (USE_MOCK) {
				setIsPending(true);
				try {
					const position = buildLendMarketPosition(params);
					if (params.editingPosition) {
						await updateFilledPosition(position);
						return position;
					}
					const result = await submitFilledLendPosition(position, {
						amountInUsd: params.amountInUsd,
						tokenValue: params.tokenValue,
					});
					return result;
				} finally {
					setIsPending(false);
				}
			}

			// API mode
			const result = await marketMutation.mutateAsync({
				assetId: (params as SubmitLendMarketParams & { assetId?: string }).assetId ?? "",
				amount: String(params.amount),
				marketIds: (params as SubmitLendMarketParams & { marketIds?: string[] }).marketIds ?? [],
			});
			return result as unknown as LendPosition;
		},
		[marketMutation],
	);

	return {
		submitLimit,
		submitMarket,
		isPending:
			isPending || limitMutation.isPending || marketMutation.isPending,
	};
}
