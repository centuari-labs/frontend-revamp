"use client";

import { CentuariTokenCard } from "@/components/centuari-token-card";
import { useMarketData } from "@/hooks/use-market-data";
import { useTokens, getTokenById } from "@/hooks/use-tokens";
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
				const token = getTokenById(tokens, market.assetId);
				return (
					<CentuariTokenCard
						id={index + 1}
						key={market.assetId}
						asset_id={market.assetId}
						market_id={market.market.market_id ?? undefined}
						token_image={token?.imageUrl ?? "/tokens/default-icon.svg"}
						token_name={token?.name ?? ""}
						token_symbol={token?.symbol ?? ""}
						borrow_rate={market.borrow_rate}
						lend_rate={market.lend_rate}
						collateral_factor={market.collateral_factor}
					/>
				);
			})}
		</div>
	);
}
