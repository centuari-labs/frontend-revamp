"use client";

import { useOpenOrders } from "@/hooks/use-open-orders";
import { useMyPositions } from "@/hooks/use-my-positions";
import { useTransactionHistory } from "@/hooks/use-transaction-history";
import type { Position } from "@/types/positions";
import type { MyPositionItem, OpenOrderItem, TransactionHistoryItem } from "@/lib/api";

function mapPositionItem(p: MyPositionItem): Position {
  const base = {
    id: p.id,
    assetImg: p.imageUrl ?? "",
    assetName: p.name,
    amount: p.amountInUsd,
    apr: 0,
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

function mapOpenOrderItem(o: OpenOrderItem): Position {
  const base = {
    id: o.id,
    assetImg: o.asset.imageUrl ?? "",
    assetName: o.asset.name,
    amount: Number.parseFloat(o.amount) || 0,
    apr: o.rate / 100,
    tokenValue: o.asset.symbol.toLowerCase(),
    tokenSymbol: o.asset.symbol,
    maturity: o.maturity ? new Date(o.maturity).getTime() : 0,
    status: (o.status === "PARTIALLY_FILLED" ? "processing" : "pending") as "processing" | "pending",
    createdAt: o.createdAt,
    timestamp: new Date(o.createdAt).getTime(),
    orderType: o.orderType.toLowerCase() as "limit" | "market",
  };

  if (o.side === "BORROW") {
    return { ...base, type: "borrow", collateralTokens: [] };
  }
  return { ...base, type: "lend" };
}

function mapTransactionItem(t: TransactionHistoryItem): Position {
  const statusMap: Record<string, "pending" | "processing" | "success" | "failed"> = {
    OPEN: "pending",
    PARTIALLY_FILLED: "processing",
    FILLED: "success",
    CANCELLED: "failed",
  };

  const base = {
    id: t.id,
    assetImg: t.asset.imageUrl ?? "",
    assetName: t.asset.name,
    amount: Number.parseFloat(t.amount) || 0,
    apr: t.rate / 100,
    tokenValue: t.asset.symbol.toLowerCase(),
    tokenSymbol: t.asset.symbol,
    maturity: 0,
    status: statusMap[t.status] ?? "pending",
    createdAt: t.createdAt,
    timestamp: new Date(t.createdAt).getTime(),
    orderType: t.orderType?.toLowerCase() as "limit" | "market" | undefined,
  };

  if (t.side === "BORROW") {
    return { ...base, type: "borrow", collateralTokens: [] };
  }
  return { ...base, type: "lend" };
}

/**
 * Hook to read positions, open orders, and transactions from the backend API.
 * Optionally filters by assetId for market detail page.
 */
export function usePositions(options?: { assetId?: string }) {
  const assetId = options?.assetId;

  const { orders, isLoading: ordersLoading, refetch: refetchOrders } =
    useOpenOrders({ limit: 100, assetId });
  const { positions: rawPositions, isLoading: positionsLoading, refetch: refetchPositions } =
    useMyPositions({ limit: 100, assetId });
  const { transactions, isLoading: txLoading, refetch: refetchTx } =
    useTransactionHistory({ limit: 100, assetId });

  const openOrders = orders.map(mapOpenOrderItem);
  const positions = rawPositions.map(mapPositionItem);
  const allTransactions = transactions.map(mapTransactionItem);

  return {
    positions,
    openOrders,
    allTransactions,
    isLoading: ordersLoading || positionsLoading || txLoading,
    refresh: () => {
      refetchOrders();
      refetchPositions();
      refetchTx();
    },
  };
}
