"use client";

import { useQuery } from "@tanstack/react-query";
import { getMarketDetail } from "@/lib/api";
import { useTokens, getTokenById } from "@/hooks/use-tokens";

interface UseMarketDetailResult {
	assetId: string | undefined;
	symbol: string | undefined;
	decimals: number | null | undefined;
	imageUrl: string | null | undefined;
	totalDeposit: number;
	activeLoans: number;
	collateralFactor: number;
	upcomingMaturities: {
		marketId: string;
		// Unix timestamp in milliseconds (normalized from seconds)
		maturity: number;
	}[];
	isLoading: boolean;
	isError: boolean;
	refetch: () => void;
}

export function useMarketDetail(
	assetId: string | undefined,
): UseMarketDetailResult {
	const { tokens } = useTokens();

	const query = useQuery({
		queryKey: ["market-detail", assetId],
		queryFn: () => {
			if (!assetId) {
				throw new Error("assetId is required");
			}
			return getMarketDetail(assetId);
		},
		enabled: Boolean(assetId),
		retry: 1,
	});

	const data = query.data;
	const token = data ? getTokenById(tokens, data.assetId) : undefined;

	return {
		assetId: data?.assetId,
		symbol: token?.symbol,
		decimals: token?.decimals ?? null,
		imageUrl: token?.imageUrl ?? null,
		totalDeposit: data ? Number.parseFloat(data.total_deposit) : 0,
		activeLoans: data ? Number.parseFloat(data.active_loans) : 0,
		collateralFactor: data ? data.collateral_factor : 0,
		upcomingMaturities:
			data?.upcoming_maturities.map((m) => ({
				marketId: m.market_id,
				// backend returns seconds, normalize to ms for UI components
				maturity: m.maturity * 1000,
			})) ?? [],
		isLoading: query.isLoading,
		isError: query.isError,
		refetch: query.refetch,
	};
}
