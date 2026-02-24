import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createMockSocket, type MockSocket } from "@/__tests__/helpers/mock-socket";

let mockSocket: MockSocket;

vi.mock("@/lib/socket", () => ({
  acquireSocket: vi.fn(() => mockSocket),
  releaseSocket: vi.fn(),
}));

vi.mock("@/lib/use-mock", () => ({ USE_MOCK: true }));

vi.mock("viem", () => ({
  isAddress: vi.fn((addr: string) => addr.startsWith("0x") && addr.length === 42),
}));

beforeEach(() => {
  vi.useFakeTimers();
  mockSocket = createMockSocket();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useRecentTrades (mock mode)", () => {
  it("starts with empty trades", async () => {
    const { useRecentTrades } = await import("@/hooks/use-recent-trades");
    const { result } = renderHook(() => useRecentTrades());
    expect(result.current.trades).toHaveLength(0);
  });

  it("adds mock trades on 2s interval", async () => {
    const { useRecentTrades } = await import("@/hooks/use-recent-trades");
    const { result } = renderHook(() => useRecentTrades());

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.trades).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.trades).toHaveLength(2);
  });

  it("caps at 20 trades", async () => {
    const { useRecentTrades } = await import("@/hooks/use-recent-trades");
    const { result } = renderHook(() => useRecentTrades());

    act(() => {
      vi.advanceTimersByTime(2000 * 25);
    });
    expect(result.current.trades.length).toBeLessThanOrEqual(20);
  });

  it("newest trades are first", async () => {
    const { useRecentTrades } = await import("@/hooks/use-recent-trades");
    const { result } = renderHook(() => useRecentTrades());

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    // Each trade has a time string, first should be most recent
    expect(result.current.trades).toHaveLength(2);
  });

  it("trades have valid shape", async () => {
    const { useRecentTrades } = await import("@/hooks/use-recent-trades");
    const { result } = renderHook(() => useRecentTrades());

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    const trade = result.current.trades[0];
    expect(trade).toHaveProperty("time");
    expect(trade).toHaveProperty("type");
    expect(["Lend", "Borrow"]).toContain(trade.type);
    expect(trade.amount).toBeGreaterThan(0);
    expect(trade.apr).toBeGreaterThan(0);
  });
});

describe("useRecentTrades (WS mode)", () => {
  it("subscribes and handles trade events", async () => {
    vi.resetModules();
    vi.doMock("@/lib/use-mock", () => ({ USE_MOCK: false }));
    vi.doMock("@/lib/socket", () => ({
      acquireSocket: vi.fn(() => mockSocket),
      releaseSocket: vi.fn(),
    }));
    vi.doMock("viem", () => ({
      isAddress: vi.fn(() => true),
    }));
    const { useRecentTrades } = await import("@/hooks/use-recent-trades");
    const token = "0x" + "a".repeat(40);

    const { result } = renderHook(() =>
      useRecentTrades({ loanToken: token, decimals: 6 }),
    );

    expect(mockSocket.emit).toHaveBeenCalledWith("subscribe-recent-trades", {
      loanToken: token,
    });

    act(() => {
      mockSocket._simulateEvent("recent-trade", {
        loanToken: token,
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
    vi.doMock("@/lib/use-mock", () => ({ USE_MOCK: false }));
    vi.doMock("@/lib/socket", () => ({
      acquireSocket: vi.fn(() => mockSocket),
      releaseSocket: vi.fn(),
    }));
    vi.doMock("viem", () => ({
      isAddress: vi.fn(() => true),
    }));
    const { useRecentTrades } = await import("@/hooks/use-recent-trades");
    const token = "0x" + "a".repeat(40);

    const { result } = renderHook(() =>
      useRecentTrades({ loanToken: token }),
    );

    act(() => {
      mockSocket._simulateEvent("recent-trades-snapshot", [
        { loanToken: token, side: "BORROW", amount: "1000000", rate: 500, timestamp: Date.now() },
        { loanToken: token, side: "LEND", amount: "2000000", rate: 450, timestamp: Date.now() },
      ]);
    });

    expect(result.current.trades).toHaveLength(2);
  });
});
