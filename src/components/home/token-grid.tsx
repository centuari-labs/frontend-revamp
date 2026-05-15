"use client";

import { useTokens, getTokenById } from "@/hooks/use-tokens";
import { CentuariTokenCard } from "@/components/centuari-token-card";
import { useMarketData } from "@/hooks/use-market-data";
import { TokenGridSkeleton } from "./token-grid-skeleton";

export function TokenGrid() {
  const { markets, isLoading } = useMarketData();
  const { tokens } = useTokens();

  if (isLoading) return <TokenGridSkeleton count={6} />;

  return (
    <div
      id="tour-token-grid"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4"
    >
      {markets.map((market, index) => {
        const assetId = market.assetId ?? market.asset?.id ?? "";
        const token = getTokenById(tokens, assetId);
        return (
          <CentuariTokenCard
            id={index + 1}
            key={assetId || index}
            asset_id={assetId}
            market_id={market.market.market_id ?? undefined}
            token_image={token?.imageUrl ?? market.asset?.image_url ?? "/tokens/default-icon.svg"}
            token_name={token?.name ?? market.asset?.name ?? ""}
            token_symbol={token?.symbol ?? market.asset?.symbol ?? ""}
            borrow_rate={market.borrow_rate}
            lend_rate={market.lend_rate}
            collateral_factor={market.collateral_factor}
          />
        );
      })}
    </div>
  );
}
