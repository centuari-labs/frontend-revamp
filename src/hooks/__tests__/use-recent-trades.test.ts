import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "@testing-library/react";
import { renderHookWithProviders } from "@/__tests__/helpers/render-with-providers";
import { createMockSocket, type MockSocket } from "@/__tests__/helpers/mock-socket";

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

describe("useRecentTrades (no assetId)", () => {
	it("starts with empty trades", async () => {
		const { useRecentTrades } = await import("@/hooks/use-recent-trades");
		const { result } = renderHookWithProviders(() => useRecentTrades());
		expect(result.current.trades).toHaveLength(0);
	});

	it("does not subscribe to socket without assetId", async () => {
		const { useRecentTrades } = await import("@/hooks/use-recent-trades");
		renderHookWithProviders(() => useRecentTrades());
		expect(mockSocket.emit).not.toHaveBeenCalled();
	});
});

describe("useRecentTrades (WS mode)", () => {
	it("subscribes and handles trade events", async () => {
		vi.resetModules();
		vi.doMock("@/lib/socket", () => ({
			acquireSocket: vi.fn(() => mockSocket),
			releaseSocket: vi.fn(),
		}));
		const { useRecentTrades } = await import("@/hooks/use-recent-trades");
		const assetId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

		const { result } = renderHookWithProviders(() =>
			useRecentTrades({ assetId, decimals: 6 }),
		);

		expect(mockSocket.emit).toHaveBeenCalledWith("subscribe-recent-trades", {
			assetId,
		});

		act(() => {
			mockSocket._simulateEvent("recent-trade", {
				assetId,
				side: "LEND",
				amount: "5000000",
				rate: 450,
				timestamp: Date.now(),
			});
		});

		expect(result.current.trades).toHaveLength(1);
		expect(result.current.trades[0].type).toBe("Lend");
		expect(result.current.trades[0].amount).toBe(5);
		expect(result.current.trades[0].apr).toBeCloseTo(0.045, 3);
	});

	it("handles snapshot event", async () => {
		vi.resetModules();
		vi.doMock("@/lib/socket", () => ({
			acquireSocket: vi.fn(() => mockSocket),
			releaseSocket: vi.fn(),
		}));
		const { useRecentTrades } = await import("@/hooks/use-recent-trades");
		const assetId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

		const { result } = renderHookWithProviders(() =>
			useRecentTrades({ assetId }),
		);

		act(() => {
			mockSocket._simulateEvent("recent-trades-snapshot", [
				{ assetId, side: "BORROW", amount: "1000000", rate: 500, timestamp: Date.now() },
				{ assetId, side: "LEND", amount: "2000000", rate: 450, timestamp: Date.now() + 1 },
			]);
		});

		expect(result.current.trades).toHaveLength(2);
	});

	it("caps at 20 trades", async () => {
		vi.resetModules();
		vi.doMock("@/lib/socket", () => ({
			acquireSocket: vi.fn(() => mockSocket),
			releaseSocket: vi.fn(),
		}));
		const { useRecentTrades } = await import("@/hooks/use-recent-trades");
		const assetId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

		const { result } = renderHookWithProviders(() =>
			useRecentTrades({ assetId, decimals: 6 }),
		);

		// Send 25 individual trades
		for (let i = 0; i < 25; i++) {
			act(() => {
				mockSocket._simulateEvent("recent-trade", {
					assetId,
					side: "LEND",
					amount: `${(i + 1) * 1000000}`,
					rate: 450 + i,
					timestamp: Date.now() + i * 1000,
				});
			});
		}

		expect(result.current.trades.length).toBeLessThanOrEqual(20);
	});

	it("trades have valid shape", async () => {
		vi.resetModules();
		vi.doMock("@/lib/socket", () => ({
			acquireSocket: vi.fn(() => mockSocket),
			releaseSocket: vi.fn(),
		}));
		const { useRecentTrades } = await import("@/hooks/use-recent-trades");
		const assetId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

		const { result } = renderHookWithProviders(() =>
			useRecentTrades({ assetId, decimals: 6 }),
		);

		act(() => {
			mockSocket._simulateEvent("recent-trade", {
				assetId,
				side: "LEND",
				amount: "5000000",
				rate: 450,
				timestamp: Date.now(),
			});
		});

		const trade = result.current.trades[0];
		expect(trade).toHaveProperty("time");
		expect(trade).toHaveProperty("type");
		expect(["Lend", "Borrow"]).toContain(trade.type);
		expect(trade.amount).toBeGreaterThan(0);
		expect(trade.apr).toBeGreaterThan(0);
	});

	it("newest trades are first", async () => {
		vi.resetModules();
		vi.doMock("@/lib/socket", () => ({
			acquireSocket: vi.fn(() => mockSocket),
			releaseSocket: vi.fn(),
		}));
		const { useRecentTrades } = await import("@/hooks/use-recent-trades");
		const assetId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

		const { result } = renderHookWithProviders(() =>
			useRecentTrades({ assetId, decimals: 6 }),
		);

		const now = Date.now();
		act(() => {
			mockSocket._simulateEvent("recent-trade", {
				assetId,
				side: "LEND",
				amount: "1000000",
				rate: 400,
				timestamp: now,
			});
		});

		act(() => {
			mockSocket._simulateEvent("recent-trade", {
				assetId,
				side: "BORROW",
				amount: "2000000",
				rate: 500,
				timestamp: now + 1000,
			});
		});

		expect(result.current.trades).toHaveLength(2);
		// Newest (second event) should be first in the array
		expect(result.current.trades[0].type).toBe("Borrow");
	});
});
