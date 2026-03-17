"use client";

import { useMemo } from "react";
import { type TokenInfo } from "@/lib/portfolio-data";
import { useMyAssets } from "@/hooks/use-my-assets";

export interface BorrowDialogData {
  portfolio: Record<string, number>;
  totalDebt: number;
  collateralStatus: Record<string, boolean>;
  collateralTokenList: TokenInfo[];
  isLoading: boolean;
  isError: boolean;
}

export function useBorrowDialogData(): BorrowDialogData {
  const { assets, isLoading: assetsLoading, isError: assetsError } = useMyAssets({ limit: 100 });

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
        price:
          asset.amountInUsd > 0 && asset.walletBalance > 0
            ? asset.amountInUsd / asset.walletBalance
            : 0,
        liquidationThreshold: asset.liquidationThreshold,
      });
    }

    return {
      portfolio,
      totalDebt: 0,
      collateralStatus,
      collateralTokenList,
      isLoading: assetsLoading,
      isError: assetsError,
    };
  }, [assets, assetsLoading, assetsError]);
}
