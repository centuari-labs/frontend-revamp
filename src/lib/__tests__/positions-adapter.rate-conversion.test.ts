/**
 * Rate conversion round-trip tests.
 *
 * The rate flows through: FE decimal → BPS (DTO) → DB → BPS/100 (response percentage) → FE decimal
 * e.g. 0.065 → 650 → DB(650) → 6.5 → 0.065
 */
import { describe, it, expect } from "vitest";
import {
	aprToBasisPoints,
	basisPointsToApr,
} from "@/lib/positions-adapter.api";

describe("aprToBasisPoints", () => {
	it("converts 0.065 (6.5%) to 650 BPS", () => {
		expect(aprToBasisPoints(0.065)).toBe(650);
	});

	it("converts 0.05 (5%) to 500 BPS", () => {
		expect(aprToBasisPoints(0.05)).toBe(500);
	});

	it("converts 0 (0%) to 0 BPS", () => {
		expect(aprToBasisPoints(0)).toBe(0);
	});

	it("converts 1.0 (100%) to 10000 BPS", () => {
		expect(aprToBasisPoints(1.0)).toBe(10000);
	});

	it("converts 0.0001 (0.01%) to 1 BPS", () => {
		expect(aprToBasisPoints(0.0001)).toBe(1);
	});

	it("rounds to nearest integer", () => {
		// 0.0655 → 655 BPS
		expect(aprToBasisPoints(0.0655)).toBe(655);
	});
});

describe("BE rate conversion: BPS → percentage", () => {
	// Simulates what backend toPercentage does: value / 100
	function toPercentage(bps: number): number {
		return bps / 100;
	}

	it("650 BPS → 6.5 percentage", () => {
		expect(toPercentage(650)).toBe(6.5);
	});

	it("500 BPS → 5 percentage", () => {
		expect(toPercentage(500)).toBe(5);
	});

	it("10000 BPS → 100 percentage", () => {
		expect(toPercentage(10000)).toBe(100);
	});

	it("1 BPS → 0.01 percentage", () => {
		expect(toPercentage(1)).toBe(0.01);
	});
});

describe("FE back-conversion: percentage → decimal APR", () => {
	// normalizeOrderToLendPosition does: order.rate / 100
	function percentageToDecimalApr(pct: number): number {
		return pct / 100;
	}

	it("6.5% → 0.065 decimal APR", () => {
		expect(percentageToDecimalApr(6.5)).toBe(0.065);
	});

	it("5% → 0.05 decimal APR", () => {
		expect(percentageToDecimalApr(5)).toBe(0.05);
	});

	it("100% → 1.0 decimal APR", () => {
		expect(percentageToDecimalApr(100)).toBe(1.0);
	});
});

// ─── basisPointsToApr (WS event bps → decimal APR) ──────────────────

describe("basisPointsToApr", () => {
	it("converts 450 bps to 0.045 decimal APR (4.5%)", () => {
		expect(basisPointsToApr(450)).toBeCloseTo(0.045, 6);
	});

	it("converts 500 bps to 0.05 decimal APR (5%)", () => {
		expect(basisPointsToApr(500)).toBe(0.05);
	});

	it("converts 10000 bps to 1.0 decimal APR (100%)", () => {
		expect(basisPointsToApr(10000)).toBe(1.0);
	});

	it("converts 1 bps to 0.0001 decimal APR (0.01%)", () => {
		expect(basisPointsToApr(1)).toBe(0.0001);
	});

	it("is the exact inverse of aprToBasisPoints within rounding", () => {
		const original = 0.0537;
		const bps = aprToBasisPoints(original); // 537
		const recovered = basisPointsToApr(bps); // 0.0537
		expect(Math.abs(recovered - original)).toBeLessThan(1 / 10_000);
	});
});

describe("full round-trip integrity", () => {
	function roundTrip(decimalApr: number): number {
		// FE → API: decimal → BPS
		const bps = aprToBasisPoints(decimalApr);
		// DB stores BPS, API returns percentage (BPS / 100)
		const percentage = bps / 100;
		// FE normalizes: percentage / 100 → decimal APR
		const recovered = percentage / 100;
		return recovered;
	}

	it("0.065 round-trips exactly", () => {
		expect(roundTrip(0.065)).toBe(0.065);
	});

	it("0.05 round-trips exactly", () => {
		expect(roundTrip(0.05)).toBe(0.05);
	});

	it("1.0 (100%) round-trips exactly", () => {
		expect(roundTrip(1.0)).toBe(1.0);
	});

	it("0 round-trips exactly", () => {
		expect(roundTrip(0)).toBe(0);
	});

	it("0.0001 (0.01%) round-trips exactly", () => {
		expect(roundTrip(0.0001)).toBe(0.0001);
	});
});
