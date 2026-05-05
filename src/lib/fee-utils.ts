/**
 * Fee constants and calculation — single source of truth mirroring the matching engine.
 * Used by both lend and borrow form hooks.
 */

export const FEE_CONFIG = {
	/** Settlement fee in basis points (0.01%) */
	SETTLEMENT_FEE_BPS: 1,
	/** Maximum settlement fee in USD */
	SETTLEMENT_FEE_MAX_USD: 0.05,
	/** Maker (limit order) fee in basis points (0.1%) */
	MAKER_FEE_BPS: 10,
	/** Taker (market order) fee in basis points (0.2%) */
	TAKER_FEE_BPS: 20,
} as const;

export interface OrderFees {
	settlementFee: number;
	tradeFee: number;
	totalFee: number;
}

export function calculateOrderFees(
	amount: number,
	orderType: "limit" | "market",
): OrderFees {
	const settlementFee = Math.min(
		amount * (FEE_CONFIG.SETTLEMENT_FEE_BPS / 10000),
		FEE_CONFIG.SETTLEMENT_FEE_MAX_USD,
	);
	const tradeFee =
		amount *
		((orderType === "limit"
			? FEE_CONFIG.MAKER_FEE_BPS
			: FEE_CONFIG.TAKER_FEE_BPS) /
			10000);
	return { settlementFee, tradeFee, totalFee: settlementFee + tradeFee };
}
