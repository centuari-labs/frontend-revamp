"use client";

import { useMemo } from "react";
import type { TokenInfo } from "@/lib/portfolio-data";
import { useMyAssets } from "@/hooks/use-my-assets";
import { useUserDetailsContext } from "@/contexts/user-details-context";

export interface BorrowPortfolioData {
	portfolio: Record<string, number>;
	totalDebt: number;
	collateralStatus: Record<string, boolean>;
	/** Mirror of `user_balance.pending_collateral_flag` by symbol-key. Used by
	 *  the borrow dialog to skip enqueuing an asset that's already queued. */
	pendingCollateralFlag: Record<string, boolean>;
	/** symbol-key → hex token address. Passed into `useFlagCollateral` for
	 *  newly-selected collateral on borrow submit. */
	tokenAddressBySymbol: Record<string, `0x${string}`>;
	collateralTokenList: TokenInfo[];
	userHealthFactor: number;
	/** Backend HF inputs for consistent projected calculation */
	apiCollateralUsd: number;
	apiSettledDebtUsd: number;
	apiWeightedLtv: number;
	isLoading: boolean;
	isError: boolean;
}

/** @deprecated Use {@link BorrowPortfolioData} instead. */
export type BorrowDialogData = BorrowPortfolioData;

export function useBorrowPortfolioData(): BorrowPortfolioData {
	const {
		assets,
		isLoading: assetsLoading,
		isError: assetsError,
	} = useMyAssets({ limit: 100 });
	const { userDetails } = useUserDetailsContext();

	return useMemo(() => {
		const portfolio: Record<string, number> = {};
		const collateralStatus: Record<string, boolean> = {};
		const pendingCollateralFlag: Record<string, boolean> = {};
		const tokenAddressBySymbol: Record<string, `0x${string}`> = {};
		const collateralTokenList: TokenInfo[] = [];

		for (const asset of assets) {
			const key = asset.symbol.toLowerCase();
			portfolio[key] = asset.amountInUsd;
			collateralStatus[key] = asset.isCollateral;
			pendingCollateralFlag[key] = asset.pendingCollateralFlag;
			tokenAddressBySymbol[key] = asset.tokenAddress;
			collateralTokenList.push({
				logo: asset.imageUrl ?? "/tokens/centuari-eth.png",
				value: key,
				label: asset.name,
				ltv: asset.ltv,
				liquidationThreshold: asset.liquidationThreshold,
			});
		}

		return {
			portfolio,
			totalDebt: userDetails?.totalDebtUsd ?? 0,
			collateralStatus,
			pendingCollateralFlag,
			tokenAddressBySymbol,
			collateralTokenList,
			userHealthFactor: Number.isFinite(userDetails?.healthFactor)
				? (userDetails?.healthFactor ?? 0)
				: 0,
			apiCollateralUsd: userDetails?.collateralUsd ?? 0,
			apiSettledDebtUsd: userDetails?.settledDebtUsd ?? 0,
			apiWeightedLtv: userDetails?.weightedLtv ?? 0,
			isLoading: assetsLoading,
			isError: assetsError,
		};
	}, [assets, assetsLoading, assetsError, userDetails]);
}

/** @deprecated Use {@link useBorrowPortfolioData} instead. */
export const useBorrowDialogData = useBorrowPortfolioData;
