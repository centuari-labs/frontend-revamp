"use client";

import { useEffect, useState, useCallback } from "react";
import { USE_MOCK } from "@/lib/use-mock";
import { acquireSocket, releaseSocket } from "@/lib/socket";

export type TradeRow = {
	time: string;
	type: "Lend" | "Borrow";
	amount: number;
	apr: number;
};

// ─── Mock helpers ────────────────────────────────────────────────────

function randomTime(): string {
	const now = new Date();
	return now.toLocaleTimeString("en-US", { hour12: false });
}

function generateMockTrade(): TradeRow {
	const type = Math.random() < 0.5 ? "Lend" : "Borrow";
	const apr = 0.04 + Math.random() * 0.015;
	const amount = 1000 + Math.round(Math.random() * 9000);
	return { time: randomTime(), type, amount, apr };
}

// ─── WebSocket types ─────────────────────────────────────────────────

interface RecentTradeEvent {
	assetId: string;
	side: "LEND" | "BORROW";
	amount: string;
	rate: number;
	timestamp: number;
}

function tradeEventToRow(
	event: RecentTradeEvent,
	decimals: number,
): TradeRow {
	const date = new Date(event.timestamp);
	return {
		time: date.toLocaleTimeString("en-US", { hour12: false }),
		type: event.side === "LEND" ? "Lend" : "Borrow",
		amount: Number(event.amount) / 10 ** decimals,
		apr: event.rate / 10000,
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

	const prependTrade = useCallback(
		(trade: TradeRow) => {
			setTrades((prev) => {
				const next = [trade, ...prev];
				if (next.length > MAX_TRADES) next.length = MAX_TRADES;
				return next;
			});
		},
		[],
	);

	// Mock mode
	useEffect(() => {
		if (!USE_MOCK) return;
		const interval = setInterval(() => {
			prependTrade(generateMockTrade());
		}, 2000);
		return () => clearInterval(interval);
	}, [prependTrade]);

	// WebSocket mode
	useEffect(() => {
		if (USE_MOCK || !assetId) return;

		setTrades([]);

		const socket = acquireSocket();

		const onConnect = () => setIsConnected(true);
		const onDisconnect = () => setIsConnected(false);

		const onTrade = (data: RecentTradeEvent) => {
			if (data.assetId !== assetId) return;
			prependTrade(tradeEventToRow(data, decimals));
		};

		const onSnapshot = (data: RecentTradeEvent[]) => {
			setTrades(data.map((e) => tradeEventToRow(e, decimals)));
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
