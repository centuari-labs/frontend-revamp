import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSubmitLend } from "@/hooks/use-submit-lend";
import { makeLendPosition } from "@/__tests__/helpers/fixtures/positions";

vi.mock("@/lib/use-mock", () => ({ USE_MOCK: true }));

vi.mock("@/lib/positions-adapter.api", () => ({
  submitLendLimitOrder: vi.fn(),
}));

vi.mock("@/lib/positions-adapter.mock", () => ({
  submitOpenOrder: vi.fn(async (pos) => pos),
  submitFilledLendPosition: vi.fn(async (pos) => pos),
  updateOpenOrder: vi.fn(async () => {}),
  updateFilledPosition: vi.fn(async () => {}),
  buildLendLimitPosition: vi.fn((params) => ({
    ...makeLendPosition(),
    id: params.editingPosition?.id ?? `lend-${params.tokenValue}-${Date.now()}`,
    type: "lend",
    orderType: "limit",
    apr: params.targetApr,
  })),
  buildLendMarketPosition: vi.fn((params) => ({
    ...makeLendPosition(),
    id: params.editingPosition?.id ?? `lend-${params.tokenValue}-${Date.now()}`,
    type: "lend",
    orderType: "market",
    status: "success",
  })),
  getBestLendAPR: vi.fn(() => 6.5),
}));

import * as adapter from "@/lib/positions-adapter.mock";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useSubmitLend", () => {
  it("isPending starts as false", () => {
    const { result } = renderHook(() => useSubmitLend());
    expect(result.current.isPending).toBe(false);
  });

  it("submitLimit calls submitOpenOrder for new order", async () => {
    const { result } = renderHook(() => useSubmitLend());

    await act(async () => {
      await result.current.submitLimit({
        tokenValue: "usdc",
        tokenLogo: "/tokens/usdc-icon.webp",
        tokenLabel: "USDC",
        amount: 100,
        amountInUsd: 100,
        targetApr: 0.065,
        maturity: 1000,
        autoRollover: true,
      });
    });

    expect(adapter.submitOpenOrder).toHaveBeenCalled();
    expect(result.current.isPending).toBe(false);
  });

  it("submitLimit calls updateOpenOrder when editing", async () => {
    const existing = makeLendPosition({ id: "edit-1", orderType: "limit" });
    const { result } = renderHook(() => useSubmitLend());

    await act(async () => {
      await result.current.submitLimit({
        tokenValue: "usdc",
        tokenLogo: "/tokens/usdc-icon.webp",
        tokenLabel: "USDC",
        amount: 200,
        amountInUsd: 200,
        targetApr: 0.07,
        maturity: 1000,
        autoRollover: true,
        editingPosition: existing,
      });
    });

    expect(adapter.updateOpenOrder).toHaveBeenCalled();
  });

  it("submitMarket calls submitFilledLendPosition for new order", async () => {
    const { result } = renderHook(() => useSubmitLend());

    await act(async () => {
      await result.current.submitMarket({
        tokenValue: "usdc",
        tokenLogo: "/tokens/usdc-icon.webp",
        tokenLabel: "USDC",
        amount: 500,
        amountInUsd: 500,
        maturity: 2000,
      });
    });

    expect(adapter.submitFilledLendPosition).toHaveBeenCalled();
  });

  it("submitMarket calls updateFilledPosition when editing", async () => {
    const existing = makeLendPosition({ id: "edit-2", orderType: "market" });
    const { result } = renderHook(() => useSubmitLend());

    await act(async () => {
      await result.current.submitMarket({
        tokenValue: "usdc",
        tokenLogo: "/tokens/usdc-icon.webp",
        tokenLabel: "USDC",
        amount: 500,
        amountInUsd: 500,
        maturity: 2000,
        editingPosition: existing,
      });
    });

    expect(adapter.updateFilledPosition).toHaveBeenCalled();
  });
});
