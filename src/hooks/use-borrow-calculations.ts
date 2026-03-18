"use client";

import { useMemo, useCallback } from "react";
import { getHealthFactorPercentage } from "@/lib/utils";
import {
  type TokenInfo,
  getLiquidationThreshold,
} from "@/lib/portfolio-data";

export function useBorrowCalculations(
  portfolio: Record<string, number>,
  totalDebt: number,
  amount: number,
  selectedCollaterals: string[],
  tokenList: TokenInfo[]
) {
  // Backend formula (health-factor.helpers.ts):
  // HF = ((collateralUsd - existingDebtUsd) × weightedLTV) / totalDebtUsd
  const calculateHealthFactor = useCallback(
    (amt: number, collaterals: string[]): number => {
      if (amt <= 0 || collaterals.length === 0) return 0;

      const collateralUsd = collaterals.reduce((total, collateralValue) => {
        const portfolioValue = portfolio[collateralValue] || 0;
        return total + portfolioValue;
      }, 0);

      if (collateralUsd === 0) return 0;

      const weightedLTV =
        collaterals.reduce((sum, collateralValue) => {
          const token = tokenList.find(
            (t) => t.value === collateralValue
          );
          const portfolioValue = portfolio[collateralValue] || 0;
          if (token && portfolioValue > 0) {
            return sum + token.ltv * portfolioValue;
          }
          return sum;
        }, 0) / collateralUsd;

      const totalDebtUsd = totalDebt + amt;
      const numerator = (collateralUsd - totalDebt) * weightedLTV;
      const healthFactor = numerator / totalDebtUsd;

      if (!Number.isFinite(healthFactor) || healthFactor < 0) return 0;
      return Math.min(healthFactor, 10);
    },
    [portfolio, totalDebt, tokenList]
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
        const token = tokenList.find(
          (t) => t.value === collateralValue
        );
        const portfolioValue = portfolio[collateralValue] || 0;
        if (token && portfolioValue > 0) {
          return sum + token.ltv * portfolioValue;
        }
        return sum;
      }, 0) / totalPortfolioValue
    );
  }, [portfolio, selectedCollaterals, totalPortfolioValue, tokenList]);

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
          const token = tokenList.find(
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
    [portfolio, tokenList]
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
