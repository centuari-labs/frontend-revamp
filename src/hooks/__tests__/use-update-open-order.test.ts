import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUpdateOpenOrder } from "@/hooks/use-update-open-order";
import { makeLendPosition } from "@/__tests__/helpers/fixtures/positions";

vi.mock("@/lib/positions-adapter.mock", () => ({
  updateOpenOrder: vi.fn(async () => {}),
  updateFilledPosition: vi.fn(async () => {}),
  getOpenOrders: vi.fn(() => []),
}));

import * as adapter from "@/lib/positions-adapter.mock";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useUpdateOpenOrder", () => {
  it("isPending starts as false", () => {
    const { result } = renderHook(() => useUpdateOpenOrder());
    expect(result.current.isPending).toBe(false);
  });

  it("updates open order when found there", async () => {
    const pos = makeLendPosition({ id: "open-upd" });
    vi.mocked(adapter.getOpenOrders).mockReturnValue([pos]);

    const { result } = renderHook(() => useUpdateOpenOrder());
    const updated = { ...pos, amount: 999 };

    await act(async () => {
      await result.current.update(updated);
    });

    expect(adapter.updateOpenOrder).toHaveBeenCalledWith(updated);
    expect(adapter.updateFilledPosition).not.toHaveBeenCalled();
  });

  it("updates filled position when not in open orders", async () => {
    vi.mocked(adapter.getOpenOrders).mockReturnValue([]);
    const pos = makeLendPosition({ id: "filled-upd" });

    const { result } = renderHook(() => useUpdateOpenOrder());

    await act(async () => {
      await result.current.update(pos);
    });

    expect(adapter.updateFilledPosition).toHaveBeenCalledWith(pos);
    expect(adapter.updateOpenOrder).not.toHaveBeenCalled();
  });

  it("isPending returns to false after update", async () => {
    vi.mocked(adapter.getOpenOrders).mockReturnValue([]);
    const { result } = renderHook(() => useUpdateOpenOrder());

    await act(async () => {
      await result.current.update(makeLendPosition());
    });

    expect(result.current.isPending).toBe(false);
  });
});
