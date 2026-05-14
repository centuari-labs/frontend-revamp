"use client";

import { useMemo, useCallback } from "react";
import { getHealthFactorPercentage } from "@/lib/utils";
import { type TokenInfo, getLiquidationThreshold } from "@/lib/portfolio-data";

export function useBorrowCalculations(
	portfolio: Record<string, number>,
	totalDebt: number,
	amount: number,
	selectedCollaterals: string[],
	tokenList: TokenInfo[],
	apiCollateralUsd = 0,
	apiSettledDebtUsd = 0,
	apiWeightedLtv = 0,
	borrowTokenPrice = 0,
) {
	// Uses backend values (collateralUsd, settledDebtUsd, weightedLtv) from user-details API
	// to match backend formula: HF = ((C_usd - D_settled) × LTV_weighted) / (D_settled + borrowAmountUsd)
	const calculateHealthFactor = useCallback(
		(amt: number, collaterals: string[]): number => {
			if (amt <= 0 || collaterals.length === 0 || apiCollateralUsd <= 0)
				return 0;

			const borrowAmountUsd = amt * borrowTokenPrice;
			const projectedDebt = apiSettledDebtUsd + borrowAmountUsd;
			if (projectedDebt <= 0) return 0;

			const numerator = (apiCollateralUsd - apiSettledDebtUsd) * apiWeightedLtv;
			const healthFactor = numerator / projectedDebt;

			if (!Number.isFinite(healthFactor) || healthFactor < 0) return 0;
			return healthFactor;
		},
		[apiCollateralUsd, apiSettledDebtUsd, apiWeightedLtv, borrowTokenPrice],
	);

	const totalPortfolioValue = useMemo(
		() =>
			selectedCollaterals.reduce(
				(total, collateralValue) => total + (portfolio[collateralValue] || 0),
				0,
			),
		[portfolio, selectedCollaterals],
	);

	const weightedLTV = useMemo(() => {
		if (selectedCollaterals.length === 0 || totalPortfolioValue === 0)
			return 0.85;
		return (
			selectedCollaterals.reduce((sum, collateralValue) => {
				const token = tokenList.find((t) => t.value === collateralValue);
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
		[calculateHealthFactor, amount, selectedCollaterals],
	);

	const healthFactorPercentage = useMemo(
		() => getHealthFactorPercentage(healthFactor),
		[healthFactor],
	);

	const getLiquidationThresholdDisplay = useCallback(
		(collaterals: string[], totalPV: number): number => {
			if (collaterals.length === 0 || totalPV === 0) return 0;
			const weightedLT =
				collaterals.reduce((sum, collateralValue) => {
					const token = tokenList.find((t) => t.value === collateralValue);
					const portfolioValue = portfolio[collateralValue] || 0;
					if (token && portfolioValue > 0) {
						const lt = getLiquidationThreshold(token);
						return sum + lt * portfolioValue;
					}
					return sum;
				}, 0) / totalPV;
			return weightedLT;
		},
		[portfolio, tokenList],
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
