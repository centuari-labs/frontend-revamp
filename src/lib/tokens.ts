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
