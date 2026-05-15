export const TOKENS = [
	{ value: "usdt", label: "USDT", icon: "/tokens/usdt-icon.webp" },
	{ value: "usdc", label: "USDC", icon: "/tokens/usdc-icon.webp" },
	{ value: "btc", label: "BTC", icon: "/tokens/btc-icon.webp" },
	{ value: "eth", label: "ETH", icon: "/tokens/eth-icon.webp" },
	{ value: "nvda", label: "NVDA", icon: "/tokens/nvda-icon.webp" },
	{ value: "xaut", label: "XAUT", icon: "/tokens/xaut-icon.webp" },
	{ value: "xsgd", label: "XSGD", icon: "/tokens/xsgd-icon.webp" },
	{ value: "idrx", label: "IDRX", icon: "/tokens/idrx-icon.webp" },
] as const;

/** Token list for market page (dropdown, header, position section). */
export const MARKET_TOKEN_LIST: {
	logo: string;
	value: string;
	label: string;
}[] = [
	{ logo: "/tokens/usdc-icon.webp", value: "usdc", label: "USDC" },
	{ logo: "/tokens/xsgd-icon.webp", value: "xsgd", label: "XSGD" },
	{ logo: "/tokens/idrx-icon.webp", value: "idrx", label: "IDRX" },
];

const TOKEN_LOGO_MAP: Record<string, string> = {
	usdc: "/tokens/usdc-icon.webp",
	xsgd: "/tokens/xsgd-icon.webp",
	idrx: "/tokens/idrx-icon.webp",
	usdt: "/tokens/usdt-icon.webp",
	btc: "/tokens/btc-icon.webp",
	eth: "/tokens/eth-icon.webp",
	sol: "/tokens/sol-icon.webp",
	link: "/tokens/chainlink-icon.svg",
	xaut: "/tokens/xaut-icon.webp",
	arb: "/tokens/centuari-arbitrum.png",
	dai: "/tokens/centuari-dai.png",
	centuari: "/tokens/centuari-centuari.png",
};

const DEFAULT_LOGO = "/tokens/usdc-icon.webp";

/** Get token logo path by value; prefer backend-provided assetImg when available. */
export function getTokenLogo(tokenValue: string, assetImg?: string): string {
	if (assetImg && assetImg.startsWith("/")) return assetImg;
	const mapped = TOKEN_LOGO_MAP[tokenValue.toLowerCase()];
	if (mapped) return mapped;
	return DEFAULT_LOGO;
}

export type TokenValue = (typeof TOKENS)[number]["value"];

export type StaticToken = (typeof TOKENS)[number];

const DEFAULT_ICON = "/tokens/usdt-icon.webp";

export function getTokenIcon(value: string): string {
	const token = TOKENS.find((t) => t.value === value);
	return token?.icon ?? DEFAULT_ICON;
}

export function getTokenByValue(value: string): StaticToken | undefined {
	return TOKENS.find((t) => t.value === value);
}
