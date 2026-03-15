import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSubmitBorrow } from "@/hooks/use-submit-borrow";
import { makeBorrowPosition } from "@/__tests__/helpers/fixtures/positions";

vi.mock("@/lib/positions-adapter.mock", () => ({
  submitOpenOrder: vi.fn(async (pos) => pos),
  submitFilledBorrowPosition: vi.fn(async (pos) => pos),
  updateOpenOrder: vi.fn(async () => {}),
  updateFilledPosition: vi.fn(async () => {}),
  buildBorrowLimitPosition: vi.fn((params) => ({
    ...makeBorrowPosition(),
    id: params.editingPosition?.id ?? `borrow-${params.tokenValue}-${Date.now()}`,
    type: "borrow",
    orderType: "limit",
    apr: params.targetApr,
    collateralTokens: params.collateralTokens,
  })),
  buildBorrowMarketPosition: vi.fn((params) => ({
    ...makeBorrowPosition(),
    id: params.editingPosition?.id ?? `borrow-${params.tokenValue}-${Date.now()}`,
    type: "borrow",
    orderType: "market",
    status: "success",
    collateralTokens: params.collateralTokens,
  })),
  getBestBorrowAPR: vi.fn(() => 10.1),
}));

import * as adapter from "@/lib/positions-adapter.mock";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useSubmitBorrow", () => {
  it("isPending starts as false", () => {
    const { result } = renderHook(() => useSubmitBorrow());
    expect(result.current.isPending).toBe(false);
  });

  it("submitLimit calls submitOpenOrder for new order", async () => {
    const { result } = renderHook(() => useSubmitBorrow());

    await act(async () => {
      await result.current.submitLimit({
        tokenValue: "usdt",
        tokenLogo: "/tokens/centuari-usdt.png",
        tokenLabel: "USDT",
        amount: 500,
        maturity: 1000,
        targetApr: 0.1,
        collateralTokens: ["btc"],
      });
    });

    expect(adapter.submitOpenOrder).toHaveBeenCalled();
    expect(result.current.isPending).toBe(false);
  });

  it("submitLimit calls updateOpenOrder when editing", async () => {
    const existing = makeBorrowPosition({ id: "edit-b1" });
    const { result } = renderHook(() => useSubmitBorrow());

    await act(async () => {
      await result.current.submitLimit({
        tokenValue: "usdt",
        tokenLogo: "/tokens/centuari-usdt.png",
        tokenLabel: "USDT",
        amount: 600,
        maturity: 1000,
        targetApr: 0.11,
        collateralTokens: ["btc"],
        editingPosition: existing,
      });
    });

    expect(adapter.updateOpenOrder).toHaveBeenCalled();
  });

  it("submitMarket calls submitFilledBorrowPosition for new order", async () => {
    const { result } = renderHook(() => useSubmitBorrow());

    await act(async () => {
      await result.current.submitMarket({
        tokenValue: "usdc",
        tokenLogo: "/tokens/usdc-icon.webp",
        tokenLabel: "USDC",
        amount: 300,
        maturity: 2000,
        collateralTokens: ["eth"],
      });
    });

    expect(adapter.submitFilledBorrowPosition).toHaveBeenCalled();
  });

  it("submitMarket calls updateFilledPosition when editing", async () => {
    const existing = makeBorrowPosition({ id: "edit-b2" });
    const { result } = renderHook(() => useSubmitBorrow());

    await act(async () => {
      await result.current.submitMarket({
        tokenValue: "usdc",
        tokenLogo: "/tokens/usdc-icon.webp",
        tokenLabel: "USDC",
        amount: 300,
        maturity: 2000,
        collateralTokens: ["eth"],
        editingPosition: existing,
      });
    });

    expect(adapter.updateFilledPosition).toHaveBeenCalled();
  });
});
