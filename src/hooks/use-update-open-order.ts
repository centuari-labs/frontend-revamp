"use client";

import { useState, useCallback } from "react";
import {
  updateOpenOrder,
  updateFilledPosition,
  getOpenOrders,
} from "@/lib/positions-adapter.mock";
import type { Position } from "@/types/positions";

export function useUpdateOpenOrder() {
  const [isPending, setIsPending] = useState(false);

  const update = useCallback(async (position: Position) => {
    setIsPending(true);
    try {
      const openOrders = getOpenOrders();
      const isOpenOrder = openOrders.some((p) => p.id === position.id);
      if (isOpenOrder) {
        await updateOpenOrder(position);
      } else {
        await updateFilledPosition(position);
      }
    } finally {
      setIsPending(false);
    }
  }, []);

  return {
    update,
    isPending,
  };
}
