import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DepositToken } from "@/lib/api";
import { QUERY_CONFIG } from "@/lib/query-config";
import {
	__resetMirrorForTesting,
	getTokenMirror,
	readTokenCache,
	setTokenCache,
} from "@/lib/token-cache";

const CHAIN_A = 421614;
const CHAIN_B = 42161;

function makeToken(overrides: Partial<DepositToken> = {}): DepositToken {
	return {
		id: "id-usdc",
		symbol: "USDC",
		name: "USD Coin",
		tokenAddress: "0x0000000000000000000000000000000000000001",
		decimals: 6,
		imageUrl: "/tokens/usdc-icon.webp",
		chainId: CHAIN_A,
		...overrides,
	};
}

beforeEach(() => {
	localStorage.clear();
	__resetMirrorForTesting();
});

afterEach(() => {
	vi.useRealTimers();
});

describe("setTokenCache + readTokenCache", () => {
	it("round-trips tokens written to a chain key", () => {
		const tokens = [makeToken()];
		setTokenCache(CHAIN_A, tokens);
		expect(readTokenCache(CHAIN_A)).toEqual(tokens);
	});

	it("populates the mirror keyed by lowercased symbol", () => {
		setTokenCache(CHAIN_A, [makeToken({ symbol: "USDC" })]);
		expect(getTokenMirror().get("usdc")).toBeDefined();
		expect(getTokenMirror().get("USDC")).toBeUndefined();
	});

	it("returns null when no entry exists for the chain", () => {
		expect(readTokenCache(CHAIN_A)).toBeNull();
	});

	it("returns null when the entry is expired (TTL exceeded)", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
		setTokenCache(CHAIN_A, [makeToken()]);
		vi.setSystemTime(
			Date.now() + QUERY_CONFIG.DEPOSIT_TOKENS_STALE_TIME + 1000,
		);
		expect(readTokenCache(CHAIN_A)).toBeNull();
	});

	it("returns the entry when still within TTL", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
		setTokenCache(CHAIN_A, [makeToken()]);
		vi.setSystemTime(
			Date.now() + QUERY_CONFIG.DEPOSIT_TOKENS_STALE_TIME - 1000,
		);
		expect(readTokenCache(CHAIN_A)).toEqual([makeToken()]);
	});

	it("returns null when stored chainId does not match the key", () => {
		const payload = {
			chainId: CHAIN_B,
			fetchedAt: Date.now(),
			tokens: [makeToken()],
		};
		localStorage.setItem(
			`centuari:tokens:v1:${CHAIN_A}`,
			JSON.stringify(payload),
		);
		expect(readTokenCache(CHAIN_A)).toBeNull();
	});

	it("returns null on malformed JSON", () => {
		localStorage.setItem(`centuari:tokens:v1:${CHAIN_A}`, "not-json");
		expect(readTokenCache(CHAIN_A)).toBeNull();
	});

	it("returns null when the stored payload is missing required fields", () => {
		localStorage.setItem(
			`centuari:tokens:v1:${CHAIN_A}`,
			JSON.stringify({ chainId: CHAIN_A }),
		);
		expect(readTokenCache(CHAIN_A)).toBeNull();
	});

	it("isolates entries per chain", () => {
		setTokenCache(CHAIN_A, [makeToken({ symbol: "USDC", chainId: CHAIN_A })]);
		setTokenCache(CHAIN_B, [makeToken({ symbol: "USDT", chainId: CHAIN_B })]);
		expect(readTokenCache(CHAIN_A)?.[0]?.symbol).toBe("USDC");
		expect(readTokenCache(CHAIN_B)?.[0]?.symbol).toBe("USDT");
	});

	it("round-trips an empty tokens array", () => {
		setTokenCache(CHAIN_A, []);
		expect(readTokenCache(CHAIN_A)).toEqual([]);
	});

	it("still updates the mirror when localStorage.setItem throws", () => {
		const original = window.localStorage.setItem;
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		window.localStorage.setItem = vi.fn(() => {
			throw new Error("QuotaExceeded");
		});

		expect(() => setTokenCache(CHAIN_A, [makeToken()])).not.toThrow();
		expect(getTokenMirror().get("usdc")).toBeDefined();

		window.localStorage.setItem = original;
		warnSpy.mockRestore();
	});

	it("readTokenCache returns null when localStorage.getItem throws", () => {
		const original = window.localStorage.getItem;
		window.localStorage.getItem = vi.fn(() => {
			throw new Error("Blocked");
		});

		expect(readTokenCache(CHAIN_A)).toBeNull();

		window.localStorage.getItem = original;
	});
});

describe("SSR safety (window undefined)", () => {
	it("readTokenCache returns null without accessing window", () => {
		vi.stubGlobal("window", undefined);
		expect(readTokenCache(CHAIN_A)).toBeNull();
		vi.unstubAllGlobals();
	});

	it("setTokenCache still hydrates the mirror but does not throw", () => {
		vi.stubGlobal("window", undefined);
		expect(() => setTokenCache(CHAIN_A, [makeToken()])).not.toThrow();
		expect(getTokenMirror().get("usdc")).toBeDefined();
		vi.unstubAllGlobals();
	});

	it("getTokenMirror returns the in-memory map regardless of window presence", () => {
		setTokenCache(CHAIN_A, [makeToken()]);
		vi.stubGlobal("window", undefined);
		expect(getTokenMirror().get("usdc")).toBeDefined();
		vi.unstubAllGlobals();
	});
});
