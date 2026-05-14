const SETTLEMENT_FEE_RATE = 0.0001; // 0.01%
const SETTLEMENT_FEE_CAP = 0.05; // Max $0.05
const TAKER_FEE_RATE = 0.002; // 0.2%

export function calculateFees(amount: number) {
	const settlementFee = Math.min(
		amount * SETTLEMENT_FEE_RATE,
		SETTLEMENT_FEE_CAP,
	);
	const tradeFee = amount * TAKER_FEE_RATE;
	const transactionFee = settlementFee + tradeFee;
	const amountToPay = amount + transactionFee;

	return { settlementFee, tradeFee, transactionFee, amountToPay };
}
