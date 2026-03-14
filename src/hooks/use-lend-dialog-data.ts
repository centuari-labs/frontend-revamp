"use client";

import { useMemo } from "react";
import { USE_MOCK } from "@/lib/use-mock";
import {
  tokenList,
  defaultPortfolio,
  type TokenInfo,
} from "@/lib/portfolio-data";
import { usePortfolioFromStorage } from "@/hooks/use-portfolio-from-storage";
import { useMyAssets } from "@/hooks/use-my-assets";

export interface LendDialogData {
  availableBalance: number;
  tokenPrice: number;
  totalSupply: number;
  isLoading: boolean;
  isError: boolean;
}

export function useLendDialogData(tokenSymbol: string): LendDialogData {
  const mock = usePortfolioFromStorage();
  const { assets, isLoading: assetsLoading, isError } = useMyAssets({ limit: 100 });

  return useMemo(() => {
    const tokenValue = tokenSymbol.toLowerCase();

    if (USE_MOCK) {
      const token = tokenList.find(
        (t) =>
          t.label.toUpperCase() === tokenSymbol.toUpperCase() ||
          t.value.toUpperCase() === tokenSymbol.toUpperCase(),
      );
      const portfolioValue = mock.portfolio[tokenValue] || 0;
      const price = token?.price ?? 0;
      const balance = price > 0 ? portfolioValue / price : 0;

      let totalSupply = 0;
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("centuari_total_supply");
        if (stored) {
          try {
            totalSupply = parseFloat(stored) || 0;
          } catch {
            // ignore
          }
        }
      }

      return {
        availableBalance: balance,
        tokenPrice: price,
        totalSupply,
        isLoading: false,
        isError: false,
      };
    }

    // API mode
    const asset = assets.find(
      (a) => a.symbol.toLowerCase() === tokenValue,
    );

    if (!asset) {
      return {
        availableBalance: 0,
        tokenPrice: 0,
        totalSupply: 0,
        isLoading: assetsLoading,
        isError,
      };
    }

    const tokenPrice =
      asset.amountInUsd > 0 && asset.walletBalance > 0
        ? asset.amountInUsd / asset.walletBalance
        : 0;

    return {
      availableBalance: asset.walletBalance,
      tokenPrice,
      totalSupply: 0,
      isLoading: assetsLoading,
      isError,
    };
  }, [tokenSymbol, mock, assets, assetsLoading, isError]);
}
