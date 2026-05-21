"use client";

import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";
import { acquireSocket, releaseSocket } from "@/lib/socket";

type PricesMap = Record<string, number>;

interface PriceContextValue {
	prices: PricesMap;
}

const PriceContext = createContext<PriceContextValue | undefined>(undefined);

export function PriceProvider({ children }: { children: ReactNode }) {
	const [prices, setPrices] = useState<PricesMap>({});

	// WebSocket mode: subscribe once to global prices channel
	useEffect(() => {
		const socket = acquireSocket();

		const handleSnapshot = (snapshot: PricesMap) => {
			setPrices(snapshot ?? {});
		};

		const handleUpdate = (update: PricesMap) => {
			setPrices(update ?? {});
		};

		socket.on("prices-snapshot", handleSnapshot);
		socket.on("prices-update", handleUpdate);

		socket.emit("subscribe-prices");

		return () => {
			socket.emit("unsubscribe-prices");
			socket.off("prices-snapshot", handleSnapshot);
			socket.off("prices-update", handleUpdate);
			releaseSocket();
		};
	}, []);

	const value = useMemo<PriceContextValue>(
		() => ({
			prices,
		}),
		[prices],
	);

	return (
		<PriceContext.Provider value={value}>{children}</PriceContext.Provider>
	);
}

export function useTokenPrices(): PricesMap {
	const ctx = useContext(PriceContext);
	if (!ctx) {
		throw new Error("useTokenPrices must be used within a PriceProvider");
	}
	return ctx.prices;
}

export function useTokenPrice(
	assetId: string | undefined | null,
): number | undefined {
	const prices = useTokenPrices();
	if (!assetId) return undefined;
	return prices[assetId] ?? undefined;
}
