"use client";

import { useState, useCallback } from "react";
import { USE_MOCK } from "@/lib/use-mock";
import {
  submitOpenOrder,
  submitFilledLendPosition,
  updateOpenOrder,
  updateFilledPosition,
  buildLendLimitPosition,
  buildLendMarketPosition,
} from "@/lib/positions-adapter.mock";
import { submitLendLimitOrder, submitLendMarketOrder } from "@/lib/positions-adapter.api";
import type { MarketItem } from "@/lib/api";
import type {
  LendPosition,
  SubmitLendLimitParams,
  SubmitLendMarketParams,
} from "@/types/positions";

export interface SubmitLimitOptions {
  token?: string;
  markets?: MarketItem[];
}

export function useSubmitLend() {
  const [isPending, setIsPending] = useState(false);

  const submitLimit = useCallback(
    async (params: SubmitLendLimitParams, options?: SubmitLimitOptions) => {
      setIsPending(true);
      try {
        if (USE_MOCK) {
          const position = buildLendLimitPosition(params);
          if (params.editingPosition) {
            await updateOpenOrder(position);
            return position;
          }
          const result = await submitOpenOrder(position);
          return result as LendPosition;
        }

        // API mode
        const { token, markets } = options ?? {};
        if (!token || !markets) {
          throw new Error("Auth token and market data required for API mode");
        }
        return await submitLendLimitOrder(params, markets, token);
      } finally {
        setIsPending(false);
      }
    },
    [],
  );

  const submitMarket = useCallback(
    async (params: SubmitLendMarketParams, options?: SubmitLimitOptions) => {
      setIsPending(true);
      try {
        if (USE_MOCK) {
          const position = buildLendMarketPosition(params);
          if (params.editingPosition) {
            await updateFilledPosition(position);
            return position;
          }
          const result = await submitFilledLendPosition(position, {
            amountInUsd: params.amountInUsd,
            tokenValue: params.tokenValue,
          });
          return result;
        }

        // API mode
        const { token, markets } = options ?? {};
        if (!token || !markets) {
          throw new Error("Auth token and market data required for API mode");
        }
        return await submitLendMarketOrder(params, markets, token);
      } finally {
        setIsPending(false);
      }
    },
    [],
  );

  return {
    submitLimit,
    submitMarket,
    isPending,
  };
}
