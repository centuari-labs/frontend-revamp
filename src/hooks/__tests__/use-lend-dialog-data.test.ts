import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

// Mock mode = true
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

import { useLendDialogData } from "@/hooks/use-lend-dialog-data";

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("useLendDialogData (mock mode)", () => {
  it("returns default balance from defaultPortfolio for known token", () => {
    const { result } = renderHook(() => useLendDialogData("USDC"));
    // defaultPortfolio.usdc = 15000, price = 1 -> balance = 15000
    expect(result.current.availableBalance).toBe(15000);
    expect(result.current.tokenPrice).toBe(1);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it("returns localStorage portfolio balance when set", () => {
    localStorage.setItem(
      "centuari_portfolio",
      JSON.stringify({ usdc: 5000 }),
    );
    const { result } = renderHook(() => useLendDialogData("USDC"));
    // 5000 USD / price 1 = 5000 tokens
    expect(result.current.availableBalance).toBe(5000);
  });

  it("returns 0 balance for unknown token", () => {
    const { result } = renderHook(() => useLendDialogData("UNKNOWN"));
    expect(result.current.availableBalance).toBe(0);
    expect(result.current.tokenPrice).toBe(0);
  });

  it("reads totalSupply from localStorage", () => {
    localStorage.setItem("centuari_total_supply", "12345");
    const { result } = renderHook(() => useLendDialogData("USDC"));
    expect(result.current.totalSupply).toBe(12345);
  });

  it("returns 0 totalSupply when localStorage is empty", () => {
    const { result } = renderHook(() => useLendDialogData("USDC"));
    expect(result.current.totalSupply).toBe(0);
  });

  it("derives balance correctly for high-price token", () => {
    // BTC: defaultPortfolio.btc = 100000, price = 45000
    const { result } = renderHook(() => useLendDialogData("BTC"));
    const expected = 100000 / 45000;
    expect(result.current.availableBalance).toBeCloseTo(expected, 4);
    expect(result.current.tokenPrice).toBe(45000);
  });
});
