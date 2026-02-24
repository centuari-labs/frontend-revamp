import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWithdrawLendPosition } from "@/hooks/use-withdraw-lend-position";

vi.mock("@/lib/positions-adapter.mock", () => ({
  withdrawLendPosition: vi.fn(async () => {}),
}));

import { withdrawLendPosition } from "@/lib/positions-adapter.mock";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useWithdrawLendPosition", () => {
  it("isPending and isSuccess start as false", () => {
    const { result } = renderHook(() => useWithdrawLendPosition());
    expect(result.current.isPending).toBe(false);
    expect(result.current.isSuccess).toBe(false);
  });

  it("withdraw calls adapter and sets isSuccess", async () => {
    const { result } = renderHook(() => useWithdrawLendPosition());

    await act(async () => {
      await result.current.withdraw({
        positionId: "w1",
        amount: 500,
        tokenValue: "usdc",
      });
    });

    expect(withdrawLendPosition).toHaveBeenCalledWith({
      positionId: "w1",
      amount: 500,
      tokenValue: "usdc",
    });
    expect(result.current.isPending).toBe(false);
    expect(result.current.isSuccess).toBe(true);
  });

  it("resetSuccess clears isSuccess", async () => {
    const { result } = renderHook(() => useWithdrawLendPosition());

    await act(async () => {
      await result.current.withdraw({
        positionId: "w2",
        amount: 100,
        tokenValue: "usdc",
      });
    });
    expect(result.current.isSuccess).toBe(true);

    act(() => {
      result.current.resetSuccess();
    });
    expect(result.current.isSuccess).toBe(false);
  });
});
