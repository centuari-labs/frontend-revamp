"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { repayBorrowPosition } from "@/lib/positions-adapter.mock";
import type { RepayBorrowParams } from "@/types/positions";

export function useRepay() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (params: RepayBorrowParams) => repayBorrowPosition(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-assets"] });
      queryClient.invalidateQueries({ queryKey: ["my-portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["lend-borrow-assets"] });
      queryClient.invalidateQueries({ queryKey: ["my-positions"] });
    },
  });

  return {
    ...mutation,
    repay: mutation.mutateAsync,
  };
}
