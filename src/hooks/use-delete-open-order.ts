"use client";

import { useState, useCallback } from "react";
import {
  deleteOpenOrder,
  deleteFilledPosition,
  getOpenOrders,
} from "@/lib/positions-adapter.mock";

export function useDeleteOpenOrder() {
  const [isPending, setIsPending] = useState(false);

  const deleteOrder = useCallback(async (positionId: string) => {
    setIsPending(true);
    try {
      const openOrders = getOpenOrders();
      const isOpenOrder = openOrders.some((p) => p.id === positionId);
      if (isOpenOrder) {
        await deleteOpenOrder(positionId);
      } else {
        await deleteFilledPosition(positionId);
      }
    } finally {
      setIsPending(false);
    }
  }, []);

  return {
    delete: deleteOrder,
    deleteOrder,
    isPending,
  };
}
