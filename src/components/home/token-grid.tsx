"use client";

import { CentuariTokenCard } from "@/components/centuari-token-card";

const TOKENS = [
  { image: "/tokens/usdc-icon.svg", name: "USD Coin", symbol: "USDC" },
  { image: "/tokens/xsgd-icon.png", name: "XSGD", symbol: "XSGD" },
  { image: "/tokens/idrx-icon.png", name: "IDRX", symbol: "IDRX" },
];

export function TokenGrid() {
  return (
    <div
      id="tour-token-grid"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-8"
    >
      {TOKENS.map((token, index) => (
        <CentuariTokenCard
          id={index + 1}
          key={token.symbol}
          token_image={token.image}
          token_name={token.name}
          token_symbol={token.symbol}
        />
      ))}
    </div>
  );
}
