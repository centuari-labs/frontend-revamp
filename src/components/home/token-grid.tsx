"use client";

import { CentuariTokenCard } from "@/components/centuari-token-card";

const TOKENS = [
  { image: "/tokens/centuari-usdt.png", name: "Tether", symbol: "USDT" },
  { image: "/tokens/usdc-icon.svg", name: "USD Coin", symbol: "USDC" },
  { image: "/tokens/sol-icon.svg", name: "Solana", symbol: "SOL" },
  { image: "/tokens/btc-icon.svg", name: "Bitcoin", symbol: "BTC" },
  { image: "/tokens/eth-icon.svg", name: "Ethereum", symbol: "ETH" },
  { image: "/tokens/chainlink-icon.svg", name: "Chainlink", symbol: "LINK" },
];

export function TokenGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      {TOKENS.map((token) => (
        <CentuariTokenCard
          key={token.symbol}
          token_image={token.image}
          token_name={token.name}
          token_symbol={token.symbol}
        />
      ))}
    </div>
  );
}
