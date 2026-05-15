import { describe, it, expect } from "vitest";
import { assertValidDecimals, isValidDecimals } from "@/lib/erc20-decimals";

describe("isValidDecimals", () => {
	it("accepts valid ERC20 decimals", () => {
		expect(isValidDecimals(0)).toBe(true);
		expect(isValidDecimals(6)).toBe(true);
		expect(isValidDecimals(8)).toBe(true);
		expect(isValidDecimals(18)).toBe(true);
		expect(isValidDecimals(36)).toBe(true);
	});

	it("rejects null and undefined", () => {
		expect(isValidDecimals(null)).toBe(false);
		expect(isValidDecimals(undefined)).toBe(false);
	});

	it("rejects out-of-range values", () => {
		expect(isValidDecimals(-1)).toBe(false);
		expect(isValidDecimals(37)).toBe(false);
		expect(isValidDecimals(100)).toBe(false);
	});

	it("rejects non-integers", () => {
		expect(isValidDecimals(6.5)).toBe(false);
		expect(isValidDecimals(Number.NaN)).toBe(false);
		expect(isValidDecimals(Number.POSITIVE_INFINITY)).toBe(false);
	});
});

describe("assertValidDecimals", () => {
	it("does not throw for valid decimals", () => {
		expect(() => assertValidDecimals(6, "USDC")).not.toThrow();
		expect(() => assertValidDecimals(18, "ETH")).not.toThrow();
		expect(() => assertValidDecimals(0, "EDGE")).not.toThrow();
	});

	it("throws for null", () => {
		expect(() => assertValidDecimals(null, "USDC")).toThrow(
			/Invalid decimals for USDC/,
		);
	});

	it("throws for undefined", () => {
		expect(() => assertValidDecimals(undefined, "USDC")).toThrow(
			/Invalid decimals for USDC/,
		);
	});

	it("throws for negative values", () => {
		expect(() => assertValidDecimals(-1, "USDC")).toThrow(
			/Invalid decimals for USDC/,
		);
	});

	it("throws for values above the upper bound", () => {
		expect(() => assertValidDecimals(100, "USDC")).toThrow(
			/Invalid decimals for USDC/,
		);
	});

	it("throws for non-integers", () => {
		expect(() => assertValidDecimals(6.5, "USDC")).toThrow(
			/Invalid decimals for USDC/,
		);
	});

	it("includes the user-facing remediation hint", () => {
		expect(() => assertValidDecimals(null, "USDC")).toThrow(
			/Token configuration is invalid\. Please refresh and try again\./,
		);
	});
});
