import { beforeEach, describe, expect, it } from "vitest";
import type { DepositToken } from "@/lib/api";
import { ACTIVE_CHAIN } from "@/lib/chain-config";
import { __resetMirrorForTesting, setTokenCache } from "@/lib/token-cache";
import {
	getAllTokens,
	getMarketTokenList,
	getTokenLogo,
	MARKET_TOKEN_SYMBOLS,
} from "@/lib/tokens";

const DEFAULT_LOGO = "/tokens/usdc-icon.webp";

function makeToken(overrides: Partial<DepositToken> = {}): DepositToken {
	return {
		id: "id-x",
		symbol: "USDC",
		name: "USD Coin",
		tokenAddress: "0xusdc",
		decimals: 6,
		imageUrl: "/tokens/usdc-icon.webp",
		chainId: ACTIVE_CHAIN.id,
		...overrides,
	};
}

beforeEach(() => {
	localStorage.clear();
	__resetMirrorForTesting();
});

describe("MARKET_TOKEN_SYMBOLS", () => {
	it("contains the expected curated symbols", () => {
		expect([...MARKET_TOKEN_SYMBOLS]).toEqual(["usdc", "xsgd", "idrx"]);
	});
});

describe("getTokenLogo", () => {
	it("returns the imageUrl from the mirror when populated", () => {
		setTokenCache(ACTIVE_CHAIN.id, [
			makeToken({ symbol: "USDC", imageUrl: "/tokens/usdc-icon.webp" }),
		]);
		expect(getTokenLogo("usdc")).toBe("/tokens/usdc-icon.webp");
	});

	it("is case-insensitive on the lookup", () => {
		setTokenCache(ACTIVE_CHAIN.id, [
			makeToken({ symbol: "BTC", imageUrl: "/tokens/btc-icon.webp" }),
		]);
		expect(getTokenLogo("BTC")).toBe("/tokens/btc-icon.webp");
		expect(getTokenLogo("btc")).toBe("/tokens/btc-icon.webp");
	});

	it("prefers an assetImg argument that starts with /", () => {
		setTokenCache(ACTIVE_CHAIN.id, [
			makeToken({ symbol: "USDC", imageUrl: "/tokens/usdc-icon.webp" }),
		]);
		expect(getTokenLogo("usdc", "/custom/logo.png")).toBe("/custom/logo.png");
	});

	it("ignores assetImg that does not start with /", () => {
		setTokenCache(ACTIVE_CHAIN.id, [
			makeToken({ symbol: "USDC", imageUrl: "/tokens/usdc-icon.webp" }),
		]);
		expect(getTokenLogo("usdc", "https://example.com/logo.png")).toBe(
			"/tokens/usdc-icon.webp",
		);
	});

	it("falls back to DEFAULT_LOGO when mirror is empty", () => {
		expect(getTokenLogo("unknown")).toBe(DEFAULT_LOGO);
	});

	it("falls back to DEFAULT_LOGO when symbol is not in mirror", () => {
		setTokenCache(ACTIVE_CHAIN.id, [makeToken({ symbol: "USDC" })]);
		expect(getTokenLogo("zzz")).toBe(DEFAULT_LOGO);
	});

	it("falls back to DEFAULT_LOGO when cached imageUrl is null", () => {
		setTokenCache(ACTIVE_CHAIN.id, [
			makeToken({ symbol: "USDC", imageUrl: null }),
		]);
		expect(getTokenLogo("usdc")).toBe(DEFAULT_LOGO);
	});
});

describe("getAllTokens", () => {
	it("returns an empty array when mirror is empty", () => {
		expect(getAllTokens()).toEqual([]);
	});

	it("returns all tokens currently in the mirror", () => {
		const tokens = [
			makeToken({ symbol: "USDC" }),
			makeToken({ symbol: "BTC", id: "id-btc" }),
		];
		setTokenCache(ACTIVE_CHAIN.id, tokens);
		expect(getAllTokens()).toHaveLength(2);
		expect(getAllTokens().map((t) => t.symbol)).toEqual(["USDC", "BTC"]);
	});
});

describe("getMarketTokenList", () => {
	it("always returns the curated symbols, even when mirror is empty", () => {
		const list = getMarketTokenList();
		expect(list.map((t) => t.value)).toEqual(["usdc", "xsgd", "idrx"]);
		expect(list.map((t) => t.label)).toEqual(["USDC", "XSGD", "IDRX"]);
		for (const item of list) {
			expect(item.logo).toBe(DEFAULT_LOGO);
		}
	});

	it("resolves logos from the mirror when populated", () => {
		setTokenCache(ACTIVE_CHAIN.id, [
			makeToken({ symbol: "USDC", imageUrl: "/tokens/usdc-icon.webp" }),
			makeToken({
				symbol: "XSGD",
				id: "id-xsgd",
				imageUrl: "/tokens/xsgd-icon.webp",
			}),
		]);
		const list = getMarketTokenList();
		expect(list.find((t) => t.value === "usdc")?.logo).toBe(
			"/tokens/usdc-icon.webp",
		);
		expect(list.find((t) => t.value === "xsgd")?.logo).toBe(
			"/tokens/xsgd-icon.webp",
		);
		expect(list.find((t) => t.value === "idrx")?.logo).toBe(DEFAULT_LOGO);
	});

	it("returns items with the expected shape", () => {
		const item = getMarketTokenList()[0];
		expect(item).toMatchObject({
			logo: expect.any(String),
			value: expect.any(String),
			label: expect.any(String),
		});
	});
});
