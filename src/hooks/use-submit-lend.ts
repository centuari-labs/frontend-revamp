"use client";

import {
	submitLendLimitOrder,
	submitLendMarketOrder,
} from "@/lib/positions-adapter.api";
import { useSubmitOrder } from "@/hooks/use-submit-order";

export type { SubmitOrderOptions as SubmitLimitOptions } from "@/hooks/use-submit-order";

export function useSubmitLend() {
	return useSubmitOrder(submitLendLimitOrder, submitLendMarketOrder);
}
