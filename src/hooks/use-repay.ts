"use client";

import { useState, useCallback } from "react";
import { repayBorrowPosition } from "@/lib/positions-adapter.mock";
import type { RepayBorrowParams } from "@/types/positions";

export function useRepay() {
  const [isPending, setIsPending] = useState(false);

  const repay = useCallback(async (params: RepayBorrowParams) => {
    setIsPending(true);
    try {
      await repayBorrowPosition(params);
    } finally {
      setIsPending(false);
    }
  }, []);

  return {
    repay,
    isPending,
  };
}
