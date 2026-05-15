import { describe, it, expect } from "vitest";
import {
	classifyHealthFactor,
	projectHealthFactorForBorrow,
	projectHealthFactorForRepay,
	getHealthFactorPercentage,
} from "@/lib/health-factor";

// ─── classifyHealthFactor ──────────────────────────────────────────────

describe("classifyHealthFactor", () => {
	it("returns no-debt for null", () => {
		expect(classifyHealthFactor(null)).toEqual({ kind: "no-debt" });
	});

	it("returns no-debt for undefined", () => {
		expect(classifyHealthFactor(undefined)).toEqual({ kind: "no-debt" });
	});

	it("returns unknown for 0", () => {
		expect(classifyHealthFactor(0)).toEqual({ kind: "unknown" });
	});

	it("returns unknown for negative", () => {
		expect(classifyHealthFactor(-1)).toEqual({ kind: "unknown" });
	});

	it("returns unknown for Infinity (unexpected backend value)", () => {
		expect(classifyHealthFactor(Infinity)).toEqual({ kind: "unknown" });
	});

	it("returns danger for HF < 1", () => {
		const result = classifyHealthFactor(0.5);
		expect(result).toEqual({ kind: "danger", value: 0.5 });
	});

	it("returns healthy for HF == 1", () => {
		const result = classifyHealthFactor(1);
		expect(result).toEqual({ kind: "healthy", value: 1 });
	});

	it("returns healthy for HF > 1", () => {
		const result = classifyHealthFactor(2.5);
		expect(result).toEqual({ kind: "healthy", value: 2.5 });
	});
});

// ─── projectHealthFactorForBorrow ──────────────────────────────────────

describe("projectHealthFactorForBorrow", () => {
	it("returns 0 when newBorrowUsd is 0", () => {
		expect(
			projectHealthFactorForBorrow({
				collateralUsd: 1000,
				settledDebtUsd: 0,
				weightedLtv: 0.75,
				newBorrowUsd: 0,
			}),
		).toBe(0);
	});

	it("returns 0 when collateralUsd is 0", () => {
		expect(
			projectHealthFactorForBorrow({
				collateralUsd: 0,
				settledDebtUsd: 0,
				weightedLtv: 0.75,
				newBorrowUsd: 100,
			}),
		).toBe(0);
	});

	it("computes HF correctly with zero existing debt", () => {
		// HF = ((1000 - 0) × 0.75) / (0 + 500) = 750 / 500 = 1.5
		const hf = projectHealthFactorForBorrow({
			collateralUsd: 1000,
			settledDebtUsd: 0,
			weightedLtv: 0.75,
			newBorrowUsd: 500,
		});
		expect(hf).toBeCloseTo(1.5, 6);
	});

	it("computes HF correctly with existing debt", () => {
		// HF = ((1000 - 200) × 0.75) / (200 + 100) = 600 / 300 = 2.0
		const hf = projectHealthFactorForBorrow({
			collateralUsd: 1000,
			settledDebtUsd: 200,
			weightedLtv: 0.75,
			newBorrowUsd: 100,
		});
		expect(hf).toBeCloseTo(2.0, 6);
	});

	it("returns 0 for negative/non-finite result", () => {
		const hf = projectHealthFactorForBorrow({
			collateralUsd: 100,
			settledDebtUsd: 200,
			weightedLtv: 0.75,
			newBorrowUsd: 50,
		});
		expect(hf).toBe(0);
	});
});

// ─── projectHealthFactorForRepay ───────────────────────────────────────

describe("projectHealthFactorForRepay", () => {
	it("returns Infinity on full repay (repayUsd >= totalDebtUsd)", () => {
		const hf = projectHealthFactorForRepay({
			collateralUsd: 1000,
			totalDebtUsd: 500,
			weightedLtv: 0.75,
			repayUsd: 500,
		});
		expect(hf).toBe(Infinity);
	});

	it("returns Infinity when repay exceeds total debt", () => {
		const hf = projectHealthFactorForRepay({
			collateralUsd: 1000,
			totalDebtUsd: 500,
			weightedLtv: 0.75,
			repayUsd: 600,
		});
		expect(hf).toBe(Infinity);
	});

	it("computes HF correctly for partial repay", () => {
		// newDebt = 500 - 200 = 300; HF = ((1000 - 500) × 0.75) / 300 = 375 / 300 = 1.25
		const hf = projectHealthFactorForRepay({
			collateralUsd: 1000,
			totalDebtUsd: 500,
			weightedLtv: 0.75,
			repayUsd: 200,
		});
		expect(hf).toBeCloseTo(1.25, 6);
	});

	it("returns 0 when collateralUsd is 0", () => {
		const hf = projectHealthFactorForRepay({
			collateralUsd: 0,
			totalDebtUsd: 500,
			weightedLtv: 0.75,
			repayUsd: 100,
		});
		expect(hf).toBe(0);
	});
});

// ─── getHealthFactorPercentage (re-exported) ───────────────────────────

describe("getHealthFactorPercentage (re-export)", () => {
	it("returns 100 for HF >= 2.5", () => {
		expect(getHealthFactorPercentage(2.5)).toBe(100);
		expect(getHealthFactorPercentage(10)).toBe(100);
	});

	it("returns 0 for HF <= 0", () => {
		expect(getHealthFactorPercentage(0)).toBe(0);
	});

	it("interpolates correctly in the 1.0–1.2 band", () => {
		// At 1.1: 25 + ((1.1 - 1.0) / 0.2) * 25 = 25 + 12.5 = 37.5
		expect(getHealthFactorPercentage(1.1)).toBeCloseTo(37.5, 4);
	});
});
