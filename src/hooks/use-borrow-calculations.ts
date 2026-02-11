"use client";

import { useMemo, useCallback } from "react";
import { getHealthFactorPercentage } from "@/lib/utils";
import {
  tokenList as portfolioTokenList,
  getLiquidationThreshold,
} from "@/lib/portfolio-data";

export function useBorrowCalculations(
  portfolio: Record<string, number>,
  totalDebt: number,
  amount: number,
  selectedCollaterals: string[]
) {
  const calculateHealthFactor = useCallback(
    (amt: number, collaterals: string[]): number => {
      if (amt <= 0 || collaterals.length === 0) return 0;

      const totalPortfolioValue = collaterals.reduce((total, collateralValue) => {
        const portfolioValue = portfolio[collateralValue] || 0;
        return total + portfolioValue;
      }, 0);

      if (totalPortfolioValue === 0) return 0;

      const weightedLT =
        collaterals.reduce((sum, collateralValue) => {
          const token = portfolioTokenList.find(
            (t) => t.value === collateralValue
          );
          const portfolioValue = portfolio[collateralValue] || 0;
          if (token && portfolioValue > 0) {
            const lt = getLiquidationThreshold(token);
            return sum + lt * portfolioValue;
          }
          return sum;
        }, 0) / totalPortfolioValue;

      const newTotalDebt = totalDebt + amt;
      const healthFactor = (totalPortfolioValue * weightedLT) / newTotalDebt;
      return Math.min(healthFactor, 10);
    },
    [portfolio, totalDebt]
  );

  const totalPortfolioValue = useMemo(
    () =>
      selectedCollaterals.reduce(
        (total, collateralValue) =>
          total + (portfolio[collateralValue] || 0),
        0
      ),
    [portfolio, selectedCollaterals]
  );

  const weightedLTV = useMemo(() => {
    if (selectedCollaterals.length === 0 || totalPortfolioValue === 0)
      return 0.85;
    return (
      selectedCollaterals.reduce((sum, collateralValue) => {
        const token = portfolioTokenList.find(
          (t) => t.value === collateralValue
        );
        const portfolioValue = portfolio[collateralValue] || 0;
        if (token && portfolioValue > 0) {
          return sum + token.ltv * portfolioValue;
        }
        return sum;
      }, 0) / totalPortfolioValue
    );
  }, [portfolio, selectedCollaterals, totalPortfolioValue]);

  const maxBorrowCapacity = totalPortfolioValue * weightedLTV;
  const availableQuota = Math.max(0, maxBorrowCapacity - totalDebt);

  const healthFactor = useMemo(
    () => calculateHealthFactor(amount, selectedCollaterals),
    [calculateHealthFactor, amount, selectedCollaterals]
  );

  const healthFactorPercentage = useMemo(
    () => getHealthFactorPercentage(healthFactor),
    [healthFactor]
  );

  const getLiquidationThresholdDisplay = useCallback(
    (collaterals: string[], totalPV: number): number => {
      if (collaterals.length === 0 || totalPV === 0) return 0;
      const weightedLT =
        collaterals.reduce((sum, collateralValue) => {
          const token = portfolioTokenList.find(
            (t) => t.value === collateralValue
          );
          const portfolioValue = portfolio[collateralValue] || 0;
          if (token && portfolioValue > 0) {
            const lt = getLiquidationThreshold(token);
            return sum + lt * portfolioValue;
          }
          return sum;
        }, 0) / totalPV;
      return weightedLT;
    },
    [portfolio]
  );

  return {
    healthFactor,
    healthFactorPercentage,
    totalPortfolioValue,
    weightedLTV,
    maxBorrowCapacity,
    availableQuota,
    getLiquidationThresholdDisplay,
  };
}
