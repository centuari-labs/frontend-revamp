"use client";

import { useState, useCallback } from "react";
import { USE_MOCK } from "@/lib/use-mock";
import {
  submitOpenOrder,
  submitFilledBorrowPosition,
  updateOpenOrder,
  updateFilledPosition,
  buildBorrowLimitPosition,
  buildBorrowMarketPosition,
} from "@/lib/positions-adapter.mock";
import {
  submitBorrowLimitOrder,
  submitBorrowMarketOrder,
} from "@/lib/positions-adapter.api";
import type { MarketItem } from "@/lib/api";
import type {
  BorrowPosition,
  SubmitBorrowLimitParams,
  SubmitBorrowMarketParams,
} from "@/types/positions";

export interface SubmitBorrowOptions {
  token?: string;
  markets?: MarketItem[];
}

export function useSubmitBorrow() {
  const [isPending, setIsPending] = useState(false);

  const submitLimit = useCallback(
    async (params: SubmitBorrowLimitParams, options?: SubmitBorrowOptions) => {
      setIsPending(true);
      try {
        if (USE_MOCK) {
          const position = buildBorrowLimitPosition(params);
          if (params.editingPosition) {
            await updateOpenOrder(position);
            return position;
          }
          const result = await submitOpenOrder(position);
          return result as BorrowPosition;
        }

        // API mode
        const { token, markets } = options ?? {};
        if (!token || !markets) {
          throw new Error("Auth token and market data required for API mode");
        }
        return await submitBorrowLimitOrder(params, markets, token);
      } finally {
        setIsPending(false);
      }
    },
    [],
  );

  const submitMarket = useCallback(
    async (params: SubmitBorrowMarketParams, options?: SubmitBorrowOptions) => {
      setIsPending(true);
      try {
        if (USE_MOCK) {
          const position = buildBorrowMarketPosition(params);
          if (params.editingPosition) {
            await updateFilledPosition(position);
            return position;
          }
          const result = await submitFilledBorrowPosition(position, {
            amount: params.amount,
          });
          return result;
        }

        // API mode
        const { token, markets } = options ?? {};
        if (!token || !markets) {
          throw new Error("Auth token and market data required for API mode");
        }
        return await submitBorrowMarketOrder(params, markets, token);
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
