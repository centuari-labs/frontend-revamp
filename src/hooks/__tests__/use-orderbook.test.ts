import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createMockSocket, type MockSocket } from "@/__tests__/helpers/mock-socket";

let mockSocket: MockSocket;

vi.mock("@/lib/socket", () => ({
  acquireSocket: vi.fn(() => mockSocket),
  releaseSocket: vi.fn(),
}));

// Default: USE_MOCK = true
vi.mock("@/lib/use-mock", () => ({ USE_MOCK: true }));

// Mock viem's isAddress
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

describe("useOrderbook (mock mode)", () => {
  it("starts with default mock data", async () => {
    const { useOrderbook } = await import("@/hooks/use-orderbook");
    const { result } = renderHook(() => useOrderbook());

    expect(result.current.borrowOrders.length).toBeGreaterThan(0);
    expect(result.current.lendOrders.length).toBeGreaterThan(0);
  });

  it("randomizes orders on interval", async () => {
    const { useOrderbook } = await import("@/hooks/use-orderbook");
    const { result } = renderHook(() => useOrderbook());

    const initialBorrow = [...result.current.borrowOrders];
    act(() => {
      vi.advanceTimersByTime(1200);
    });

    // At least one order should have changed apr or amount
    const changed = result.current.borrowOrders.some(
      (o, i) =>
        o.apr !== initialBorrow[i]?.apr || o.amount !== initialBorrow[i]?.amount,
    );
    expect(changed).toBe(true);
  });

  it("all orders have correct side field", async () => {
    const { useOrderbook } = await import("@/hooks/use-orderbook");
    const { result } = renderHook(() => useOrderbook());

    for (const o of result.current.borrowOrders) {
      expect(o.side).toBe("borrow");
    }
    for (const o of result.current.lendOrders) {
      expect(o.side).toBe("lend");
    }
  });
});

describe("useOrderbook (WS mode)", () => {
  beforeEach(() => {
    vi.doMock("@/lib/use-mock", () => ({ USE_MOCK: false }));
  });

  afterEach(() => {
    vi.doMock("@/lib/use-mock", () => ({ USE_MOCK: true }));
  });

  it("subscribes to orderbook with valid loanToken", async () => {
    vi.resetModules();
    vi.doMock("@/lib/use-mock", () => ({ USE_MOCK: false }));
    vi.doMock("@/lib/socket", () => ({
      acquireSocket: vi.fn(() => mockSocket),
      releaseSocket: vi.fn(),
    }));
    vi.doMock("viem", () => ({
      isAddress: vi.fn(() => true),
    }));
    const { useOrderbook } = await import("@/hooks/use-orderbook");
    const token = "0x" + "a".repeat(40);

    renderHook(() => useOrderbook({ loanToken: token }));

    expect(mockSocket.emit).toHaveBeenCalledWith("subscribe-orderbook", {
      loanToken: token,
    });
  });

  it("updates orders on orderbook-update event", async () => {
    vi.resetModules();
    vi.doMock("@/lib/use-mock", () => ({ USE_MOCK: false }));
    vi.doMock("@/lib/socket", () => ({
      acquireSocket: vi.fn(() => mockSocket),
      releaseSocket: vi.fn(),
    }));
    vi.doMock("viem", () => ({
      isAddress: vi.fn(() => true),
    }));
    const { useOrderbook } = await import("@/hooks/use-orderbook");
    const token = "0x" + "a".repeat(40);

    const { result } = renderHook(() =>
      useOrderbook({ loanToken: token, decimals: 6 }),
    );

    act(() => {
      mockSocket._simulateEvent("orderbook-update", {
        loanToken: token,
        lend: [{ rate: 450, amount: "1000000", orders: 1 }],
        borrow: [{ rate: 500, amount: "2000000", orders: 2 }],
        timestamp: Date.now(),
      });
    });

    expect(result.current.lendOrders).toHaveLength(1);
    expect(result.current.lendOrders[0].apr).toBeCloseTo(4.5, 1);
    expect(result.current.lendOrders[0].amount).toBe(1);
    expect(result.current.borrowOrders).toHaveLength(1);
    expect(result.current.borrowOrders[0].apr).toBe(5.0);
  });

  it("ignores updates from different market", async () => {
    vi.resetModules();
    vi.doMock("@/lib/use-mock", () => ({ USE_MOCK: false }));
    vi.doMock("@/lib/socket", () => ({
      acquireSocket: vi.fn(() => mockSocket),
      releaseSocket: vi.fn(),
    }));
    vi.doMock("viem", () => ({
      isAddress: vi.fn(() => true),
    }));
    const { useOrderbook } = await import("@/hooks/use-orderbook");
    const token = "0x" + "a".repeat(40);

    const { result } = renderHook(() => useOrderbook({ loanToken: token }));

    act(() => {
      mockSocket._simulateEvent("orderbook-update", {
        loanToken: "0x" + "b".repeat(40),
        lend: [{ rate: 450, amount: "1000000", orders: 1 }],
        borrow: [],
        timestamp: Date.now(),
      });
    });

    // Should still be empty (cleared on mount for WS mode)
    expect(result.current.lendOrders).toHaveLength(0);
  });
});
