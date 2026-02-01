"use client";

import { useState, useCallback } from "react";
import { withdrawLendPosition } from "@/lib/positions-adapter.mock";
import type { WithdrawLendParams } from "@/types/positions";

export function useWithdrawLendPosition() {
  const [isPending, setIsPending] = useState(false);

  const withdraw = useCallback(async (params: WithdrawLendParams) => {
    setIsPending(true);
    try {
      await withdrawLendPosition(params);
    } finally {
      setIsPending(false);
    }
  }, []);

  return {
    withdraw,
    isPending,
  };
}
