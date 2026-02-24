import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useBorrowCalculations } from "@/hooks/use-borrow-calculations";

describe("useBorrowCalculations", () => {
  const portfolio = {
    btc: 100000,
    eth: 50000,
    usdc: 15000,
  };

  it("returns 0 health factor when amount is 0", () => {
    const { result } = renderHook(() =>
      useBorrowCalculations(portfolio, 0, 0, ["btc"]),
    );
    expect(result.current.healthFactor).toBe(0);
  });

  it("returns 0 health factor when no collaterals", () => {
    const { result } = renderHook(() =>
      useBorrowCalculations(portfolio, 0, 1000, []),
    );
    expect(result.current.healthFactor).toBe(0);
  });

  it("calculates health factor with single collateral", () => {
    // BTC: portfolio $100k, LT=0.80
    // Borrow $10k, existing debt $0
    // HF = (100000 * 0.80) / 10000 = 8.0
    const { result } = renderHook(() =>
      useBorrowCalculations(portfolio, 0, 10000, ["btc"]),
    );
    expect(result.current.healthFactor).toBe(8.0);
  });

  it("caps health factor at 10", () => {
    // BTC: 100k * 0.80 / 1 = 80000 => capped at 10
    const { result } = renderHook(() =>
      useBorrowCalculations(portfolio, 0, 1, ["btc"]),
    );
    expect(result.current.healthFactor).toBe(10);
  });

  it("calculates weighted LTV with multiple collaterals", () => {
    // BTC: 100k, LTV 0.75; ETH: 50k, LTV 0.80
    // Weighted: (100000*0.75 + 50000*0.80) / 150000 = 115000/150000 = 0.7667
    const { result } = renderHook(() =>
      useBorrowCalculations(portfolio, 0, 1000, ["btc", "eth"]),
    );
    expect(result.current.weightedLTV).toBeCloseTo(0.7667, 3);
  });

  it("returns default LTV when no collaterals selected", () => {
    const { result } = renderHook(() =>
      useBorrowCalculations(portfolio, 0, 1000, []),
    );
    expect(result.current.weightedLTV).toBe(0.85);
  });

  it("calculates totalPortfolioValue from selected collaterals", () => {
    const { result } = renderHook(() =>
      useBorrowCalculations(portfolio, 0, 1000, ["btc", "usdc"]),
    );
    expect(result.current.totalPortfolioValue).toBe(115000);
  });

  it("calculates availableQuota", () => {
    // BTC: 100k, LTV 0.75 => max borrow = 75000
    // existing debt = 20000 => available = 55000
    const { result } = renderHook(() =>
      useBorrowCalculations(portfolio, 20000, 5000, ["btc"]),
    );
    expect(result.current.availableQuota).toBe(55000);
  });

  it("availableQuota is never negative", () => {
    // debt exceeds capacity
    const { result } = renderHook(() =>
      useBorrowCalculations(portfolio, 200000, 1000, ["usdc"]),
    );
    expect(result.current.availableQuota).toBeGreaterThanOrEqual(0);
  });

  it("healthFactorPercentage is a number between 0 and 100", () => {
    const { result } = renderHook(() =>
      useBorrowCalculations(portfolio, 0, 10000, ["btc"]),
    );
    expect(result.current.healthFactorPercentage).toBeGreaterThanOrEqual(0);
    expect(result.current.healthFactorPercentage).toBeLessThanOrEqual(100);
  });

  it("getLiquidationThresholdDisplay returns weighted LT", () => {
    const { result } = renderHook(() =>
      useBorrowCalculations(portfolio, 0, 1000, ["btc", "eth"]),
    );
    // BTC: 100k, LT=0.80; ETH: 50k, LT=0.82
    // Weighted: (100000*0.80 + 50000*0.82) / 150000 = 121000/150000 = 0.8067
    const lt = result.current.getLiquidationThresholdDisplay(
      ["btc", "eth"],
      150000,
    );
    expect(lt).toBeCloseTo(0.8067, 3);
  });

  it("getLiquidationThresholdDisplay returns 0 when no collaterals", () => {
    const { result } = renderHook(() =>
      useBorrowCalculations(portfolio, 0, 1000, []),
    );
    expect(result.current.getLiquidationThresholdDisplay([], 0)).toBe(0);
  });
});
