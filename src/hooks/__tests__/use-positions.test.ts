import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePositions } from "@/hooks/use-positions";
import { makeLendPosition, makeBorrowPosition } from "@/__tests__/helpers/fixtures/positions";

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("usePositions", () => {
  it("returns empty arrays when no data stored", () => {
    const { result } = renderHook(() => usePositions());
    expect(result.current.openOrders).toEqual([]);
    expect(result.current.allTransactions).toEqual([]);
    expect(result.current.positions).toEqual([]);
  });

  it("reads open orders from localStorage", () => {
    const order = makeLendPosition({ id: "open-1" });
    localStorage.setItem("centuari_open_orders", JSON.stringify([order]));

    const { result } = renderHook(() => usePositions());
    expect(result.current.openOrders).toHaveLength(1);
    expect(result.current.openOrders[0].id).toBe("open-1");
  });

  it("reads filled positions from localStorage", () => {
    const pos = makeBorrowPosition({ id: "filled-1" });
    localStorage.setItem("centuari_positions", JSON.stringify([pos]));

    const { result } = renderHook(() => usePositions());
    expect(result.current.allTransactions).toHaveLength(1);
  });

  it("combines open orders and transactions in positions", () => {
    localStorage.setItem("centuari_open_orders", JSON.stringify([makeLendPosition()]));
    localStorage.setItem("centuari_positions", JSON.stringify([makeBorrowPosition()]));

    const { result } = renderHook(() => usePositions());
    expect(result.current.positions).toHaveLength(2);
  });

  it("refreshes on 500ms polling interval", () => {
    const { result } = renderHook(() => usePositions());
    expect(result.current.openOrders).toHaveLength(0);

    // Add data mid-lifecycle
    localStorage.setItem(
      "centuari_open_orders",
      JSON.stringify([makeLendPosition()]),
    );
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.openOrders).toHaveLength(1);
  });

  it("responds to storage event", () => {
    const { result } = renderHook(() => usePositions());

    localStorage.setItem(
      "centuari_positions",
      JSON.stringify([makeLendPosition()]),
    );
    act(() => {
      window.dispatchEvent(new Event("storage"));
    });

    expect(result.current.allTransactions).toHaveLength(1);
  });

  it("responds to centuari-positions-updated event", () => {
    const { result } = renderHook(() => usePositions());

    localStorage.setItem(
      "centuari_open_orders",
      JSON.stringify([makeLendPosition(), makeBorrowPosition()]),
    );
    act(() => {
      window.dispatchEvent(new CustomEvent("centuari-positions-updated"));
    });

    expect(result.current.openOrders).toHaveLength(2);
  });

  it("refresh function can be called manually", () => {
    const { result } = renderHook(() => usePositions());
    localStorage.setItem(
      "centuari_positions",
      JSON.stringify([makeLendPosition()]),
    );

    act(() => {
      result.current.refresh();
    });
    expect(result.current.allTransactions).toHaveLength(1);
  });
});
