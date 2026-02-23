"use client";

import { useQuery } from "@tanstack/react-query";
import { getMarketData } from "@/lib/api";
import type { MarketResponse } from "@/types/api";
import { useMemo } from "react";

export function useMarketData() {
	return useQuery<MarketResponse>({
		queryKey: ["market"],
		queryFn: getMarketData,
		staleTime: 30_000,
		refetchInterval: 60_000,
	});
}

export function useAssetId(symbol: string): string | undefined {
	const { data } = useMarketData();
	return useMemo(() => {
		if (!data) return undefined;
		const market = data.markets.find(
			(m) => m.asset.symbol.toLowerCase() === symbol.toLowerCase(),
		);
		return market?.asset.id;
	}, [data, symbol]);
}

export function useMarketIds(symbol: string): string[] | undefined {
	const { data } = useMarketData();
	return useMemo(() => {
		if (!data) return undefined;
		// Backend returns one MarketItem per asset; the marketIds are the
		// market UUIDs for that asset. For now, we treat the asset.id as
		// the market identifier since the /market endpoint returns assets
		// with their rates. The actual marketIds need to come from a
		// markets-by-asset lookup. We'll return a placeholder array with
		// the asset id, which the backend can resolve.
		const market = data.markets.find(
			(m) => m.asset.symbol.toLowerCase() === symbol.toLowerCase(),
		);
		return market ? [market.asset.id] : undefined;
	}, [data, symbol]);
}
