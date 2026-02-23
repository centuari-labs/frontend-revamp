"use client";

import { useEffect, useState } from "react";

export interface DetectedWallet {
	info: {
		uuid: string;
		name: string;
		icon: string;
		rdns: string;
	};
	provider: EIP1193Provider;
}

export interface EIP1193Provider {
	request(args: { method: string; params?: unknown[] }): Promise<unknown>;
	on(event: string, handler: (...args: unknown[]) => void): void;
	removeListener(event: string, handler: (...args: unknown[]) => void): void;
}

interface EIP6963AnnounceEvent extends CustomEvent {
	detail: DetectedWallet;
}

declare global {
	interface WindowEventMap {
		"eip6963:announceProvider": EIP6963AnnounceEvent;
	}
}

export function useDetectedWallets() {
	const [wallets, setWallets] = useState<DetectedWallet[]>([]);

	useEffect(() => {
		const detected = new Map<string, DetectedWallet>();

		const handler = (event: EIP6963AnnounceEvent) => {
			const { info } = event.detail;
			if (!detected.has(info.rdns)) {
				detected.set(info.rdns, event.detail);
				setWallets(Array.from(detected.values()));
			}
		};

		window.addEventListener("eip6963:announceProvider", handler);
		// Request providers that already announced themselves
		window.dispatchEvent(new Event("eip6963:requestProvider"));

		return () => {
			window.removeEventListener("eip6963:announceProvider", handler);
		};
	}, []);

	return wallets;
}
