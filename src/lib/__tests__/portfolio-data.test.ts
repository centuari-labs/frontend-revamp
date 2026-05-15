import { describe, it, expect } from "vitest";
import {
	tokenList,
	defaultPortfolio,
	getTokenInfo,
	getTokenSymbol,
	getLiquidationThreshold,
	getLiquidationPenalty,
} from "@/lib/portfolio-data";

describe("tokenList", () => {
	it("has at least 10 tokens", () => {
		expect(tokenList.length).toBeGreaterThanOrEqual(10);
	});

	it("every token has required fields", () => {
		for (const token of tokenList) {
			expect(token.logo).toBeTruthy();
			expect(token.value).toBeTruthy();
			expect(token.label).toBeTruthy();
			expect(token.ltv).toBeGreaterThan(0);
			expect(token.ltv).toBeLessThanOrEqual(1);
		}
	});
});

describe("defaultPortfolio", () => {
	it("has expected token keys", () => {
		expect(defaultPortfolio).toHaveProperty("btc");
		expect(defaultPortfolio).toHaveProperty("usdc");
		expect(defaultPortfolio).toHaveProperty("eth");
	});

	it("all values are positive numbers", () => {
		for (const val of Object.values(defaultPortfolio)) {
			expect(val).toBeGreaterThan(0);
		}
	});
});

describe("getTokenInfo", () => {
	it("finds token by value", () => {
		const info = getTokenInfo("usdc");
		expect(info).toBeDefined();
		expect(info?.label).toBe("USDC");
	});

	it("returns undefined for unknown token", () => {
		expect(getTokenInfo("zzz")).toBeUndefined();
	});
});

describe("getTokenSymbol", () => {
	it("maps Bitcoin label to BTC", () => {
		expect(getTokenSymbol("Bitcoin")).toBe("BTC");
	});

	it("maps USDC to USDC", () => {
		expect(getTokenSymbol("USDC")).toBe("USDC");
	});

	it("falls back to first 4 chars uppercased for unknown", () => {
		expect(getTokenSymbol("SomeRandomToken")).toBe("SOME");
	});

	it("handles short labels", () => {
		expect(getTokenSymbol("AB")).toBe("AB");
	});
});

describe("getLiquidationThreshold", () => {
	it("returns explicit threshold when set", () => {
		const btc = tokenList.find((t) => t.value === "btc")!;
		expect(getLiquidationThreshold(btc)).toBe(0.8);
	});

	it("falls back to ltv * 0.92 when not set", () => {
		const token = {
			...tokenList[0],
			liquidationThreshold: undefined,
			ltv: 0.75,
		};
		expect(getLiquidationThreshold(token)).toBeCloseTo(0.69);
	});
});

describe("getLiquidationPenalty", () => {
	it("returns explicit penalty when set", () => {
		const usdc = tokenList.find((t) => t.value === "usdc")!;
		expect(getLiquidationPenalty(usdc)).toBe(1);
	});

	it("falls back to 5 when not set", () => {
		const token = { ...tokenList[0], liquidationPenalty: undefined };
		expect(getLiquidationPenalty(token)).toBe(5);
	});
});
