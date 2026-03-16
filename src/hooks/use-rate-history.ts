import { useQuery } from "@tanstack/react-query";
import { getRateHistory } from "@/lib/api";

interface UseRateHistoryResult {
	rateHistory: { date: string; rate: number }[];
	isLoading: boolean;
	isError: boolean;
}

export function useRateHistory(
	assetId: string | undefined,
): UseRateHistoryResult {
	const query = useQuery({
		queryKey: ["rate-history", assetId],
		queryFn: () => {
			if (!assetId) {
				throw new Error("assetId is required");
			}
			return getRateHistory(assetId);
		},
		enabled: Boolean(assetId),
		staleTime: 10_000,
		retry: 1,
	});

	return {
		rateHistory: query.data?.rateHistory ?? [],
		isLoading: query.isLoading,
		isError: query.isError,
	};
}
