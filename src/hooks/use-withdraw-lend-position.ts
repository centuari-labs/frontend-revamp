"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitWithdrawLend } from "@/lib/api";
import { useAuthToken } from "@/hooks/use-auth-token";
import type { WithdrawLendParams } from "@/types/positions";

export function useWithdrawLendPosition() {
  const { getToken } = useAuthToken();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (params: WithdrawLendParams) => {
      const token = await getToken();
      if (!token) throw new Error("Authentication required");
      return submitWithdrawLend(params.positionId, String(params.amount), token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-positions"] });
      queryClient.invalidateQueries({ queryKey: ["my-assets"] });
      queryClient.invalidateQueries({ queryKey: ["my-portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["lend-borrow-assets"] });
    },
  });

  return {
    withdraw: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    resetSuccess: mutation.reset,
  };
}
