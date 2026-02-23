"use client";

import { useEffect, useState, useRef } from "react";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import type { OrderbookUpdate, SubscribeOrderbookParams } from "@/types/api";

export function useOrderbook(assetId: string | undefined, marketId: string | undefined) {
	const [orderbook, setOrderbook] = useState<OrderbookUpdate | null>(null);
	const [connected, setConnected] = useState(false);
	const paramsRef = useRef<SubscribeOrderbookParams | null>(null);

	useEffect(() => {
		if (!assetId || !marketId) return;

		const params: SubscribeOrderbookParams = { assetId, marketId };
		paramsRef.current = params;

		const socket = connectSocket();

		const handleConnect = () => setConnected(true);
		const handleDisconnect = () => setConnected(false);
		const handleUpdate = (data: OrderbookUpdate) => {
			setOrderbook(data);
		};

		socket.on("connect", handleConnect);
		socket.on("disconnect", handleDisconnect);
		socket.on("orderbook-update", handleUpdate);

		if (socket.connected) {
			setConnected(true);
		}

		socket.emit("subscribe-orderbook", params);

		return () => {
			socket.emit("unsubscribe-orderbook", params);
			socket.off("connect", handleConnect);
			socket.off("disconnect", handleDisconnect);
			socket.off("orderbook-update", handleUpdate);
			paramsRef.current = null;
		};
	}, [assetId, marketId]);

	return { orderbook, connected };
}
