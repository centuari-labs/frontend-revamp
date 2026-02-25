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

  it("subscribes to orderbook with valid assetId", async () => {
    vi.resetModules();
    vi.doMock("@/lib/use-mock", () => ({ USE_MOCK: false }));
    vi.doMock("@/lib/socket", () => ({
      acquireSocket: vi.fn(() => mockSocket),
      releaseSocket: vi.fn(),
    }));
    const { useOrderbook } = await import("@/hooks/use-orderbook");
    const assetId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

    renderHook(() => useOrderbook({ assetId }));

    expect(mockSocket.emit).toHaveBeenCalledWith("subscribe-orderbook", {
      assetId,
    });
  });

  it("updates orders on orderbook-update event", async () => {
    vi.resetModules();
    vi.doMock("@/lib/use-mock", () => ({ USE_MOCK: false }));
    vi.doMock("@/lib/socket", () => ({
      acquireSocket: vi.fn(() => mockSocket),
      releaseSocket: vi.fn(),
    }));
    const { useOrderbook } = await import("@/hooks/use-orderbook");
    const assetId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

    const { result } = renderHook(() =>
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
    const { useOrderbook } = await import("@/hooks/use-orderbook");
    const assetId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

    const { result } = renderHook(() => useOrderbook({ assetId }));

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
});
