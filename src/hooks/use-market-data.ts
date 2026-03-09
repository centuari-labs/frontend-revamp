import { useQuery } from "@tanstack/react-query";
import { getMarket } from "@/lib/api";

export function useMarketData() {
	const query = useQuery({
		queryKey: ["market"],
		queryFn: getMarket,
		staleTime: 10_000,
		retry: 1,
	});

	return {
		totalDeposit: query.data ? Number.parseFloat(query.data.total_deposit) : 0,
		activeLoans: query.data ? Number.parseFloat(query.data.active_loans) : 0,
		markets: query.data?.markets ?? [],
		isLoading: query.isLoading,
		isError: query.isError,
	};
}
