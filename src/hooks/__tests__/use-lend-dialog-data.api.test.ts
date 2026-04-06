import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

// API mode
vi.mock("@/lib/use-mock", () => ({ USE_MOCK: false }));

const mockAssets = [
  {
    symbol: "USDC",
    name: "USDC",
    walletBalance: 5000,
    amountInUsd: 5000,
    isCollateral: true,
    imageUrl: "/tokens/usdc-icon.webp",
    ltv: 0.9,
    liquidationThreshold: 0.92,
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    walletBalance: 0.5,
    amountInUsd: 45000,
    isCollateral: false,
    imageUrl: "/tokens/btc-icon.webp",
    ltv: 0.75,
    liquidationThreshold: 0.8,
  },
];

vi.mock("@/hooks/use-my-assets", () => ({
  useMyAssets: vi.fn(() => ({
    assets: mockAssets,
    isLoading: false,
    isError: false,
  })),
}));

vi.mock("@/hooks/use-portfolio-from-storage", () => ({
  usePortfolioFromStorage: vi.fn(() => ({
    portfolio: {},
    totalDebt: 0,
    collateralStatus: {},
  })),
}));

vi.mock("@/hooks/use-auth-token", () => ({
  useAuthToken: vi.fn(() => ({ getToken: vi.fn(), authFetch: vi.fn((fn: (t: string) => Promise<unknown>) => fn("mock-token")) })),
}));

vi.mock("@privy-io/react-auth", () => ({
  usePrivy: vi.fn(() => ({ getAccessToken: vi.fn() })),
}));

import { useLendDialogData } from "@/hooks/use-lend-dialog-data";
import { useMyAssets } from "@/hooks/use-my-assets";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useLendDialogData (API mode)", () => {
  it("returns walletBalance from API for matching token", () => {
    const { result } = renderHook(() => useLendDialogData("USDC"));
    expect(result.current.availableBalance).toBe(5000);
    expect(result.current.tokenPrice).toBe(1); // 5000 / 5000
  });

  it("derives price correctly for BTC", () => {
    const { result } = renderHook(() => useLendDialogData("BTC"));
    expect(result.current.availableBalance).toBe(0.5);
    expect(result.current.tokenPrice).toBe(90000); // 45000 / 0.5
  });

  it("returns 0 for token not in assets", () => {
    const { result } = renderHook(() => useLendDialogData("UNKNOWN"));
    expect(result.current.availableBalance).toBe(0);
    expect(result.current.tokenPrice).toBe(0);
  });

  it("returns isLoading from useMyAssets", () => {
    vi.mocked(useMyAssets).mockReturnValue({
      assets: [],
      isLoading: true,
      isError: false,
    });
    const { result } = renderHook(() => useLendDialogData("USDC"));
    expect(result.current.isLoading).toBe(true);
    expect(result.current.availableBalance).toBe(0);
  });

  it("returns isError from useMyAssets", () => {
    vi.mocked(useMyAssets).mockReturnValue({
      assets: [],
      isLoading: false,
      isError: true,
    });
    const { result } = renderHook(() => useLendDialogData("USDC"));
    expect(result.current.isError).toBe(true);
  });

  it("handles zero walletBalance without division error", () => {
    vi.mocked(useMyAssets).mockReturnValue({
      assets: [
        {
          symbol: "USDC",
          name: "USDC",
          walletBalance: 0,
          amountInUsd: 0,
          isCollateral: false,
          imageUrl: null,
          ltv: 0.9,
          liquidationThreshold: 0.92,
        },
      ],
      isLoading: false,
      isError: false,
    });
    const { result } = renderHook(() => useLendDialogData("USDC"));
    expect(result.current.availableBalance).toBe(0);
    expect(result.current.tokenPrice).toBe(0);
    expect(Number.isFinite(result.current.tokenPrice)).toBe(true);
  });

  it("matches token case-insensitively", () => {
    // Re-set the mock since previous test may have overridden it
    vi.mocked(useMyAssets).mockReturnValue({
      assets: mockAssets,
      isLoading: false,
      isError: false,
    });
    const { result } = renderHook(() => useLendDialogData("usdc"));
    expect(result.current.availableBalance).toBe(5000);
  });
});
