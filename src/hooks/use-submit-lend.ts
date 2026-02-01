"use client";

import { useState, useCallback } from "react";
import {
  submitOpenOrder,
  submitFilledLendPosition,
  updateOpenOrder,
  updateFilledPosition,
  buildLendLimitPosition,
  buildLendMarketPosition,
} from "@/lib/positions-adapter.mock";
import type {
  LendPosition,
  SubmitLendLimitParams,
  SubmitLendMarketParams,
} from "@/types/positions";

export function useSubmitLend() {
  const [isPending, setIsPending] = useState(false);

  const submitLimit = useCallback(async (params: SubmitLendLimitParams) => {
    setIsPending(true);
    try {
      const position = buildLendLimitPosition(params);
      if (params.editingPosition) {
        await updateOpenOrder(position);
        return position;
      }
      const result = await submitOpenOrder(position);
      return result as LendPosition;
    } finally {
      setIsPending(false);
    }
  }, []);

  const submitMarket = useCallback(async (params: SubmitLendMarketParams) => {
    setIsPending(true);
    try {
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
    } finally {
      setIsPending(false);
    }
  }, []);

  return {
    submitLimit,
    submitMarket,
    isPending,
  };
}
