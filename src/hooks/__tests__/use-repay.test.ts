import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRepay } from "@/hooks/use-repay";

vi.mock("@/lib/positions-adapter.mock", () => ({
  repayBorrowPosition: vi.fn(async () => {}),
}));

import { repayBorrowPosition } from "@/lib/positions-adapter.mock";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useRepay", () => {
  it("isPending starts as false", () => {
    const { result } = renderHook(() => useRepay());
    expect(result.current.isPending).toBe(false);
  });

  it("repay calls repayBorrowPosition", async () => {
    const { result } = renderHook(() => useRepay());

    await act(async () => {
      await result.current.repay({
        positionId: "p1",
        amount: 100,
        futureAmount: 105,
        tokenValue: "usdc",
      });
    });

    expect(repayBorrowPosition).toHaveBeenCalledWith({
      positionId: "p1",
      amount: 100,
      futureAmount: 105,
      tokenValue: "usdc",
    });
    expect(result.current.isPending).toBe(false);
  });
});
