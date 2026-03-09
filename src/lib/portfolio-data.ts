// Shared portfolio data and token list
// This file contains the portfolio state that should be shared across components

export interface TokenInfo {
  logo: string;
  value: string;
  label: string;
  ltv: number; // Loan-to-Value (e.g., 0.75 = 75%)
  price: number;
  liquidationThreshold?: number; // Liquidation Threshold (default: LTV * 0.92)
  liquidationPenalty?: number; // Liquidation Penalty in percentage (default: 1-5%)
}

export const tokenList: TokenInfo[] = [
  { 
    logo: "/tokens/btc-icon.svg", 
    value: "btc", 
    label: "Bitcoin", 
    ltv: 0.75, 
    price: 45000,
    liquidationThreshold: 0.80, // 80% of LTV
    liquidationPenalty: 5, // 5%
  },
  { 
    logo: "/tokens/xaut-icon.png", 
    value: "xaut", 
    label: "Tether Gold", 
    ltv: 0.75, 
    price: 2000,
    liquidationThreshold: 0.80,
    liquidationPenalty: 5,
  },
  { 
    logo: "/tokens/centuari-eth.png", 
    value: "eth", 
    label: "Ethereum", 
    ltv: 0.80, 
    price: 2800,
    liquidationThreshold: 0.82,
    liquidationPenalty: 5,
  },
  { 
    logo: "/tokens/eth-icon.svg", 
    value: "arb", 
    label: "Arbitrum", 
    ltv: 0.65, 
    price: 1.2,
    liquidationThreshold: 0.70,
    liquidationPenalty: 8,
  },
  {
    logo: "/tokens/usdc-icon.svg",
    value: "usdc",
    label: "USDC",
    ltv: 0.90,
    price: 1,
    liquidationThreshold: 0.92,
    liquidationPenalty: 1,
  },
  {
    logo: "/tokens/usdt-icon.svg",
    value: "usdt",
    label: "USDT",
    ltv: 0.90,
    price: 1,
    liquidationThreshold: 0.92,
    liquidationPenalty: 1,
  },
  { 
    logo: "/tokens/usdc-icon.svg", 
    value: "dai", 
    label: "DAI", 
    ltv: 0.85, 
    price: 1,
    liquidationThreshold: 0.88,
    liquidationPenalty: 3,
  },
  {
    logo: "/tokens/xsgd-icon.png",
    value: "xsgd",
    label: "XSGD",
    ltv: 0.90,
    price: 1,
    liquidationThreshold: 0.92,
    liquidationPenalty: 1,
  },
  {
    logo: "/tokens/idrx-icon.png",
    value: "idrx",
    label: "IDRX",
    ltv: 0.90,
    price: 1,
    liquidationThreshold: 0.92,
    liquidationPenalty: 1,
  },
  {
    logo: "/tokens/centuari-eth.png",
    value: "centuari",
    label: "Centuari",
    ltv: 0.80,
    price: 0.5,
    liquidationThreshold: 0.82,
    liquidationPenalty: 5,
  },
  {
    logo: "/tokens/nvda-icon.svg",
    value: "nvdaon",
    label: "NVIDIA (Ondo Tokenized)",
    ltv: 0.75,
    price: 150,
    liquidationThreshold: 0.80,
    liquidationPenalty: 5,
  },
  {
    logo: "/tokens/centuari-appl.png",
    value: "aaplon",
    label: "Apple (Ondo Tokenized)",
    ltv: 0.75,
    price: 230,
    liquidationThreshold: 0.80,
    liquidationPenalty: 5,
  },
  {
    logo: "/tokens/centuari-tlton.png",
    value: "tlton",
    label: "iShares 20+ Year Treasury Bond ETF (Ondo Tokenized)",
    ltv: 0.75,
    price: 95,
    liquidationThreshold: 0.80,
    liquidationPenalty: 5,
  },
  {
    logo: "/tokens/centuari-slvon.png",
    value: "slvon",
    label: "iShares Silver Trust (Ondo Tokenized)",
    ltv: 0.75,
    price: 28,
    liquidationThreshold: 0.80,
    liquidationPenalty: 5,
  },
];

// Default portfolio data (in real app, this would come from API/state management)
// Key: token value (e.g., "btc", "eth"), Value: USD amount
export const defaultPortfolio: Record<string, number> = {
  btc: 100000, // BTC value $100k
  eth: 50000,  // ETH value $50k
  xaut: 25000, // Tether Gold value $25k
  usdc: 15000, // USDC value $15k
  usdt: 10000, // USDT value $10k
  xsgd: 5000,  // XSGD value $5k
  idrx: 5000,  // IDRX value $5k
  nvdaon: 30000, // NVIDIA value $30k
  aaplon: 23000, // Apple (Ondo Tokenized) value ~$23k
  tlton: 15000, // TLTon value $15k
  slvon: 14000, // iShares Silver Trust value $14k
};

// Helper function to get token info by value
export function getTokenInfo(value: string): TokenInfo | undefined {
  return tokenList.find(token => token.value === value);
}

// Helper function to get token symbol from label
export function getTokenSymbol(label: string): string {
  // Map common labels to symbols
  const symbolMap: Record<string, string> = {
    "Bitcoin": "BTC",
    "Ethereum": "ETH",
    "Tether Gold": "XAUT",
    "Arbitrum": "ARB",
    "USDC": "USDC",
    "USDT": "USDT",
    "DAI": "DAI",
    "XSGD": "XSGD",
    "IDRX": "IDRX",
    "Centuari": "CENT",
    "NVIDIA": "NVDAon",
    "Apple": "AAPLon",
    "TLTon": "TLTon",
    "iShares Silver Trust": "SLVOn",
  };
  return symbolMap[label] || label.toUpperCase().slice(0, 4);
}

// Helper function to get liquidation threshold (default: LTV * 0.92)
export function getLiquidationThreshold(token: TokenInfo): number {
  return token.liquidationThreshold || token.ltv * 0.92;
}

// Helper function to get liquidation penalty (default: 5%)
export function getLiquidationPenalty(token: TokenInfo): number {
  return token.liquidationPenalty || 5;
}
