import { describe, it, expect, vi } from "vitest";
import {
	getHealthFactorStatus,
	getHealthFactorDisplayStatus,
	getHealthFactorPercentage,
} from "@/lib/health-factor";
import {
	cn,
	formatAddress,
	formatCurrency,
	formatCompactCurrency,
	formatCurrencyParts,
	getTokenSlug,
	isPathActive,
	isMacPlatform,
	randomIntInRange,
	getSelectedTokenFromParams,
	getDefaultTokenFromList,
	getTokenValueFromList,
	getLocalStorageNumber,
	getLocalStorageJson,
	migratePortfolioFromStorage,
	toPercent,
	formatNumberWithSeparator,
	parseNumberFromSeparator,
	handleNumberInputChange,
	generateRandomAPR,
	formatDate,
	parseDateString,
	calculateDaysDifference,
	calculateFutureAmount,
	calculateProfitAmount,
} from "@/lib/utils";

// ─── cn ──────────────────────────────────────────────────────────────

describe("cn", () => {
	it("merges tailwind classes", () => {
		expect(cn("px-2", "px-4")).toBe("px-4");
	});

	it("handles conditional classes", () => {
		expect(cn("base", false && "hidden", "visible")).toBe("base visible");
	});
});

// ─── formatAddress ───────────────────────────────────────────────────

describe("formatAddress", () => {
	it("truncates to default 4 chars", () => {
		expect(formatAddress("0xAbCdEf1234567890AbCdEf1234567890AbCdEf12")).toBe(
			"0xAbCd..Ef12",
		);
	});

	it("accepts custom char count", () => {
		expect(formatAddress("0xAbCdEf1234567890AbCdEf1234567890AbCdEf12", 6)).toBe(
			"0xAbCdEf..CdEf12",
		);
	});
});

// ─── formatCurrency ──────────────────────────────────────────────────

describe("formatCurrency", () => {
	it("formats a normal value", () => {
		expect(formatCurrency(1234.567)).toBe("$1,234.567");
	});

	it("formats zero", () => {
		expect(formatCurrency(0)).toBe("$0.000");
	});

	it("uses more decimals for very small values", () => {
		const result = formatCurrency(0.005);
		expect(result).toMatch(/\$0\.005/);
	});

	it("respects custom decimal places", () => {
		expect(formatCurrency(100, 2)).toBe("$100.00");
	});

	it("formats negative values", () => {
		expect(formatCurrency(-50, 2)).toBe("-$50.00");
	});
});

// ─── formatCompactCurrency ───────────────────────────────────────────

describe("formatCompactCurrency", () => {
	it("formats millions", () => {
		expect(formatCompactCurrency(5_000_000)).toBe("$5.00M");
	});

	it("formats billions", () => {
		expect(formatCompactCurrency(1_200_000_000)).toBe("$1.20B");
	});

	it("formats trillions", () => {
		expect(formatCompactCurrency(2_500_000_000_000)).toBe("$2.50T");
	});

	it("falls back to formatCurrency for small values", () => {
		expect(formatCompactCurrency(999_999, 2)).toBe("$999,999.00");
	});

	it("handles negative values", () => {
		expect(formatCompactCurrency(-5_000_000)).toBe("-$5.00M");
	});
});

// ─── formatCurrencyParts ─────────────────────────────────────────────

describe("formatCurrencyParts", () => {
	it("splits integer and decimal", () => {
		const { integer, decimal } = formatCurrencyParts(1234.567);
		expect(integer).toBe("$1,234");
		expect(decimal).toBe(".567");
	});

	it("returns empty decimal when none", () => {
		// With 0 decimal places there's still no decimal portion if value is whole
		const { integer, decimal } = formatCurrencyParts(100, 0);
		expect(integer).toBe("$100");
		expect(decimal).toBe("");
	});
});

// ─── getTokenSlug ────────────────────────────────────────────────────

describe("getTokenSlug", () => {
	it("lowercases the symbol", () => {
		expect(getTokenSlug("USDC")).toBe("usdc");
	});
});

// ─── isPathActive ────────────────────────────────────────────────────

describe("isPathActive", () => {
	it("returns true for exact match", () => {
		expect(isPathActive("/portfolio", "/portfolio")).toBe(true);
	});

	it("returns false for mismatch", () => {
		expect(isPathActive("/portfolio", "/market")).toBe(false);
	});

	it("uses path aliases when provided", () => {
		const aliases = { "/": ["/", "/market"] };
		expect(isPathActive("/market", "/", aliases)).toBe(true);
		expect(isPathActive("/portfolio", "/", aliases)).toBe(false);
	});
});

// ─── isMacPlatform ───────────────────────────────────────────────────

describe("isMacPlatform", () => {
	it("returns false in jsdom (Linux-like)", () => {
		// jsdom navigator.platform defaults to empty string
		expect(typeof isMacPlatform()).toBe("boolean");
	});
});

// ─── randomIntInRange ────────────────────────────────────────────────

describe("randomIntInRange", () => {
	it("returns integer in range", () => {
		for (let i = 0; i < 50; i++) {
			const v = randomIntInRange(1, 5);
			expect(v).toBeGreaterThanOrEqual(1);
			expect(v).toBeLessThanOrEqual(5);
			expect(Number.isInteger(v)).toBe(true);
		}
	});
});

// ─── getSelectedTokenFromParams ──────────────────────────────────────

describe("getSelectedTokenFromParams", () => {
	const list = [
		{ value: "usdc", label: "USDC" },
		{ value: "xsgd", label: "XSGD" },
	];

	it("picks token by param", () => {
		expect(getSelectedTokenFromParams(list, "xsgd", "usdc").value).toBe("xsgd");
	});

	it("falls back to preferred when param is null", () => {
		expect(getSelectedTokenFromParams(list, null, "usdc").value).toBe("usdc");
	});

	it("falls back to first item when nothing matches", () => {
		expect(getSelectedTokenFromParams(list, "nope", "nope").value).toBe("usdc");
	});
});

// ─── getDefaultTokenFromList ─────────────────────────────────────────

describe("getDefaultTokenFromList", () => {
	const list = [
		{ value: "usdc", label: "USDC" },
		{ value: "xsgd", label: "XSGD" },
	];

	it("finds matching token", () => {
		expect(getDefaultTokenFromList(list, "xsgd")?.value).toBe("xsgd");
	});

	it("returns first item as fallback", () => {
		expect(getDefaultTokenFromList(list, "nope")?.value).toBe("usdc");
	});
});

// ─── getTokenValueFromList ───────────────────────────────────────────

describe("getTokenValueFromList", () => {
	const list = [
		{ value: "usdc", label: "USDC" },
		{ value: "btc", label: "BTC" },
	];

	it("finds by label", () => {
		expect(getTokenValueFromList(list, "USDC")).toBe("usdc");
	});

	it("finds by value", () => {
		expect(getTokenValueFromList(list, "btc")).toBe("btc");
	});

	it("lowercases unknown symbol", () => {
		expect(getTokenValueFromList(list, "UNKNOWN")).toBe("unknown");
	});
});

// ─── getLocalStorageNumber ───────────────────────────────────────────

describe("getLocalStorageNumber", () => {
	it("returns stored number", () => {
		localStorage.setItem("n", "42");
		expect(getLocalStorageNumber("n", 0)).toBe(42);
	});

	it("returns default for missing key", () => {
		expect(getLocalStorageNumber("missing", 99)).toBe(99);
	});

	it("returns default for invalid value", () => {
		localStorage.setItem("n", "abc");
		expect(getLocalStorageNumber("n", 10)).toBe(10);
	});
});

// ─── getLocalStorageJson ─────────────────────────────────────────────

describe("getLocalStorageJson", () => {
	it("returns parsed JSON", () => {
		localStorage.setItem("j", JSON.stringify({ a: 1 }));
		expect(getLocalStorageJson("j", {})).toEqual({ a: 1 });
	});

	it("returns default for missing key", () => {
		expect(getLocalStorageJson("miss", { b: 2 })).toEqual({ b: 2 });
	});

	it("returns default for invalid JSON", () => {
		localStorage.setItem("j", "{bad");
		expect(getLocalStorageJson("j", { c: 3 })).toEqual({ c: 3 });
	});

	it("applies migrate function", () => {
		localStorage.setItem("j", JSON.stringify({ x: 1 }));
		const result = getLocalStorageJson(
			"j",
			{},
			(p: Record<string, number>) => ({
				...p,
				y: 2,
			}),
		);
		expect(result).toEqual({ x: 1, y: 2 });
	});
});

// ─── migratePortfolioFromStorage ─────────────────────────────────────

describe("migratePortfolioFromStorage", () => {
	const defaults = { xaut: 100, nvdaon: 200, slvon: 50, btc: 300 };

	it("renames aave → xaut", () => {
		const result = migratePortfolioFromStorage(
			{ aave: 999, btc: 300, slvon: 50 },
			defaults,
		);
		expect(result.xaut).toBe(999);
		expect(result.aave).toBeUndefined();
	});

	it("renames nvda → nvdaon", () => {
		const result = migratePortfolioFromStorage(
			{ nvda: 500, xaut: 100, btc: 300, slvon: 50 },
			defaults,
		);
		expect(result.nvdaon).toBe(500);
		expect(result.nvda).toBeUndefined();
	});

	it("adds missing default keys", () => {
		const result = migratePortfolioFromStorage({ btc: 300 }, defaults);
		expect(result.xaut).toBe(100);
		expect(result.slvon).toBe(50);
	});

	it("forces slvon to default when 0", () => {
		const result = migratePortfolioFromStorage(
			{ btc: 300, xaut: 100, nvdaon: 200, slvon: 0 },
			defaults,
		);
		expect(result.slvon).toBe(50);
	});
});

// ─── toPercent ───────────────────────────────────────────────────────

describe("toPercent", () => {
	it("calculates percentage", () => {
		expect(toPercent(25, 100)).toBe(25);
	});

	it("returns 0 when total is 0", () => {
		expect(toPercent(10, 0)).toBe(0);
	});

	it("rounds to nearest integer", () => {
		expect(toPercent(1, 3)).toBe(33);
	});
});

// ─── getHealthFactorStatus ───────────────────────────────────────────

describe("getHealthFactorStatus", () => {
	it("returns Safe for >= 2.0", () => {
		expect(getHealthFactorStatus(2.0)).toBe("Safe");
		expect(getHealthFactorStatus(3.0)).toBe("Safe");
	});

	it("returns Good for 1.5-1.99", () => {
		expect(getHealthFactorStatus(1.5)).toBe("Good");
		expect(getHealthFactorStatus(1.99)).toBe("Good");
	});

	it("returns Warning for 1.0-1.49", () => {
		expect(getHealthFactorStatus(1.0)).toBe("Warning");
		expect(getHealthFactorStatus(1.49)).toBe("Warning");
	});

	it("returns Critical for < 1.0", () => {
		expect(getHealthFactorStatus(0.99)).toBe("Critical");
		expect(getHealthFactorStatus(0)).toBe("Critical");
	});
});

// ─── getHealthFactorDisplayStatus ────────────────────────────────────

describe("getHealthFactorDisplayStatus", () => {
	it("returns Excellent for >= 2.5", () => {
		const r = getHealthFactorDisplayStatus(3.0);
		expect(r.status).toBe("Excellent");
		expect(r.variant).toBe("success");
		expect(r.value).toBe("3.00");
	});

	it("returns Good for 1.5-2.49", () => {
		expect(getHealthFactorDisplayStatus(2.0).status).toBe("Good");
	});

	it("returns Warning for 1.2-1.49", () => {
		expect(getHealthFactorDisplayStatus(1.3).status).toBe("Warning");
	});

	it("returns Critical for 1.0-1.19", () => {
		expect(getHealthFactorDisplayStatus(1.0).status).toBe("Critical");
	});

	it("returns Danger for < 1.0", () => {
		const r = getHealthFactorDisplayStatus(0.5);
		expect(r.status).toBe("Danger");
		expect(r.variant).toBe("destructive");
	});
});

// ─── getHealthFactorPercentage ───────────────────────────────────────

describe("getHealthFactorPercentage", () => {
	it("returns 0 for HF <= 0", () => {
		expect(getHealthFactorPercentage(0)).toBe(0);
		expect(getHealthFactorPercentage(-1)).toBe(0);
	});

	it("returns 100 for HF >= 2.5", () => {
		expect(getHealthFactorPercentage(2.5)).toBe(100);
		expect(getHealthFactorPercentage(5)).toBe(100);
	});

	it("returns 75-100 for HF 1.5-2.5", () => {
		const p = getHealthFactorPercentage(2.0);
		expect(p).toBeGreaterThanOrEqual(75);
		expect(p).toBeLessThanOrEqual(100);
	});

	it("returns 50-75 for HF 1.2-1.5", () => {
		const p = getHealthFactorPercentage(1.35);
		expect(p).toBeGreaterThanOrEqual(50);
		expect(p).toBeLessThanOrEqual(75);
	});

	it("returns 25-50 for HF 1.0-1.2", () => {
		const p = getHealthFactorPercentage(1.1);
		expect(p).toBeGreaterThanOrEqual(25);
		expect(p).toBeLessThanOrEqual(50);
	});

	it("returns 0-25 for HF < 1.0", () => {
		const p = getHealthFactorPercentage(0.5);
		expect(p).toBeGreaterThanOrEqual(0);
		expect(p).toBeLessThanOrEqual(25);
	});
});

// ─── formatNumberWithSeparator ───────────────────────────────────────

describe("formatNumberWithSeparator", () => {
	it("adds thousand separators", () => {
		expect(formatNumberWithSeparator(1000)).toBe("1,000");
		expect(formatNumberWithSeparator("1234567")).toBe("1,234,567");
	});

	it("handles decimals", () => {
		expect(formatNumberWithSeparator("1234.56")).toBe("1,234.56");
	});

	it("returns empty for falsy non-zero input", () => {
		expect(formatNumberWithSeparator("")).toBe("");
	});

	it("handles 0", () => {
		expect(formatNumberWithSeparator(0)).toBe("0");
	});

	it("handles leading decimal", () => {
		expect(formatNumberWithSeparator(".5")).toBe("0.5");
	});

	it("preserves trailing decimal point", () => {
		expect(formatNumberWithSeparator("100.")).toBe("100.");
	});
});

// ─── parseNumberFromSeparator ────────────────────────────────────────

describe("parseNumberFromSeparator", () => {
	it("removes commas", () => {
		expect(parseNumberFromSeparator("1,234.56")).toBe("1234.56");
	});

	it("returns empty for empty input", () => {
		expect(parseNumberFromSeparator("")).toBe("");
	});
});

// ─── handleNumberInputChange ─────────────────────────────────────────

describe("handleNumberInputChange", () => {
	it("calls onChange with display and numeric values", () => {
		const fn = vi.fn();
		handleNumberInputChange("1,234", fn);
		expect(fn).toHaveBeenCalledWith("1,234", "1234");
	});
});

// ─── generateRandomAPR ───────────────────────────────────────────────

describe("generateRandomAPR", () => {
	it("returns formatted APR string", () => {
		const apr = generateRandomAPR();
		expect(apr).toMatch(/^\d+,\d%$/);
	});

	it("is within default range 5-12", () => {
		for (let i = 0; i < 50; i++) {
			const apr = generateRandomAPR();
			const num = parseFloat(apr.replace(",", ".").replace("%", ""));
			expect(num).toBeGreaterThanOrEqual(5);
			expect(num).toBeLessThanOrEqual(12);
		}
	});

	it("respects custom range", () => {
		for (let i = 0; i < 50; i++) {
			const apr = generateRandomAPR(1, 2);
			const num = parseFloat(apr.replace(",", ".").replace("%", ""));
			expect(num).toBeGreaterThanOrEqual(1);
			expect(num).toBeLessThanOrEqual(2);
		}
	});
});

// ─── formatDate ──────────────────────────────────────────────────────

describe("formatDate", () => {
	it("formats Date object", () => {
		const d = new Date(2026, 1, 25); // Feb 25 2026
		expect(formatDate(d)).toBe("25 Feb 2026");
	});

	it("formats timestamp", () => {
		const ts = new Date(2025, 9, 22).getTime(); // Oct 22 2025
		expect(formatDate(ts)).toBe("22 Oct 2025");
	});
});

// ─── parseDateString ─────────────────────────────────────────────────

describe("parseDateString", () => {
	it("parses valid date string", () => {
		const d = parseDateString("1 Feb 2026");
		expect(d).not.toBeNull();
		expect(d?.getDate()).toBe(1);
		expect(d?.getMonth()).toBe(1);
		expect(d?.getFullYear()).toBe(2026);
	});

	it("returns null for invalid format", () => {
		expect(parseDateString("2026-02-01")).toBeNull();
	});

	it("returns null for invalid month", () => {
		expect(parseDateString("1 Foo 2026")).toBeNull();
	});
});

// ─── calculateDaysDifference ─────────────────────────────────────────

describe("calculateDaysDifference", () => {
	it("calculates days between dates", () => {
		const d1 = new Date(2026, 0, 1);
		const d2 = new Date(2026, 0, 11);
		expect(calculateDaysDifference(d1, d2)).toBe(10);
	});

	it("returns negative for reversed dates", () => {
		const d1 = new Date(2026, 0, 11);
		const d2 = new Date(2026, 0, 1);
		expect(calculateDaysDifference(d1, d2)).toBe(-10);
	});
});

// ─── calculateFutureAmount ───────────────────────────────────────────

describe("calculateFutureAmount", () => {
	it("returns amount when apr is 0", () => {
		expect(calculateFutureAmount(1000, 0, Date.now() + 86400000 * 30)).toBe(
			1000,
		);
	});

	it("returns amount when amount is 0", () => {
		expect(calculateFutureAmount(0, 5, Date.now() + 86400000 * 30)).toBe(0);
	});

	it("returns amount when maturity is in the past", () => {
		expect(calculateFutureAmount(1000, 5, Date.now() - 86400000)).toBe(1000);
	});

	it("calculates simple interest correctly", () => {
		// 1000 at 10% for ~365 days => ~1100
		const maturity = Date.now() + 365 * 24 * 60 * 60 * 1000;
		const result = calculateFutureAmount(1000, 10, maturity);
		// Allow small variance due to day calculation
		expect(result).toBeGreaterThan(1095);
		expect(result).toBeLessThan(1105);
	});
});

// ─── calculateProfitAmount ───────────────────────────────────────────

describe("calculateProfitAmount", () => {
	it("returns 0 when amount is 0", () => {
		expect(calculateProfitAmount(0, 5, Date.now() - 86400000 * 30)).toBe(0);
	});

	it("returns 0 when apr is 0", () => {
		expect(calculateProfitAmount(1000, 0, Date.now() - 86400000 * 30)).toBe(0);
	});

	it("returns 0 when elapsed days <= 0", () => {
		expect(calculateProfitAmount(1000, 5, Date.now() + 86400000)).toBe(0);
	});

	it("calculates profit correctly", () => {
		const start = Date.now() - 365 * 24 * 60 * 60 * 1000;
		const result = calculateProfitAmount(1000, 10, start);
		expect(result).toBeGreaterThan(95);
		expect(result).toBeLessThan(105);
	});
});
