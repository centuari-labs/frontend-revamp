import { vi } from "vitest";

type Listener = (...args: unknown[]) => void;

export interface MockSocket {
	on: ReturnType<typeof vi.fn>;
	off: ReturnType<typeof vi.fn>;
	emit: ReturnType<typeof vi.fn>;
	connect: ReturnType<typeof vi.fn>;
	disconnect: ReturnType<typeof vi.fn>;
	connected: boolean;
	_listeners: Map<string, Set<Listener>>;
	_simulateEvent: (event: string, ...args: unknown[]) => void;
}

export function createMockSocket(): MockSocket {
	const listeners = new Map<string, Set<Listener>>();

	const socket: MockSocket = {
		connected: false,
		_listeners: listeners,
		on: vi.fn((event: string, cb: Listener) => {
			if (!listeners.has(event)) listeners.set(event, new Set());
			listeners.get(event)?.add(cb);
			return socket;
		}),
		off: vi.fn((event: string, cb: Listener) => {
			listeners.get(event)?.delete(cb);
			return socket;
		}),
		emit: vi.fn(),
		connect: vi.fn(() => {
			socket.connected = true;
			return socket;
		}),
		disconnect: vi.fn(() => {
			socket.connected = false;
			return socket;
		}),
		_simulateEvent(event: string, ...args: unknown[]) {
			listeners.get(event)?.forEach((cb) => {
				cb(...args);
			});
		},
	};

	return socket;
}
