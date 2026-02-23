"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { connectSocket } from "@/lib/socket";

export function useRealtimePositions(accountId: string | undefined) {
	const queryClient = useQueryClient();

	useEffect(() => {
		if (!accountId) return;

		const socket = connectSocket();

		socket.emit("active-positions", { accountId });
		socket.emit("open-positions", { accountId });

		const handleActivePositions = () => {
			queryClient.invalidateQueries({ queryKey: ["portfolio"] });
		};
		const handleOpenPositions = () => {
			queryClient.invalidateQueries({ queryKey: ["portfolio"] });
		};

		socket.on("active-positions", handleActivePositions);
		socket.on("open-positions", handleOpenPositions);

		return () => {
			socket.off("active-positions", handleActivePositions);
			socket.off("open-positions", handleOpenPositions);
		};
	}, [accountId, queryClient]);
}
