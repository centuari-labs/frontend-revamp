"use client";

import { useEffect, useState, useRef } from "react";
import { acquireSocket, releaseSocket } from "@/lib/socket";

export type OrderRow = {
	apr: number;
	amount: number;
	side: "lend" | "borrow";
};

// ─── WebSocket types (mirror backend OrderbookUpdateDto) ─────────────

interface OrderbookLevel {
	rate: number;
	amount: string;
	orders: number;
}

interface OrderbookUpdate {
	assetId: string;
	lend: OrderbookLevel[];
	borrow: OrderbookLevel[];
	timestamp: number;
}

function levelsToRows(
	levels: OrderbookLevel[],
	side: "lend" | "borrow",
	decimals: number,
): OrderRow[] {
	return levels.map((level) => ({
		apr: level.rate / 100, // rate comes as percentage (e.g. 4.5), convert to decimal (0.045)
		amount: Number(level.amount) / 10 ** decimals,
		side,
	}));
}

// ─── Hook ────────────────────────────────────────────────────────────

export function useOrderbook(options?: {
	assetId?: string;
	decimals?: number;
}) {
	const { assetId, decimals = 6 } = options ?? {};

	const [borrowOrders, setBorrowOrders] = useState<OrderRow[]>([]);
	const [lendOrders, setLendOrders] = useState<OrderRow[]>([]);
	const [isConnected, setIsConnected] = useState(false);
	const subscribedRef = useRef<string | null>(null);

	// WebSocket mode
	useEffect(() => {
		if (!assetId) return;

		// Clear stale data immediately when the market changes
		setBorrowOrders([]);
		setLendOrders([]);

		const socket = acquireSocket();

		const onConnect = () => setIsConnected(true);
		const onDisconnect = () => setIsConnected(false);

		const onUpdate = (data: OrderbookUpdate) => {
			// Ignore updates that belong to a different market
			if (data.assetId !== assetId) return;
			setBorrowOrders(levelsToRows(data.borrow, "borrow", decimals));
			setLendOrders(levelsToRows(data.lend, "lend", decimals));
		};

		socket.on("connect", onConnect);
		socket.on("disconnect", onDisconnect);
		socket.on("orderbook-update", onUpdate);

		if (socket.connected) {
			setIsConnected(true);
		}

		socket.emit("subscribe-orderbook", { assetId });
		subscribedRef.current = assetId;

		return () => {
			socket.emit("unsubscribe-orderbook", { assetId });
			socket.off("connect", onConnect);
			socket.off("disconnect", onDisconnect);
			socket.off("orderbook-update", onUpdate);
			subscribedRef.current = null;
			releaseSocket();
		};
	}, [assetId, decimals]);

	return { borrowOrders, lendOrders, isConnected };
}
