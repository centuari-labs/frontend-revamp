export type HealthFactorState =
	| { kind: "no-debt" }
	| { kind: "healthy"; value: number }
	| { kind: "danger"; value: number }
	| { kind: "unknown" };

export type HealthFactorDisplayStatus =
	| "Excellent"
	| "Good"
	| "Warning"
	| "Critical"
	| "Danger";

export type HealthFactorBadgeVariant =
	| "default"
	| "success"
	| "warning"
	| "destructive";

/**
 * Classify a raw healthFactor value from the API.
 * null means the user has no debt (backend cannot represent Infinity over JSON).
 * 0 or non-finite means the backend sent invalid data.
 */
export function classifyHealthFactor(
	raw: number | null | undefined,
): HealthFactorState {
	if (raw == null) return { kind: "no-debt" };
	if (!Number.isFinite(raw) || raw <= 0) return { kind: "unknown" };
	return raw < 1
		? { kind: "danger", value: raw }
		: { kind: "healthy", value: raw };
}

/** Map health factor number to status label. */
export function getHealthFactorStatus(
	healthFactor: number,
): "Safe" | "Good" | "Warning" | "Critical" {
	if (healthFactor >= 2.0) return "Safe";
	if (healthFactor >= 1.5) return "Good";
	if (healthFactor >= 1.0) return "Warning";
	return "Critical";
}

/**
 * Map health factor number to display status and badge variant.
 * Thresholds: >= 2.5 Excellent, >= 1.5 Good, >= 1.2 Warning, >= 1.0 Critical, < 1.0 Danger
 */
export function getHealthFactorDisplayStatus(healthFactor: number): {
	value: string;
	status: HealthFactorDisplayStatus;
	variant: HealthFactorBadgeVariant;
} {
	const hf = healthFactor;
	if (hf >= 2.5)
		return { value: hf.toFixed(2), status: "Excellent", variant: "success" };
	if (hf >= 1.5)
		return { value: hf.toFixed(2), status: "Good", variant: "default" };
	if (hf >= 1.2)
		return { value: hf.toFixed(2), status: "Warning", variant: "warning" };
	if (hf >= 1.0)
		return { value: hf.toFixed(2), status: "Critical", variant: "warning" };
	return { value: hf.toFixed(2), status: "Danger", variant: "destructive" };
}

/**
 * Map health factor to percentage for progress bar display.
 * Thresholds: HF >= 2.5 (100%), >= 1.5 (75-100%), >= 1.2 (50-75%), >= 1.0 (25-50%), < 1.0 (0-25%)
 */
export function getHealthFactorPercentage(healthFactor: number): number {
	if (healthFactor <= 0) return 0;
	if (healthFactor >= 2.5) return 100;
	if (healthFactor >= 1.5) return 75 + ((healthFactor - 1.5) / 1.0) * 25;
	if (healthFactor >= 1.2) return 50 + ((healthFactor - 1.2) / 0.3) * 25;
	if (healthFactor >= 1.0) return 25 + ((healthFactor - 1.0) / 0.2) * 25;
	return (healthFactor / 1.0) * 25;
}

/**
 * Project health factor after a new borrow.
 * Formula: ((collateralUsd - settledDebtUsd) × weightedLtv) / (settledDebtUsd + newBorrowUsd)
 */
export function projectHealthFactorForBorrow(args: {
	collateralUsd: number;
	settledDebtUsd: number;
	weightedLtv: number;
	newBorrowUsd: number;
}): number {
	const { collateralUsd, settledDebtUsd, weightedLtv, newBorrowUsd } = args;
	if (newBorrowUsd <= 0 || collateralUsd <= 0) return 0;
	const projectedDebt = settledDebtUsd + newBorrowUsd;
	if (projectedDebt <= 0) return 0;
	const hf = ((collateralUsd - settledDebtUsd) * weightedLtv) / projectedDebt;
	return Number.isFinite(hf) && hf >= 0 ? hf : 0;
}

/**
 * Project health factor after a repayment.
 * Formula: ((collateralUsd - totalDebtUsd) × weightedLtv) / newTotalDebtUsd
 * Returns Infinity when the repayment clears all debt (no-debt state).
 */
export function projectHealthFactorForRepay(args: {
	collateralUsd: number;
	totalDebtUsd: number;
	weightedLtv: number;
	repayUsd: number;
}): number {
	const { collateralUsd, totalDebtUsd, weightedLtv, repayUsd } = args;
	const newTotalDebtUsd = Math.max(0, totalDebtUsd - repayUsd);
	if (newTotalDebtUsd === 0) return Infinity;
	if (collateralUsd <= 0 || weightedLtv <= 0) return 0;
	const hf = ((collateralUsd - totalDebtUsd) * weightedLtv) / newTotalDebtUsd;
	return Number.isFinite(hf) && hf >= 0 ? hf : 0;
}

/**
 * Project health factor after withdrawing `withdrawUsd` worth of collateral.
 * Formula: ((collateralUsd - withdrawUsd - totalDebtUsd) × weightedLtv) / totalDebtUsd
 * Returns Infinity when there is no debt.
 *
 * This holds `weightedLtv` constant — a single-asset slider preview — so it can
 * differ slightly from the authoritative `maxWithdrawable` the API returns.
 * Use the API value as the hard cap; this is only for the live HF readout as
 * the user types.
 */
export function projectHealthFactorForWithdraw(args: {
	collateralUsd: number;
	totalDebtUsd: number;
	weightedLtv: number;
	withdrawUsd: number;
}): number {
	const { collateralUsd, totalDebtUsd, weightedLtv, withdrawUsd } = args;
	if (totalDebtUsd <= 0) return Infinity;
	const remainingCollateral = Math.max(0, collateralUsd - withdrawUsd);
	if (remainingCollateral <= 0 || weightedLtv <= 0) return 0;
	const hf =
		((remainingCollateral - totalDebtUsd) * weightedLtv) / totalDebtUsd;
	return Number.isFinite(hf) && hf >= 0 ? hf : 0;
}
