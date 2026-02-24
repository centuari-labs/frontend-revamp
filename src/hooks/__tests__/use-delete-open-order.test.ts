import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDeleteOpenOrder } from "@/hooks/use-delete-open-order";
import { makeLendPosition } from "@/__tests__/helpers/fixtures/positions";

vi.mock("@/lib/positions-adapter.mock", () => ({
  deleteOpenOrder: vi.fn(async () => {}),
  deleteFilledPosition: vi.fn(async () => {}),
  getOpenOrders: vi.fn(() => []),
}));

import * as adapter from "@/lib/positions-adapter.mock";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useDeleteOpenOrder", () => {
  it("isPending starts as false", () => {
    const { result } = renderHook(() => useDeleteOpenOrder());
    expect(result.current.isPending).toBe(false);
  });

  it("deletes from open orders when found there", async () => {
    const pos = makeLendPosition({ id: "open-del" });
    vi.mocked(adapter.getOpenOrders).mockReturnValue([pos]);

    const { result } = renderHook(() => useDeleteOpenOrder());

    await act(async () => {
      await result.current.deleteOrder("open-del");
    });

    expect(adapter.deleteOpenOrder).toHaveBeenCalledWith("open-del");
    expect(adapter.deleteFilledPosition).not.toHaveBeenCalled();
  });

  it("deletes from filled positions when not in open orders", async () => {
    vi.mocked(adapter.getOpenOrders).mockReturnValue([]);

    const { result } = renderHook(() => useDeleteOpenOrder());

    await act(async () => {
      await result.current.deleteOrder("filled-del");
    });

    expect(adapter.deleteFilledPosition).toHaveBeenCalledWith("filled-del");
    expect(adapter.deleteOpenOrder).not.toHaveBeenCalled();
  });

  it("exposes both delete and deleteOrder aliases", () => {
    const { result } = renderHook(() => useDeleteOpenOrder());
    expect(result.current.delete).toBe(result.current.deleteOrder);
  });
});
