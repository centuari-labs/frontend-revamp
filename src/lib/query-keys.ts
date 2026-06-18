import type { QueryClient } from "@tanstack/react-query";

export const QUERY_KEYS = {
	MY_ASSETS: "my-assets",
	MY_PORTFOLIO: "my-portfolio",
	LEND_BORROW_ASSETS: "lend-borrow-assets",
	MY_POSITIONS: "my-positions",
	OPEN_ORDERS: "open-orders",
	ORDER_HISTORY: "order-history",
	USER_DETAILS: "user-details",
	WITHDRAWABLE_MAX: "withdrawable-max",
} as const;

/** Invalidate all user-specific queries after a mutation */
export function invalidateUserQueries(queryClient: QueryClient) {
	const keys = [
		QUERY_KEYS.MY_ASSETS,
		QUERY_KEYS.MY_PORTFOLIO,
		QUERY_KEYS.LEND_BORROW_ASSETS,
		QUERY_KEYS.MY_POSITIONS,
		QUERY_KEYS.OPEN_ORDERS,
		QUERY_KEYS.ORDER_HISTORY,
		QUERY_KEYS.USER_DETAILS,
		QUERY_KEYS.WITHDRAWABLE_MAX,
	];
	for (const key of keys) {
		queryClient.invalidateQueries({ queryKey: [key] });
	}
}
