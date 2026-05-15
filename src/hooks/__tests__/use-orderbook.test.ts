import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "@testing-library/react";
import { renderHookWithProviders } from "@/__tests__/helpers/render-with-providers";
import {
	createMockSocket,
	type MockSocket,
} from "@/__tests__/helpers/mock-socket";

let mockSocket: MockSocket;

vi.mock("@/lib/socket", () => ({
	acquireSocket: vi.fn(() => mockSocket),
	releaseSocket: vi.fn(),
}));

beforeEach(() => {
	vi.useFakeTimers();
	mockSocket = createMockSocket();
});

afterEach(() => {
	vi.useRealTimers();
});

describe("useOrderbook (no assetId)", () => {
	it("returns empty orders when no assetId provided", async () => {
		const { useOrderbook } = await import("@/hooks/use-orderbook");
		const { result } = renderHookWithProviders(() => useOrderbook());

		expect(result.current.borrowOrders).toHaveLength(0);
		expect(result.current.lendOrders).toHaveLength(0);
	});

	it("does not subscribe to socket without assetId", async () => {
		const { useOrderbook } = await import("@/hooks/use-orderbook");
		renderHookWithProviders(() => useOrderbook());

		expect(mockSocket.emit).not.toHaveBeenCalled();
	});
});

describe("useOrderbook (WS mode)", () => {
	it("subscribes to orderbook with valid assetId", async () => {
		vi.resetModules();
		vi.doMock("@/lib/socket", () => ({
			acquireSocket: vi.fn(() => mockSocket),
			releaseSocket: vi.fn(),
		}));
		const { useOrderbook } = await import("@/hooks/use-orderbook");
		const assetId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

		renderHookWithProviders(() => useOrderbook({ assetId }));

		expect(mockSocket.emit).toHaveBeenCalledWith("subscribe-orderbook", {
			assetId,
		});
	});

	it("updates orders on orderbook-update event", async () => {
		vi.resetModules();
		vi.doMock("@/lib/socket", () => ({
			acquireSocket: vi.fn(() => mockSocket),
			releaseSocket: vi.fn(),
		}));
		const { useOrderbook } = await import("@/hooks/use-orderbook");
		const assetId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

		const { result } = renderHookWithProviders(() =>
			useOrderbook({ assetId, decimals: 6 }),
		);

		act(() => {
			mockSocket._simulateEvent("orderbook-update", {
				assetId,
				lend: [{ rate: 450, amount: "1000000", orders: 1 }],
				borrow: [{ rate: 500, amount: "2000000", orders: 2 }],
				timestamp: Date.now(),
			});
		});

		expect(result.current.lendOrders).toHaveLength(1);
		expect(result.current.lendOrders[0].apr).toBeCloseTo(0.045, 4);
		expect(result.current.lendOrders[0].amount).toBe(1);
		expect(result.current.borrowOrders).toHaveLength(1);
		expect(result.current.borrowOrders[0].apr).toBeCloseTo(0.05, 4);
	});

	it("ignores updates from different market", async () => {
		vi.resetModules();
		vi.doMock("@/lib/socket", () => ({
			acquireSocket: vi.fn(() => mockSocket),
			releaseSocket: vi.fn(),
		}));
		const { useOrderbook } = await import("@/hooks/use-orderbook");
		const assetId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

		const { result } = renderHookWithProviders(() => useOrderbook({ assetId }));

		act(() => {
			mockSocket._simulateEvent("orderbook-update", {
				assetId: "different-asset-id-0000-0000-000000000000",
				lend: [{ rate: 450, amount: "1000000", orders: 1 }],
				borrow: [],
				timestamp: Date.now(),
			});
		});

		// Should still be empty (cleared on mount for WS mode)
		expect(result.current.lendOrders).toHaveLength(0);
	});

	it("all orders have correct side field", async () => {
		vi.resetModules();
		vi.doMock("@/lib/socket", () => ({
			acquireSocket: vi.fn(() => mockSocket),
			releaseSocket: vi.fn(),
		}));
		const { useOrderbook } = await import("@/hooks/use-orderbook");
		const assetId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

		const { result } = renderHookWithProviders(() =>
			useOrderbook({ assetId, decimals: 6 }),
		);

		act(() => {
			mockSocket._simulateEvent("orderbook-update", {
				assetId,
				lend: [{ rate: 450, amount: "1000000", orders: 1 }],
				borrow: [{ rate: 500, amount: "2000000", orders: 2 }],
				timestamp: Date.now(),
			});
		});

		for (const o of result.current.borrowOrders) {
			expect(o.side).toBe("borrow");
		}
		for (const o of result.current.lendOrders) {
			expect(o.side).toBe("lend");
		}
	});
});
