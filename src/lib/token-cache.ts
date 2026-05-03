import type { DepositToken } from "@/lib/api";
import { ACTIVE_CHAIN } from "@/lib/chain-config";
import { QUERY_CONFIG } from "@/lib/query-config";

const TOKEN_CACHE_KEY_PREFIX = "centuari:tokens:v1:";

interface CachedTokenPayload {
	chainId: number;
	fetchedAt: number;
	tokens: DepositToken[];
}

const mirror = new Map<string, DepositToken>();

function cacheKey(chainId: number): string {
	return `${TOKEN_CACHE_KEY_PREFIX}${chainId}`;
}

function hydrate(tokens: DepositToken[]): void {
	mirror.clear();
	for (const token of tokens) {
		mirror.set(token.symbol.toLowerCase(), token);
	}
}

export function readTokenCache(chainId: number): DepositToken[] | null {
	if (typeof window === "undefined") return null;
	let raw: string | null;
	try {
		raw = window.localStorage.getItem(cacheKey(chainId));
	} catch {
		return null;
	}
	if (!raw) return null;
	let parsed: CachedTokenPayload;
	try {
		parsed = JSON.parse(raw) as CachedTokenPayload;
	} catch {
		return null;
	}
	if (
		!parsed ||
		typeof parsed !== "object" ||
		!Array.isArray(parsed.tokens) ||
		typeof parsed.fetchedAt !== "number" ||
		parsed.chainId !== chainId
	) {
		return null;
	}
	if (Date.now() - parsed.fetchedAt > QUERY_CONFIG.DEPOSIT_TOKENS_STALE_TIME) {
		return null;
	}
	return parsed.tokens;
}

export function setTokenCache(chainId: number, tokens: DepositToken[]): void {
	hydrate(tokens);
	if (typeof window === "undefined") return;
	const payload: CachedTokenPayload = {
		chainId,
		fetchedAt: Date.now(),
		tokens,
	};
	try {
		window.localStorage.setItem(cacheKey(chainId), JSON.stringify(payload));
	} catch (error) {
		console.warn("[token-cache] Failed to persist token cache", error);
	}
}

export function getTokenMirror(): ReadonlyMap<string, DepositToken> {
	return mirror;
}

/** Test-only: reset the in-memory mirror. Not intended for production callers. */
export function __resetMirrorForTesting(): void {
	mirror.clear();
}

if (typeof window !== "undefined") {
	const cached = readTokenCache(ACTIVE_CHAIN.id);
	if (cached) hydrate(cached);
}
