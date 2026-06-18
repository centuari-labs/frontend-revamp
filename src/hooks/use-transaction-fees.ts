import { useMemo } from "react";
import { calculateOrderFees } from "@/lib/fee-utils";
import type { OrderFees } from "@/lib/fee-utils";

export interface TransactionFees extends OrderFees {
	amountToPay: number;
}

export function useTransactionFees(
	amount: number,
	orderType: "limit" | "market",
): TransactionFees {
	return useMemo(() => {
		const fees = calculateOrderFees(amount, orderType);
		return { ...fees, amountToPay: amount + fees.totalFee };
	}, [amount, orderType]);
}
