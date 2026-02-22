export type FaucetCategory = "stablecoin" | "crypto" | "stock" | "commodity";

export type FaucetToken = {
  value: string;
  label: string;
  icon: string;
  category: FaucetCategory;
  dripAmount: number;
};

export const FAUCET_CATEGORIES = [
  { value: "all", label: "All Assets" },
  { value: "stablecoin", label: "Stablecoins" },
  { value: "crypto", label: "Crypto" },
  { value: "stock", label: "Stocks" },
  { value: "commodity", label: "Commodities" },
] as const;

export const FAUCET_TOKENS: FaucetToken[] = [
  { value: "usdc", label: "USDC", icon: "/tokens/usdc-icon.svg", category: "stablecoin", dripAmount: 5000 },
  { value: "idrx", label: "IDRX", icon: "/tokens/idrx-icon.png", category: "stablecoin", dripAmount: 100000000 },
  { value: "xsgd", label: "XSGD", icon: "/tokens/xsgd-icon.png", category: "stablecoin", dripAmount: 7000 },
  { value: "btc", label: "BTC", icon: "/tokens/btc-icon.svg", category: "crypto", dripAmount: 1 },
  { value: "eth", label: "ETH", icon: "/tokens/eth-icon.svg", category: "crypto", dripAmount: 10 },
  { value: "usdt", label: "USDT", icon: "/tokens/usdt-icon.svg", category: "stablecoin", dripAmount: 5000 },
  { value: "xaut", label: "XAUT", icon: "/tokens/xaut-icon.png", category: "commodity", dripAmount: 5 },
  { value: "nvda", label: "NVDA", icon: "/tokens/nvda-icon.svg", category: "stock", dripAmount: 100 },
];
