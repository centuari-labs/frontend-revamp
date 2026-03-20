"use client";

import { useMemo } from "react";
import { type TokenInfo } from "@/lib/portfolio-data";
import { useMyAssets } from "@/hooks/use-my-assets";
import { useUserDetailsContext } from "@/contexts/user-details-context";

export interface BorrowPortfolioData {
  portfolio: Record<string, number>;
  totalDebt: number;
  collateralStatus: Record<string, boolean>;
  collateralTokenList: TokenInfo[];
  userHealthFactor: number;
  /** Backend HF inputs for consistent projected calculation */
  apiCollateralUsd: number;
  apiSettledDebtUsd: number;
  apiWeightedLtv: number;
  isLoading: boolean;
}

export function useBorrowPortfolioData(): BorrowPortfolioData {
  const { assets, isLoading: assetsLoading } = useMyAssets({ limit: 100 });
  const { userDetails } = useUserDetailsContext();

  return useMemo(() => {
    const portfolio: Record<string, number> = {};
    const collateralStatus: Record<string, boolean> = {};
    const collateralTokenList: TokenInfo[] = [];

    for (const asset of assets) {
      const key = asset.symbol.toLowerCase();
      portfolio[key] = asset.amountInUsd;
      collateralStatus[key] = asset.isCollateral;
      collateralTokenList.push({
        logo: asset.imageUrl ?? "/tokens/centuari-eth.png",
        value: key,
        label: asset.name,
        ltv: asset.ltv,
        price: asset.amountInUsd > 0 && asset.walletBalance > 0
          ? asset.amountInUsd / asset.walletBalance
          : 0,
        liquidationThreshold: asset.liquidationThreshold,
      });
    }

    return {
      portfolio,
      totalDebt: userDetails?.totalDebtUsd ?? 0,
      collateralStatus,
      collateralTokenList,
      userHealthFactor: Number.isFinite(userDetails?.healthFactor) ? userDetails!.healthFactor : 0,
      apiCollateralUsd: userDetails?.collateralUsd ?? 0,
      apiSettledDebtUsd: userDetails?.settledDebtUsd ?? 0,
      apiWeightedLtv: userDetails?.weightedLtv ?? 0,
      isLoading: assetsLoading,
    };
  }, [assets, assetsLoading, userDetails]);
}
