"use client";

import { useEffect, useState, useRef } from "react";
import { isAddress } from "viem";
import { USE_MOCK } from "@/lib/use-mock";
import { getSocket } from "@/lib/socket";

export type OrderRow = {
	apr: number;
	amount: number;
	side: "lend" | "borrow";
};

// ─── Mock helpers (moved from order-book.tsx) ────────────────────────

const MOCK_BORROW: OrderRow[] = [
	{ apr: 0.0482, amount: 21000, side: "borrow" },
	{ apr: 0.048, amount: 18000, side: "borrow" },
	{ apr: 0.0477, amount: 15000, side: "borrow" },
	{ apr: 0.0475, amount: 12000, side: "borrow" },
	{ apr: 0.0473, amount: 9000, side: "borrow" },
	{ apr: 0.047, amount: 6500, side: "borrow" },
	{ apr: 0.0469, amount: 4500, side: "borrow" },
];

const MOCK_LEND: OrderRow[] = [
	{ apr: 0.0468, amount: 3500, side: "lend" },
	{ apr: 0.0465, amount: 5000, side: "lend" },
	{ apr: 0.0462, amount: 7000, side: "lend" },
	{ apr: 0.0459, amount: 9000, side: "lend" },
	{ apr: 0.0455, amount: 12000, side: "lend" },
	{ apr: 0.0453, amount: 15000, side: "lend" },
	{ apr: 0.0451, amount: 18000, side: "lend" },
];

function randomizeOrder(order: OrderRow, side: OrderRow["side"]): OrderRow {
	const aprDelta = (Math.random() - 0.5) * 0.0008;
	let nextApr = order.apr + aprDelta;
	const minApr = side === "borrow" ? 0.0465 : 0.0445;
	const maxApr = side === "borrow" ? 0.0495 : 0.0475;
	nextApr = Math.min(Math.max(nextApr, minApr), maxApr);
	const factor = 0.97 + Math.random() * 0.06;
	let nextAmount = Math.round(order.amount * factor);
	nextAmount = Math.min(Math.max(nextAmount, 2500), 25000);
	return { ...order, apr: nextApr, amount: nextAmount };
}

function generateRandomOrder(
	side: OrderRow["side"],
	anchorApr?: number,
): OrderRow {
	const baseApr = anchorApr ?? (side === "borrow" ? 0.0478 : 0.0462);
	const jitter = (Math.random() - 0.5) * 0.0012;
	let apr = baseApr + jitter;
	const minApr = side === "borrow" ? 0.0465 : 0.0445;
	const maxApr = side === "borrow" ? 0.0495 : 0.0475;
	apr = Math.min(Math.max(apr, minApr), maxApr);
	const amount =
		5000 + Math.round(Math.random() * (side === "borrow" ? 15000 : 13000));
	return { apr, amount, side };
}

function updateOrders(prev: OrderRow[], side: OrderRow["side"]): OrderRow[] {
	let updated = prev.map((o) => randomizeOrder(o, side));
	if (Math.random() < 0.45) {
		const bestApr =
			side === "borrow"
				? Math.min(...updated.map((o) => o.apr))
				: Math.max(...updated.map((o) => o.apr));
		const fresh = generateRandomOrder(side, bestApr);
		if (side === "borrow") {
			updated = [...updated, fresh];
		} else {
			updated = [fresh, ...updated];
		}
		if (updated.length > prev.length) {
			if (side === "borrow") {
				updated.shift();
			} else {
				updated.pop();
			}
		}
	}
	updated.sort((a, b) => b.apr - a.apr);
	if (updated.length > 0) {
		const edgeIndex = side === "borrow" ? updated.length - 1 : 0;
		const edge = updated[edgeIndex];
		const edgeAprDelta = (Math.random() - 0.5) * 0.0015;
		let edgeApr = edge.apr + edgeAprDelta;
		const minApr = side === "borrow" ? 0.0465 : 0.0445;
		const maxApr = side === "borrow" ? 0.0495 : 0.0475;
		edgeApr = Math.min(Math.max(edgeApr, minApr), maxApr);
		const edgeAmountFactor = 0.95 + Math.random() * 0.15;
		updated[edgeIndex] = {
			...edge,
			apr: edgeApr,
			amount: Math.round(edge.amount * edgeAmountFactor),
		};
	}
	return updated;
}

// ─── WebSocket types (mirror backend OrderbookUpdateDto) ─────────────

interface OrderbookLevel {
	rate: number;
	amount: string;
	orders: number;
}

interface OrderbookUpdate {
	loanToken: string;
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
	loanToken?: string;
	decimals?: number;
}) {
	const { loanToken, decimals = 6 } = options ?? {};

	const [borrowOrders, setBorrowOrders] = useState<OrderRow[]>(MOCK_BORROW);
	const [lendOrders, setLendOrders] = useState<OrderRow[]>(MOCK_LEND);
	const [isConnected, setIsConnected] = useState(false);
	const subscribedRef = useRef<string | null>(null);

	// Mock mode: randomize on interval
	useEffect(() => {
		if (!USE_MOCK) return;
		const interval = setInterval(() => {
			setBorrowOrders((prev) => updateOrders(prev, "borrow"));
			setLendOrders((prev) => updateOrders(prev, "lend"));
		}, 1100);
		return () => clearInterval(interval);
	}, []);

	// WebSocket mode
	useEffect(() => {
		if (USE_MOCK || !loanToken) return;

		if (!isAddress(loanToken)) {
			console.warn("[useOrderbook] Invalid loanToken address:", loanToken);
			return;
		}

		// Clear stale data immediately when the market changes
		setBorrowOrders([]);
		setLendOrders([]);

		const socket = getSocket();

		const onConnect = () => setIsConnected(true);
		const onDisconnect = () => setIsConnected(false);

		const onUpdate = (data: OrderbookUpdate) => {
			// Ignore updates that belong to a different market
			if (data.loanToken !== loanToken) return;
			setBorrowOrders(levelsToRows(data.borrow, "borrow", decimals));
			setLendOrders(levelsToRows(data.lend, "lend", decimals));
		};

		socket.on("connect", onConnect);
		socket.on("disconnect", onDisconnect);
		socket.on("orderbook-update", onUpdate);

		if (socket.connected) {
			setIsConnected(true);
		}

		socket.emit("subscribe-orderbook", { loanToken });
		subscribedRef.current = loanToken;

		return () => {
			socket.emit("unsubscribe-orderbook", { loanToken });
			socket.off("connect", onConnect);
			socket.off("disconnect", onDisconnect);
			socket.off("orderbook-update", onUpdate);
			subscribedRef.current = null;
		};
	}, [loanToken, decimals]);

	return { borrowOrders, lendOrders, isConnected };
}
