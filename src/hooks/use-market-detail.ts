import { useQuery } from "@tanstack/react-query";
import { getMarketDetail } from "@/lib/api";

interface UseMarketDetailResult {
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
}

export function useMarketDetail(assetId: string | undefined): UseMarketDetailResult {
	const query = useQuery({
		queryKey: ["market-detail", assetId],
		queryFn: () => {
			if (!assetId) {
				throw new Error("assetId is required");
			}
			return getMarketDetail(assetId);
		},
		enabled: Boolean(assetId),
		staleTime: 10_000,
		retry: 1,
	});

	const data = query.data;

	return {
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
	};
}

