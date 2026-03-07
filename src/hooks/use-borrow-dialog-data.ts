"use client";

import { useMemo } from "react";
import { USE_MOCK } from "@/lib/use-mock";
import {
  tokenList as portfolioTokenList,
  type TokenInfo,
} from "@/lib/portfolio-data";
import { usePortfolioFromStorage } from "@/hooks/use-portfolio-from-storage";
import { useMyAssets } from "@/hooks/use-my-assets";
import { useLendBorrowAssets } from "@/hooks/use-lend-borrow-assets";

export interface BorrowDialogData {
  portfolio: Record<string, number>;
  totalDebt: number;
  collateralStatus: Record<string, boolean>;
  collateralTokenList: TokenInfo[];
  isLoading: boolean;
  isError: boolean;
}

export function useBorrowDialogData(): BorrowDialogData {
  const mock = usePortfolioFromStorage();
  const { assets, isLoading: assetsLoading, isError: assetsError } = useMyAssets();
  const { lendBorrow, isLoading: lbLoading, isError: lbError } = useLendBorrowAssets();

  return useMemo(() => {
    if (USE_MOCK) {
      return {
        portfolio: mock.portfolio,
        totalDebt: mock.totalDebt,
        collateralStatus: mock.collateralStatus,
        collateralTokenList: portfolioTokenList,
        isLoading: false,
        isError: false,
      };
    }

    // API mode
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
      totalDebt: lendBorrow?.borrowedAssets ?? 0,
      collateralStatus,
      collateralTokenList,
      isLoading: assetsLoading || lbLoading,
      isError: assetsError || lbError,
    };
  }, [mock, assets, lendBorrow, assetsLoading, lbLoading, assetsError, lbError]);
}
