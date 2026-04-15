"use client";

import { CentuariTokenCard } from "@/components/centuari-token-card";
import { useMarketData } from "@/hooks/use-market-data";
import { TokenGridSkeleton } from "./token-grid-skeleton";

export function TokenGrid() {
  const { markets, isLoading } = useMarketData();

  if (isLoading) return <TokenGridSkeleton count={6} />;

  return (
    <div
      id="tour-token-grid"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4"
    >
      {markets.map((market, index) => (
        <CentuariTokenCard
          id={index + 1}
          key={market.asset.id}
          asset_id={market.asset.id}
          market_id={market.market.market_id ?? undefined}
          token_image={market.asset.image_url ?? "/tokens/default-icon.svg"}
          token_name={market.asset.name}
          token_symbol={market.asset.symbol}
          borrow_rate={market.borrow_rate}
          lend_rate={market.lend_rate}
          collateral_factor={market.collateral_factor}
        />
      ))}
    </div>
  );
}
