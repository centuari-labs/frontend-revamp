import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

vi.mock("@/lib/use-mock", () => ({ USE_MOCK: true }));

vi.mock("@/hooks/use-my-assets", () => ({
  useMyAssets: vi.fn(() => ({ assets: [], isLoading: false, isError: false })),
}));

vi.mock("@/hooks/use-auth-token", () => ({
  useAuthToken: vi.fn(() => ({ getToken: vi.fn(), authFetch: vi.fn((fn: (t: string) => Promise<unknown>) => fn("mock-token")) })),
}));

vi.mock("@privy-io/react-auth", () => ({
  usePrivy: vi.fn(() => ({ getAccessToken: vi.fn() })),
}));

vi.mock("@/contexts/user-details-context", () => ({
  useUserDetailsContext: vi.fn(() => ({
    userDetails: null,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  })),
}));

import { useBorrowDialogData } from "@/hooks/use-borrow-dialog-data";
import { useMyAssets } from "@/hooks/use-my-assets";
import { useUserDetailsContext } from "@/contexts/user-details-context";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useBorrowDialogData (mock mode / no user details)", () => {
  it("returns empty data when no assets and no user details", () => {
    const { result } = renderHook(() => useBorrowDialogData());
    expect(result.current.portfolio).toEqual({});
    expect(result.current.totalDebt).toBe(0);
    expect(result.current.collateralStatus).toEqual({});
    expect(result.current.collateralTokenList).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it("returns 0 totalDebt when userDetails is null", () => {
    vi.mocked(useMyAssets).mockReturnValue({
      assets: [
        {
          symbol: "USDC",
          name: "USDC",
          walletBalance: 1000,
          amountInUsd: 1000,
          isCollateral: true,
          imageUrl: "/tokens/usdc-icon.webp",
          ltv: 0.9,
          liquidationThreshold: 0.92,
        },
      ],
      isLoading: false,
      isError: false,
    });
    const { result } = renderHook(() => useBorrowDialogData());
    expect(result.current.totalDebt).toBe(0);
    expect(result.current.portfolio.usdc).toBe(1000);
  });

  it("returns totalDebtUsd from userDetails when available", () => {
    vi.mocked(useUserDetailsContext).mockReturnValue({
      userDetails: {
        totalDebtUsd: 5000,
        settledDebtUsd: 3000,
        pendingDebtUsd: 2000,
        assets: [],
        debts: [],
        healthFactor: 1.5,
        collateralUsd: 10000,
        weightedLtv: 0.75,
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    const { result } = renderHook(() => useBorrowDialogData());
    expect(result.current.totalDebt).toBe(5000);
  });

  it("returns loading state from assets", () => {
    vi.mocked(useMyAssets).mockReturnValue({
      assets: [],
      isLoading: true,
      isError: false,
    });
    const { result } = renderHook(() => useBorrowDialogData());
    expect(result.current.isLoading).toBe(true);
  });

  it("returns error state from assets", () => {
    vi.mocked(useMyAssets).mockReturnValue({
      assets: [],
      isLoading: false,
      isError: true,
    });
    const { result } = renderHook(() => useBorrowDialogData());
    expect(result.current.isError).toBe(true);
  });
});
