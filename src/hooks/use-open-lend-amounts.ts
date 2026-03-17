"use client";

import { useQuery } from "@tanstack/react-query";
import { getOpenLendAmounts } from "@/lib/api";
import { useAuthToken } from "@/hooks/use-auth-token";

/**
 * Fetches the total locked amount per asset for the current user's
 * open lend orders (OPEN + PARTIALLY_FILLED).
 *
 * Returns a Map<assetId, lockedAmountHuman> for easy lookup.
 */
export function useOpenLendAmounts() {
	const { getToken } = useAuthToken();

	return useQuery({
		queryKey: ["open-lend-amounts"],
		queryFn: async () => {
			const jwt = await getToken();
			if (!jwt) return new Map<string, number>();
			const data = await getOpenLendAmounts(jwt);
			const map = new Map<string, number>();
			for (const item of data) {
				map.set(item.assetId, Number.parseFloat(item.lockedAmount));
			}
			return map;
		},
		staleTime: 10_000,
		refetchInterval: 15_000,
	});
}
