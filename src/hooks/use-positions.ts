"use client";

import { useMyPositions } from "@/hooks/use-my-positions";
import type { Position } from "@/types/positions";
import type { MyPositionItem } from "@/lib/api";

function mapPositionItem(p: MyPositionItem): Position {
  const base = {
    id: p.id,
    marketId: p.marketId,
    assetImg: p.imageUrl ?? "",
    assetName: p.name,
    amount: p.amountInUsd,
    apr: Number(p.apr) || 0,
    tokenValue: p.symbol.toLowerCase(),
    tokenSymbol: p.symbol,
    maturity: (p.maturity ?? 0) * 1000,
    status: "success" as const,
    createdAt: "",
    timestamp: Date.now(),
  };

  if (p.side === "BORROW") {
    return { ...base, type: "borrow", collateralTokens: [] };
  }
  return { ...base, type: "lend" };
}

/**
 * Hook to read positions from the backend API.
 * Maps backend MyPositionItem to the frontend Position type.
 */
export function usePositions() {
  const { positions: allPositions, isLoading, refetch } = useMyPositions({ limit: 100 });

  const mapped = allPositions.map(mapPositionItem);

  return {
    positions: mapped,
    openOrders: [] as Position[],
    allTransactions: mapped,
    isLoading,
    refresh: refetch,
  };
}
