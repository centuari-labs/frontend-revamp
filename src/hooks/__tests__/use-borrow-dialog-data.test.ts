import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

// Mock mode
vi.mock("@/lib/use-mock", () => ({ USE_MOCK: true }));

vi.mock("@/hooks/use-my-assets", () => ({
  useMyAssets: vi.fn(() => ({ assets: [], isLoading: false, isError: false })),
}));

vi.mock("@/hooks/use-lend-borrow-assets", () => ({
  useLendBorrowAssets: vi.fn(() => ({
    lendBorrow: null,
    isLoading: false,
    isError: false,
  })),
}));

vi.mock("@/hooks/use-auth-token", () => ({
  useAuthToken: vi.fn(() => ({ getToken: vi.fn() })),
}));

vi.mock("@privy-io/react-auth", () => ({
  usePrivy: vi.fn(() => ({ getAccessToken: vi.fn() })),
}));

import { useBorrowDialogData } from "@/hooks/use-borrow-dialog-data";

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("useBorrowDialogData (mock mode)", () => {
  it("returns defaultPortfolio when localStorage is empty", () => {
    const { result } = renderHook(() => useBorrowDialogData());
    expect(result.current.portfolio.btc).toBe(100000);
    expect(result.current.portfolio.usdc).toBe(15000);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it("returns totalDebt from localStorage", () => {
    localStorage.setItem("centuari_total_debt", "50000");
    const { result } = renderHook(() => useBorrowDialogData());
    expect(result.current.totalDebt).toBe(50000);
  });

  it("returns default $80k totalDebt when localStorage is empty", () => {
    const { result } = renderHook(() => useBorrowDialogData());
    expect(result.current.totalDebt).toBe(80000);
  });

  it("returns collateralStatus from localStorage", () => {
    localStorage.setItem(
      "centuari_collateral",
      JSON.stringify({ usdc: true, btc: false }),
    );
    const { result } = renderHook(() => useBorrowDialogData());
    expect(result.current.collateralStatus.usdc).toBe(true);
    expect(result.current.collateralStatus.btc).toBe(false);
  });

  it("returns hardcoded tokenList as collateralTokenList", () => {
    const { result } = renderHook(() => useBorrowDialogData());
    expect(result.current.collateralTokenList.length).toBeGreaterThan(0);
    const usdc = result.current.collateralTokenList.find(
      (t) => t.value === "usdc",
    );
    expect(usdc).toBeDefined();
    expect(usdc!.ltv).toBe(0.9);
  });

  it("returns localStorage portfolio when set", () => {
    localStorage.setItem(
      "centuari_portfolio",
      JSON.stringify({ usdc: 9999 }),
    );
    const { result } = renderHook(() => useBorrowDialogData());
    expect(result.current.portfolio.usdc).toBe(9999);
  });
});
