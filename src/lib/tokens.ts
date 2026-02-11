export const TOKENS = [
  { value: "usdt", label: "USDT", icon: "/tokens/usdt-icon.svg" },
  { value: "usdc", label: "USDC", icon: "/tokens/usdc-icon.svg" },
  { value: "btc", label: "BTC", icon: "/tokens/btc-icon.svg" },
  { value: "eth", label: "ETH", icon: "/tokens/eth-icon.svg" },
  { value: "nvda", label: "NVDA", icon: "/tokens/nvda-icon.svg" },
  { value: "xaut", label: "XAUT", icon: "/tokens/xaut-icon.png" },
  { value: "xsgd", label: "XSGD", icon: "/tokens/xsgd-icon.png" },
  { value: "idrx", label: "IDRX", icon: "/tokens/idrx-icon.png" },
] as const;

/** Token list for market page (dropdown, header, position section). */
export const MARKET_TOKEN_LIST: { logo: string; value: string; label: string }[] = [
  { logo: "/tokens/usdc-icon.svg", value: "usdc", label: "USDC" },
  { logo: "/tokens/xsgd-icon.png", value: "xsgd", label: "XSGD" },
  { logo: "/tokens/idrx-icon.png", value: "idrx", label: "IDRX" },
];

const TOKEN_LOGO_MAP: Record<string, string> = {
  usdc: "/tokens/usdc-icon.svg",
  xsgd: "/tokens/xsgd-icon.png",
  idrx: "/tokens/idrx-icon.png",
  usdt: "/tokens/centuari-usdt.png",
  btc: "/tokens/btc-icon.svg",
  eth: "/tokens/eth-icon.svg",
  sol: "/tokens/sol-icon.svg",
  link: "/tokens/chainlink-icon.svg",
  xaut: "/tokens/xaut-icon.png",
  arb: "/tokens/centuari-arbitrum.png",
  dai: "/tokens/centuari-dai.png",
  centuari: "/tokens/centuari-centuari.png",
};

const DEFAULT_LOGO = "/tokens/usdc-icon.svg";

/** Get token logo path by value; use assetImg if provided and starts with /. */
export function getTokenLogo(tokenValue: string, assetImg?: string): string {
  const mapped = TOKEN_LOGO_MAP[tokenValue.toLowerCase()];
  if (mapped) return mapped;
  if (assetImg && assetImg.startsWith("/")) return assetImg;
  return DEFAULT_LOGO;
}

export type TokenValue = (typeof TOKENS)[number]["value"];

export type Token = (typeof TOKENS)[number];

const DEFAULT_ICON = "/tokens/usdt-icon.svg";

export function getTokenIcon(value: string): string {
  const token = TOKENS.find((t) => t.value === value);
  return token?.icon ?? DEFAULT_ICON;
}

export function getTokenByValue(value: string): Token | undefined {
  return TOKENS.find((t) => t.value === value);
}
