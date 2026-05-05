"use client";

import { useMemo } from "react";
import { getTokenPrice } from "@/lib/utils";
import { useMyAssets } from "@/hooks/use-my-assets";

export interface LendDialogData {
  availableBalance: number;
  tokenPrice: number;
  totalSupply: number;
  isLoading: boolean;
  isError: boolean;
}

export function useLendDialogData(tokenSymbol: string): LendDialogData {
  const { assets, isLoading: assetsLoading, isError } = useMyAssets({ limit: 100 });

  return useMemo(() => {
    const tokenValue = tokenSymbol.toLowerCase();

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

    const tokenPrice = getTokenPrice(asset.amountInUsd, asset.walletBalance);

    return {
      availableBalance: asset.walletBalance,
      tokenPrice,
      totalSupply: 0,
      isLoading: assetsLoading,
      isError,
    };
  }, [tokenSymbol, assets, assetsLoading, isError]);
}
