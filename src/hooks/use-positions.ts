"use client";

import { useState, useEffect, useCallback } from "react";
import { getAllPositions } from "@/lib/positions-adapter.mock";
import { USE_MOCK } from "@/lib/use-mock";
import { useMyPositions } from "./use-portfolio";
import type { Position } from "@/types/positions";

export function usePositions() {
	// ── Mock mode ──────────────────────────────────────
	const [openOrders, setOpenOrders] = useState<Position[]>([]);
	const [allTransactions, setAllTransactions] = useState<Position[]>([]);

	const refresh = useCallback(() => {
		if (typeof window === "undefined" || !USE_MOCK) return;
		const { openOrders: orders, allTransactions: transactions } =
			getAllPositions();
		setOpenOrders(orders);
		setAllTransactions(transactions);
	}, []);

	useEffect(() => {
		if (!USE_MOCK) return;

		refresh();

		const handleStorageChange = () => refresh();
		window.addEventListener("storage", handleStorageChange);
		window.addEventListener("centuari-positions-updated", handleStorageChange);

		const interval = setInterval(refresh, 500);
		return () => {
			window.removeEventListener("storage", handleStorageChange);
			window.removeEventListener(
				"centuari-positions-updated",
				handleStorageChange,
			);
			clearInterval(interval);
		};
	}, [refresh]);

	// ── API mode ───────────────────────────────────────
	const apiPositions = useMyPositions({
		page: 1,
		limit: 100,
	});

	if (!USE_MOCK) {
		const positions = apiPositions.data?.data ?? [];
		return {
			positions: positions as unknown as Position[],
			openOrders: [] as Position[],
			allTransactions: positions as unknown as Position[],
			refresh: () => apiPositions.refetch(),
		};
	}

	const positions = [...openOrders, ...allTransactions];

	return {
		positions,
		openOrders,
		allTransactions,
		refresh,
	};
}
