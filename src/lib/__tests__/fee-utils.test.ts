import { describe, it, expect } from "vitest";
import { FEE_CONFIG, calculateOrderFees } from "@/lib/fee-utils";

describe("calculateOrderFees", () => {
	describe("limit (maker) branch", () => {
		it("applies MAKER_FEE_BPS to trade fee", () => {
			const fees = calculateOrderFees(1000, "limit");
			expect(fees.tradeFee).toBeCloseTo(1.0, 10);
			expect(fees.settlementFee).toBeCloseTo(0.05, 10);
			expect(fees.totalFee).toBeCloseTo(1.05, 10);
		});

		it("uses MAKER_FEE_BPS = 10 (0.1%)", () => {
			expect(FEE_CONFIG.MAKER_FEE_BPS).toBe(10);
			const { tradeFee } = calculateOrderFees(500, "limit");
			expect(tradeFee).toBeCloseTo(500 * (10 / 10000), 10);
		});
	});

	describe("market (taker) branch", () => {
		it("applies TAKER_FEE_BPS to trade fee", () => {
			const fees = calculateOrderFees(1000, "market");
			expect(fees.tradeFee).toBeCloseTo(2.0, 10);
			expect(fees.settlementFee).toBeCloseTo(0.05, 10);
			expect(fees.totalFee).toBeCloseTo(2.05, 10);
		});

		it("uses TAKER_FEE_BPS = 20 (0.2%)", () => {
			expect(FEE_CONFIG.TAKER_FEE_BPS).toBe(20);
			const { tradeFee } = calculateOrderFees(500, "market");
			expect(tradeFee).toBeCloseTo(500 * (20 / 10000), 10);
		});
	});

	describe("maker vs taker discrimination", () => {
		it("limit trade fee is half of market trade fee for the same amount", () => {
			const limit = calculateOrderFees(1000, "limit");
			const market = calculateOrderFees(1000, "market");
			expect(limit.tradeFee).toBeCloseTo(market.tradeFee / 2, 10);
		});
	});

	describe("settlement fee cap", () => {
		it("settlement fee is uncapped on small amounts", () => {
			const { settlementFee } = calculateOrderFees(100, "market");
			expect(settlementFee).toBeCloseTo(0.01, 10);
		});

		it("settlement fee caps at SETTLEMENT_FEE_MAX_USD on large amounts", () => {
			const { settlementFee } = calculateOrderFees(10_000, "market");
			expect(settlementFee).toBeCloseTo(FEE_CONFIG.SETTLEMENT_FEE_MAX_USD, 10);
		});

		it("hits the cap exactly at the threshold amount", () => {
			const thresholdAmount =
				FEE_CONFIG.SETTLEMENT_FEE_MAX_USD /
				(FEE_CONFIG.SETTLEMENT_FEE_BPS / 10000);
			const { settlementFee } = calculateOrderFees(thresholdAmount, "limit");
			expect(settlementFee).toBeCloseTo(FEE_CONFIG.SETTLEMENT_FEE_MAX_USD, 10);
		});
	});

	describe("zero amount", () => {
		it("returns all zeros for amount = 0", () => {
			const limit = calculateOrderFees(0, "limit");
			const market = calculateOrderFees(0, "market");
			expect(limit).toEqual({ settlementFee: 0, tradeFee: 0, totalFee: 0 });
			expect(market).toEqual({ settlementFee: 0, tradeFee: 0, totalFee: 0 });
		});
	});
});
