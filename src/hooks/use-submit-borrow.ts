"use client";

import {
	submitBorrowLimitOrder,
	submitBorrowMarketOrder,
} from "@/lib/positions-adapter.api";
import { useSubmitOrder } from "@/hooks/use-submit-order";

export type { SubmitOrderOptions as SubmitBorrowOptions } from "@/hooks/use-submit-order";

export function useSubmitBorrow() {
	return useSubmitOrder(submitBorrowLimitOrder, submitBorrowMarketOrder);
}
