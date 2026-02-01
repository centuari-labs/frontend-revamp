"use client";

import { useState, useEffect, useCallback } from "react";
import { getAllPositions } from "@/lib/positions-adapter.mock";
import type { Position } from "@/types/positions";

/**
 * Hook to read positions and orders reactively.
 * openOrders: from centuari_open_orders (unfilled orders)
 * allTransactions: from centuari_positions (filled positions / All Transaction tab)
 */
export function usePositions() {
  const [openOrders, setOpenOrders] = useState<Position[]>([]);
  const [allTransactions, setAllTransactions] = useState<Position[]>([]);

  const refresh = useCallback(() => {
    if (typeof window === "undefined") return;
    const { openOrders: orders, allTransactions: transactions } = getAllPositions();
    setOpenOrders(orders);
    setAllTransactions(transactions);
  }, []);

  useEffect(() => {
    refresh();

    const handleStorageChange = () => refresh();
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("centuari-positions-updated", handleStorageChange);

    const interval = setInterval(refresh, 500);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("centuari-positions-updated", handleStorageChange);
      clearInterval(interval);
    };
  }, [refresh]);

  const positions = [...openOrders, ...allTransactions];

  return {
    positions,
    openOrders,
    allTransactions,
    refresh,
  };
}
