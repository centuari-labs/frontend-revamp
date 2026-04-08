"use client";

import { useMemo } from "react";
import { getTokenPrice } from "@/lib/utils";
import { type TokenInfo } from "@/lib/portfolio-data";
import { useMyAssets } from "@/hooks/use-my-assets";
import { useUserDetailsContext } from "@/contexts/user-details-context";

export interface BorrowDialogData {
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
  isError: boolean;
}

export function useBorrowDialogData(): BorrowDialogData {
  const { assets, isLoading: assetsLoading, isError: assetsError } = useMyAssets({ limit: 100 });
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
        price: getTokenPrice(asset.amountInUsd, asset.walletBalance),
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
      isError: assetsError,
    };
  }, [assets, assetsLoading, assetsError, userDetails]);
}
