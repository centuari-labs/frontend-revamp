"use client";

import { useState, useCallback } from "react";
import { withdrawLendPosition } from "@/lib/positions-adapter.mock";
import type { WithdrawLendParams } from "@/types/positions";

export function useWithdrawLendPosition() {
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const withdraw = useCallback(async (params: WithdrawLendParams) => {
    setIsPending(true);
    setIsSuccess(false);
    try {
      await withdrawLendPosition(params);
      setIsSuccess(true);
    } finally {
      setIsPending(false);
    }
  }, []);

  const resetSuccess = useCallback(() => {
    setIsSuccess(false);
  }, []);

  return {
    withdraw,
    isPending,
    isSuccess,
    resetSuccess,
  };
}
