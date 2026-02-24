import { io, type Socket } from "socket.io-client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3000";

let socket: Socket | null = null;
let refCount = 0;

export function acquireSocket(): Socket {
	if (!socket) {
		socket = io(WS_URL, {
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
