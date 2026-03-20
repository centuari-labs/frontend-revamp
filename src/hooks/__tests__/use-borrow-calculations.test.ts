import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useBorrowCalculations } from "@/hooks/use-borrow-calculations";
import type { TokenInfo } from "@/lib/portfolio-data";

describe("useBorrowCalculations", () => {
  const portfolio = {
    btc: 100000,
    eth: 50000,
    usdc: 15000,
  };

  const tokenList: TokenInfo[] = [
    { logo: "", value: "btc", label: "BTC", ltv: 0.75, price: 100000, liquidationThreshold: 0.80 },
    { logo: "", value: "eth", label: "ETH", ltv: 0.80, price: 50000, liquidationThreshold: 0.82 },
    { logo: "", value: "usdc", label: "USDC", ltv: 0.90, price: 1, liquidationThreshold: 0.95 },
  ];

  // API values matching backend user-details response
  const apiCollateralUsd = 165000; // total collateral
  const apiSettledDebtUsd = 0;
  const apiWeightedLtv = 0.75;

  it("returns 0 health factor when amount is 0", () => {
    const { result } = renderHook(() =>
      useBorrowCalculations(portfolio, 0, 0, ["btc"], tokenList, apiCollateralUsd, apiSettledDebtUsd, apiWeightedLtv),
    );
    expect(result.current.healthFactor).toBe(0);
  });

  it("returns 0 health factor when no collaterals", () => {
    const { result } = renderHook(() =>
      useBorrowCalculations(portfolio, 0, 1000, [], tokenList, apiCollateralUsd, apiSettledDebtUsd, apiWeightedLtv),
    );
    expect(result.current.healthFactor).toBe(0);
  });

  it("calculates health factor using API values", () => {
    // HF = ((apiCollateralUsd - apiSettledDebtUsd) * apiWeightedLtv) / (apiSettledDebtUsd + borrowAmount)
    // HF = ((165000 - 0) * 0.75) / (0 + 10000) = 123750 / 10000 = 12.375
    const { result } = renderHook(() =>
      useBorrowCalculations(portfolio, 0, 10000, ["btc"], tokenList, apiCollateralUsd, apiSettledDebtUsd, apiWeightedLtv),
    );
    expect(result.current.healthFactor).toBeCloseTo(12.375, 2);
  });

  it("does not cap health factor", () => {
    // HF = ((165000 - 0) * 0.75) / (0 + 1) = 123750
    const { result } = renderHook(() =>
      useBorrowCalculations(portfolio, 0, 1, ["btc"], tokenList, apiCollateralUsd, apiSettledDebtUsd, apiWeightedLtv),
    );
    expect(result.current.healthFactor).toBeGreaterThan(10);
  });

  it("accounts for existing settled debt in HF", () => {
    const settledDebt = 20000;
    // HF = ((165000 - 20000) * 0.75) / (20000 + 5000) = 108750 / 25000 = 4.35
    const { result } = renderHook(() =>
      useBorrowCalculations(portfolio, 20000, 5000, ["btc"], tokenList, apiCollateralUsd, settledDebt, apiWeightedLtv),
    );
    expect(result.current.healthFactor).toBeCloseTo(4.35, 2);
  });

  it("calculates weighted LTV with multiple collaterals", () => {
    // BTC: 100k, LTV 0.75; ETH: 50k, LTV 0.80
    // Weighted: (100000*0.75 + 50000*0.80) / 150000 = 115000/150000 = 0.7667
    const { result } = renderHook(() =>
      useBorrowCalculations(portfolio, 0, 1000, ["btc", "eth"], tokenList, apiCollateralUsd, apiSettledDebtUsd, apiWeightedLtv),
    );
    expect(result.current.weightedLTV).toBeCloseTo(0.7667, 3);
  });

  it("returns default LTV when no collaterals selected", () => {
    const { result } = renderHook(() =>
      useBorrowCalculations(portfolio, 0, 1000, [], tokenList, apiCollateralUsd, apiSettledDebtUsd, apiWeightedLtv),
    );
    expect(result.current.weightedLTV).toBe(0.85);
  });

  it("calculates totalPortfolioValue from selected collaterals", () => {
    const { result } = renderHook(() =>
      useBorrowCalculations(portfolio, 0, 1000, ["btc", "usdc"], tokenList, apiCollateralUsd, apiSettledDebtUsd, apiWeightedLtv),
    );
    expect(result.current.totalPortfolioValue).toBe(115000);
  });

  it("calculates availableQuota", () => {
    // BTC: 100k, LTV 0.75 => max borrow = 75000
    // existing debt = 20000 => available = 55000
    const { result } = renderHook(() =>
      useBorrowCalculations(portfolio, 20000, 5000, ["btc"], tokenList, apiCollateralUsd, 20000, apiWeightedLtv),
    );
    expect(result.current.availableQuota).toBe(55000);
  });

  it("availableQuota is never negative", () => {
    // debt exceeds capacity
    const { result } = renderHook(() =>
      useBorrowCalculations(portfolio, 200000, 1000, ["usdc"], tokenList, apiCollateralUsd, apiSettledDebtUsd, apiWeightedLtv),
    );
    expect(result.current.availableQuota).toBeGreaterThanOrEqual(0);
  });

  it("healthFactorPercentage is a number between 0 and 100", () => {
    const { result } = renderHook(() =>
      useBorrowCalculations(portfolio, 0, 10000, ["btc"], tokenList, apiCollateralUsd, apiSettledDebtUsd, apiWeightedLtv),
    );
    expect(result.current.healthFactorPercentage).toBeGreaterThanOrEqual(0);
    expect(result.current.healthFactorPercentage).toBeLessThanOrEqual(100);
  });

  it("getLiquidationThresholdDisplay returns weighted LT", () => {
    const { result } = renderHook(() =>
      useBorrowCalculations(portfolio, 0, 1000, ["btc", "eth"], tokenList, apiCollateralUsd, apiSettledDebtUsd, apiWeightedLtv),
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
      useBorrowCalculations(portfolio, 0, 1000, [], tokenList, apiCollateralUsd, apiSettledDebtUsd, apiWeightedLtv),
    );
    expect(result.current.getLiquidationThresholdDisplay([], 0)).toBe(0);
  });
});
