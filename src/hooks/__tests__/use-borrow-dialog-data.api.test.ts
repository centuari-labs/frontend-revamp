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
    imageUrl: "/tokens/usdc-icon.svg",
    ltv: 0.9,
    liquidationThreshold: 0.92,
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    walletBalance: 0.5,
    amountInUsd: 45000,
    isCollateral: false,
    imageUrl: "/tokens/btc-icon.svg",
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

vi.mock("@/hooks/use-lend-borrow-assets", () => ({
  useLendBorrowAssets: vi.fn(() => ({
    lendBorrow: { suppliedAssets: 10000, borrowedAssets: 25000, healthFactor: 2.0 },
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
  useAuthToken: vi.fn(() => ({ getToken: vi.fn() })),
}));

vi.mock("@privy-io/react-auth", () => ({
  usePrivy: vi.fn(() => ({ getAccessToken: vi.fn() })),
}));

import { useBorrowDialogData } from "@/hooks/use-borrow-dialog-data";
import { useMyAssets } from "@/hooks/use-my-assets";
import { useLendBorrowAssets } from "@/hooks/use-lend-borrow-assets";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useBorrowDialogData (API mode)", () => {
  it("builds portfolio map from API assets", () => {
    const { result } = renderHook(() => useBorrowDialogData());
    expect(result.current.portfolio.usdc).toBe(5000);
    expect(result.current.portfolio.btc).toBe(45000);
  });

  it("returns borrowedAssets as totalDebt", () => {
    const { result } = renderHook(() => useBorrowDialogData());
    expect(result.current.totalDebt).toBe(25000);
  });

  it("builds collateralStatus from API data", () => {
    const { result } = renderHook(() => useBorrowDialogData());
    expect(result.current.collateralStatus.usdc).toBe(true);
    expect(result.current.collateralStatus.btc).toBe(false);
  });

  it("builds collateralTokenList with real LTV/LT from API", () => {
    const { result } = renderHook(() => useBorrowDialogData());
    expect(result.current.collateralTokenList).toHaveLength(2);

    const usdc = result.current.collateralTokenList.find(
      (t) => t.value === "usdc",
    );
    expect(usdc).toBeDefined();
    expect(usdc!.ltv).toBe(0.9);
    expect(usdc!.liquidationThreshold).toBe(0.92);
    expect(usdc!.price).toBe(1); // 5000/5000
    expect(usdc!.logo).toBe("/tokens/usdc-icon.svg");
    expect(usdc!.label).toBe("USDC");

    const btc = result.current.collateralTokenList.find(
      (t) => t.value === "btc",
    );
    expect(btc).toBeDefined();
    expect(btc!.ltv).toBe(0.75);
    expect(btc!.price).toBe(90000); // 45000/0.5
  });

  it("returns 0 totalDebt when lendBorrow is null", () => {
    vi.mocked(useLendBorrowAssets).mockReturnValue({
      lendBorrow: null,
      isLoading: false,
      isError: false,
    });
    const { result } = renderHook(() => useBorrowDialogData());
    expect(result.current.totalDebt).toBe(0);
  });

  it("combines loading states", () => {
    vi.mocked(useMyAssets).mockReturnValue({
      assets: [],
      isLoading: true,
      isError: false,
    });
    vi.mocked(useLendBorrowAssets).mockReturnValue({
      lendBorrow: null,
      isLoading: false,
      isError: false,
    });
    const { result } = renderHook(() => useBorrowDialogData());
    expect(result.current.isLoading).toBe(true);
  });

  it("combines error states", () => {
    vi.mocked(useMyAssets).mockReturnValue({
      assets: [],
      isLoading: false,
      isError: true,
    });
    const { result } = renderHook(() => useBorrowDialogData());
    expect(result.current.isError).toBe(true);
  });

  it("returns empty data when no assets", () => {
    vi.mocked(useMyAssets).mockReturnValue({
      assets: [],
      isLoading: false,
      isError: false,
    });
    const { result } = renderHook(() => useBorrowDialogData());
    expect(result.current.portfolio).toEqual({});
    expect(result.current.collateralStatus).toEqual({});
    expect(result.current.collateralTokenList).toEqual([]);
  });

  it("handles zero walletBalance for price derivation", () => {
    vi.mocked(useMyAssets).mockReturnValue({
      assets: [
        {
          symbol: "USDC",
          name: "USDC",
          walletBalance: 0,
          amountInUsd: 0,
          isCollateral: true,
          imageUrl: null,
          ltv: 0.9,
          liquidationThreshold: 0.92,
        },
      ],
      isLoading: false,
      isError: false,
    });
    const { result } = renderHook(() => useBorrowDialogData());
    const usdc = result.current.collateralTokenList[0];
    expect(usdc.price).toBe(0);
    expect(Number.isFinite(usdc.price)).toBe(true);
  });

  it("uses default logo when imageUrl is null", () => {
    vi.mocked(useMyAssets).mockReturnValue({
      assets: [
        {
          symbol: "NEW",
          name: "New Token",
          walletBalance: 100,
          amountInUsd: 100,
          isCollateral: false,
          imageUrl: null,
          ltv: 0.5,
          liquidationThreshold: 0.6,
        },
      ],
      isLoading: false,
      isError: false,
    });
    const { result } = renderHook(() => useBorrowDialogData());
    expect(result.current.collateralTokenList[0].logo).toBe(
      "/tokens/centuari-eth.png",
    );
  });
});
