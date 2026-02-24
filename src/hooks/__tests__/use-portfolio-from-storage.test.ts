import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePortfolioFromStorage } from "@/hooks/use-portfolio-from-storage";
import { defaultPortfolio } from "@/lib/portfolio-data";

beforeEach(() => {
  localStorage.clear();
});

describe("usePortfolioFromStorage", () => {
  it("returns defaultPortfolio when nothing stored", () => {
    const { result } = renderHook(() => usePortfolioFromStorage());
    expect(result.current.portfolio).toEqual(defaultPortfolio);
  });

  it("returns stored portfolio when available", () => {
    const custom = { btc: 50000, usdc: 20000 };
    localStorage.setItem("centuari_portfolio", JSON.stringify(custom));

    const { result } = renderHook(() => usePortfolioFromStorage());
    expect(result.current.portfolio).toEqual(custom);
  });

  it("falls back to defaultPortfolio on invalid JSON", () => {
    localStorage.setItem("centuari_portfolio", "not-json");
    const { result } = renderHook(() => usePortfolioFromStorage());
    expect(result.current.portfolio).toEqual(defaultPortfolio);
  });

  it("returns default totalDebt of 80000", () => {
    const { result } = renderHook(() => usePortfolioFromStorage());
    expect(result.current.totalDebt).toBe(80000);
  });

  it("reads stored totalDebt", () => {
    localStorage.setItem("centuari_total_debt", "50000");
    const { result } = renderHook(() => usePortfolioFromStorage());
    expect(result.current.totalDebt).toBe(50000);
  });

  it("reads stored collateralStatus", () => {
    localStorage.setItem("centuari_collateral", JSON.stringify({ btc: true, eth: false }));
    const { result } = renderHook(() => usePortfolioFromStorage());
    expect(result.current.collateralStatus).toEqual({ btc: true, eth: false });
  });

  it("reacts to storage event for portfolio update", () => {
    const { result } = renderHook(() => usePortfolioFromStorage());

    const updated = { btc: 99999 };
    localStorage.setItem("centuari_portfolio", JSON.stringify(updated));
    act(() => {
      window.dispatchEvent(new Event("storage"));
    });

    expect(result.current.portfolio).toEqual(updated);
  });

  it("reacts to centuari-positions-updated event", () => {
    const { result } = renderHook(() => usePortfolioFromStorage());

    localStorage.setItem("centuari_total_debt", "12345");
    act(() => {
      window.dispatchEvent(new CustomEvent("centuari-positions-updated"));
    });

    expect(result.current.totalDebt).toBe(12345);
  });
});
