"use client";

import { useEffect, useState, useCallback } from "react";
import { USE_MOCK } from "@/lib/use-mock";
import { acquireSocket, releaseSocket } from "@/lib/socket";

export type TradeRow = {
  id: string;
  time: string;
  type: "Lend" | "Borrow";
  amount: number;
  apr: number;
};

// ─── WebSocket types ─────────────────────────────────────────────────

interface RecentTradeEvent {
  assetId: string;
  side: "LEND" | "BORROW";
  amount: string;
  rate: number;
  timestamp: number;
}

function tradeEventToRow(event: RecentTradeEvent, decimals: number): TradeRow {
  const date = new Date(event.timestamp);
  const type = event.side === "LEND" ? "Lend" : "Borrow";
  const amount = Number(event.amount) / 10 ** decimals;
  const apr = event.rate / 10000;

  // Create a unique ID based on properties to help with deduplication
  const id = `${event.timestamp}-${type}-${amount}-${apr}`;

  return {
    id,
    time: date.toLocaleTimeString("en-US", { hour12: false }),
    type,
    amount,
    apr,
  };
}

// ─── Hook ────────────────────────────────────────────────────────────

const MAX_TRADES = 20;

export function useRecentTrades(options?: {
  assetId?: string;
  decimals?: number;
}) {
  const { assetId, decimals = 6 } = options ?? {};

  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const prependTrade = useCallback((trade: TradeRow) => {
    setTrades((prev) => {
      // Check if trade already exists
      if (prev.some((t) => t.id === trade.id)) return prev;

      const next = [trade, ...prev];
      if (next.length > MAX_TRADES) next.length = MAX_TRADES;
      return next;
    });
  }, []);

  // WebSocket mode
  useEffect(() => {
    if (!assetId) return;

    setTrades([]);

    const socket = acquireSocket();

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    const onTrade = (data: RecentTradeEvent) => {
      if (data.assetId !== assetId) return;
      prependTrade(tradeEventToRow(data, decimals));
    };

    const onSnapshot = (data: RecentTradeEvent[]) => {
      const rows = data.map((e) => tradeEventToRow(e, decimals));

      // Deduplicate snapshot just in case
      const uniqueRows: TradeRow[] = [];
      const seenIds = new Set<string>();

      for (const row of rows) {
        if (!seenIds.has(row.id)) {
          uniqueRows.push(row);
          seenIds.add(row.id);
        }
      }

      setTrades(uniqueRows.slice(0, MAX_TRADES));
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("recent-trade", onTrade);
    socket.on("recent-trades-snapshot", onSnapshot);

    if (socket.connected) {
      setIsConnected(true);
    }

    socket.emit("subscribe-recent-trades", { assetId });

    return () => {
      socket.emit("unsubscribe-recent-trades", { assetId });
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("recent-trade", onTrade);
      socket.off("recent-trades-snapshot", onSnapshot);
      releaseSocket();
    };
  }, [assetId, decimals, prependTrade]);

  return { trades, isConnected };
}
