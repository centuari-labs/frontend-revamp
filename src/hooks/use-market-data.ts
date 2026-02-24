import { useQuery } from "@tanstack/react-query";
import { getMarket, type MarketResponse } from "@/lib/api";

const FALLBACK_DATA: MarketResponse = {
	total_deposit: "521000000",
	active_loans: "248000000",
	markets: [
		{
			asset: {
				id: "mock-usdc",
				name: "USD Coin",
				symbol: "USDC",
				image_url: "/tokens/usdc-icon.svg",
				token_address: "0x0000000000000000000000000000000000000001",
			},
			borrow_rate: 10.1,
			lend_rate: 6.5,
			collateral_factor: 75,
		},
		{
			asset: {
				id: "mock-xsgd",
				name: "XSGD",
				symbol: "XSGD",
				image_url: "/tokens/xsgd-icon.png",
				token_address: "0x0000000000000000000000000000000000000002",
			},
			borrow_rate: 9.3,
			lend_rate: 5.2,
			collateral_factor: 75,
		},
		{
			asset: {
				id: "mock-idrx",
				name: "IDRX",
				symbol: "IDRX",
				image_url: "/tokens/idrx-icon.png",
				token_address: "0x0000000000000000000000000000000000000003",
			},
			borrow_rate: 11.2,
			lend_rate: 7.1,
			collateral_factor: 75,
		},
	],
};

export function useMarketData() {
	const query = useQuery({
		queryKey: ["market"],
		queryFn: getMarket,
		staleTime: 60_000,
		retry: 1,
	});

	const data = query.data ?? FALLBACK_DATA;

	return {
		totalDeposit: Number.parseFloat(data.total_deposit),
		activeLoans: Number.parseFloat(data.active_loans),
		markets: data.markets,
		isLoading: query.isLoading,
		isError: query.isError,
		isFallback: !query.data,
	};
}
