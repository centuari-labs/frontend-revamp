"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { withdrawLendPosition } from "@/lib/api";
import { useAuthToken } from "@/hooks/use-auth-token";

export function useWithdrawLendPosition() {
  const { getToken } = useAuthToken();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (marketId: string) => {
      const token = await getToken();
      if (!token) throw new Error("Authentication required");
      return withdrawLendPosition(marketId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-positions"] });
      queryClient.invalidateQueries({ queryKey: ["my-assets"] });
      queryClient.invalidateQueries({ queryKey: ["my-portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["lend-borrow-assets"] });
      queryClient.invalidateQueries({ queryKey: ["order-history"] });
    },
  });

  return {
    withdraw: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    resetSuccess: mutation.reset,
  };
}
