import { io, type Socket } from "socket.io-client";

function resolveWsUrl(): string {
	if (process.env.NEXT_PUBLIC_WS_URL) {
		return process.env.NEXT_PUBLIC_WS_URL;
	}

	if (typeof window !== "undefined") {
		const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
		return `${protocol}//${window.location.host}`;
	}

	throw new Error(
		"NEXT_PUBLIC_WS_URL must be defined when creating a WebSocket connection on the server side.",
	);
}

let socket: Socket | null = null;
let refCount = 0;

export function acquireSocket(): Socket {
	if (!socket) {
		const url = resolveWsUrl();
		socket = io(url, {
			autoConnect: true,
			transports: ["websocket"],
		});
	} else if (!socket.connected) {
		socket.connect();
	}
	refCount++;
	return socket;
}

export function releaseSocket(): void {
	refCount = Math.max(0, refCount - 1);
	if (refCount === 0 && socket) {
		socket.disconnect();
		socket = null;
	}
}
