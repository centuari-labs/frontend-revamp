"use client";

import { useState, useCallback } from "react";
import {
	deleteOpenOrder,
	deleteFilledPosition,
	getOpenOrders,
} from "@/lib/positions-adapter.mock";
import { USE_MOCK } from "@/lib/use-mock";
import { useCancelOrder } from "./use-order-mutations";

export function useDeleteOpenOrder() {
	const [isPending, setIsPending] = useState(false);
	const cancelMutation = useCancelOrder();

	const deleteOrder = useCallback(
		async (positionId: string) => {
			if (USE_MOCK) {
				setIsPending(true);
				try {
					const openOrders = getOpenOrders();
					const isOpenOrder = openOrders.some((p) => p.id === positionId);
					if (isOpenOrder) {
						await deleteOpenOrder(positionId);
					} else {
						await deleteFilledPosition(positionId);
					}
				} finally {
					setIsPending(false);
				}
				return;
			}

			// API mode
			await cancelMutation.mutateAsync(positionId);
		},
		[cancelMutation],
	);

	return {
		delete: deleteOrder,
		deleteOrder,
		isPending: isPending || cancelMutation.isPending,
	};
}
