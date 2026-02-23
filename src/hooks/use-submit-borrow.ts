"use client";

import { useState, useCallback } from "react";
import {
	submitOpenOrder,
	submitFilledBorrowPosition,
	updateOpenOrder,
	updateFilledPosition,
	buildBorrowLimitPosition,
	buildBorrowMarketPosition,
} from "@/lib/positions-adapter.mock";
import { USE_MOCK } from "@/lib/use-mock";
import {
	useCreateBorrowLimitOrder,
	useCreateBorrowMarketOrder,
} from "./use-order-mutations";
import type {
	BorrowPosition,
	SubmitBorrowLimitParams,
	SubmitBorrowMarketParams,
} from "@/types/positions";

export function useSubmitBorrow() {
	const [isPending, setIsPending] = useState(false);

	// API mode hooks
	const limitMutation = useCreateBorrowLimitOrder();
	const marketMutation = useCreateBorrowMarketOrder();

	const submitLimit = useCallback(
		async (params: SubmitBorrowLimitParams) => {
			if (USE_MOCK) {
				setIsPending(true);
				try {
					const position = buildBorrowLimitPosition(params);
					if (params.editingPosition) {
						await updateOpenOrder(position);
						return position;
					}
					const result = await submitOpenOrder(position);
					return result as BorrowPosition;
				} finally {
					setIsPending(false);
				}
			}

			// API mode
			const rateBps = Math.round(params.targetApr * 10000);
			const result = await limitMutation.mutateAsync({
				assetId: (params as SubmitBorrowLimitParams & { assetId?: string }).assetId ?? "",
				amount: String(params.amount),
				marketIds: (params as SubmitBorrowLimitParams & { marketIds?: string[] }).marketIds ?? [],
				rate: rateBps,
			});
			return result as unknown as BorrowPosition;
		},
		[limitMutation],
	);

	const submitMarket = useCallback(
		async (params: SubmitBorrowMarketParams) => {
			if (USE_MOCK) {
				setIsPending(true);
				try {
					const position = buildBorrowMarketPosition(params);
					if (params.editingPosition) {
						await updateFilledPosition(position);
						return position;
					}
					const result = await submitFilledBorrowPosition(position, {
						amount: params.amount,
					});
					return result;
				} finally {
					setIsPending(false);
				}
			}

			// API mode
			const result = await marketMutation.mutateAsync({
				assetId: (params as SubmitBorrowMarketParams & { assetId?: string }).assetId ?? "",
				amount: String(params.amount),
				marketIds: (params as SubmitBorrowMarketParams & { marketIds?: string[] }).marketIds ?? [],
			});
			return result as unknown as BorrowPosition;
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
