import type { DepositToken } from "@/lib/api";
import { getTokenMirror } from "@/lib/token-cache";

const DEFAULT_LOGO = "/tokens/usdc-icon.webp";

/** Curated symbols shown in market dropdowns. Product policy, not metadata. */
export const MARKET_TOKEN_SYMBOLS = ["usdc", "xsgd", "idrx"] as const;

export type MarketTokenSymbol = (typeof MARKET_TOKEN_SYMBOLS)[number];

export interface MarketTokenListItem {
	logo: string;
	value: string;
	label: string;
}

/** Get token logo path by value; prefer backend-provided assetImg when available. */
export function getTokenLogo(tokenValue: string, assetImg?: string): string {
	if (assetImg?.startsWith("/")) return assetImg;
	const cached = getTokenMirror().get(tokenValue.toLowerCase());
	if (cached?.imageUrl) return cached.imageUrl;
	return DEFAULT_LOGO;
}

/** All tokens currently known from the cached deposit token list. */
export function getAllTokens(): DepositToken[] {
	return Array.from(getTokenMirror().values());
}

/** Curated market token list with logos resolved from the cache (or default). */
export function getMarketTokenList(): MarketTokenListItem[] {
	return MARKET_TOKEN_SYMBOLS.map((symbol) => ({
		logo: getTokenLogo(symbol),
		value: symbol,
		label: symbol.toUpperCase(),
	}));
}
