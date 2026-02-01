"use client";

import { useState, useCallback } from "react";
import {
  submitOpenOrder,
  submitFilledBorrowPosition,
  updateOpenOrder,
  updateFilledPosition,
  buildBorrowLimitPosition,
  buildBorrowMarketPosition,
} from "@/lib/positions-adapter.mock";
import type {
  BorrowPosition,
  SubmitBorrowLimitParams,
  SubmitBorrowMarketParams,
} from "@/types/positions";

export function useSubmitBorrow() {
  const [isPending, setIsPending] = useState(false);

  const submitLimit = useCallback(async (params: SubmitBorrowLimitParams) => {
    setIsPending(true);
    try {
      const position = buildBorrowLimitPosition(params);
      if (params.editingPosition) {
        await updateOpenOrder(position);
        return position;
      }
      const result = await submitOpenOrder(position);
      return result as BorrowPosition;
    } finally {
      setIsPending(false);
    }
  }, []);

  const submitMarket = useCallback(async (params: SubmitBorrowMarketParams) => {
    setIsPending(true);
    try {
      const position = buildBorrowMarketPosition(params);
      if (params.editingPosition) {
        await updateFilledPosition(position);
        return position;
      }
      const result = await submitFilledBorrowPosition(position, {
        amount: params.amount,
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
