import { io, type Socket } from "socket.io-client";

function resolveWsUrl(): string {
	if (process.env.NEXT_PUBLIC_WS_URL) {
		// Socket.IO needs an HTTP(S) URL — it upgrades to WebSocket internally.
		return process.env.NEXT_PUBLIC_WS_URL
			.replace(/^ws:/, "http:")
			.replace(/^wss:/, "https:");
	}

	if (typeof window !== "undefined") {
		return `${window.location.protocol}//${window.location.host}`;
	}

	throw new Error(
		"NEXT_PUBLIC_WS_URL must be defined when creating a WebSocket connection on the server side.",
	);
}

let socket: Socket | null = null;
let refCount = 0;
let disconnectTimer: ReturnType<typeof setTimeout> | null = null;

export function acquireSocket(): Socket {
	if (disconnectTimer) {
		clearTimeout(disconnectTimer);
		disconnectTimer = null;
	}
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
		// Delay disconnect so React Strict Mode remounts can reclaim the socket
		disconnectTimer = setTimeout(() => {
			if (refCount === 0 && socket) {
				socket.disconnect();
				socket = null;
			}
			disconnectTimer = null;
		}, 1000);
	}
}
