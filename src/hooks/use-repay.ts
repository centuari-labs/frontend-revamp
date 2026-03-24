"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitRepay } from "@/lib/api";
import { useAuthToken } from "@/hooks/use-auth-token";
import type { RepayBorrowParams } from "@/types/positions";

export function useRepay() {
  const { getToken } = useAuthToken();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (params: RepayBorrowParams) => {
      const token = await getToken();
      if (!token) throw new Error("Authentication required");
      return submitRepay(params.positionId, String(params.amount), token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-assets"] });
      queryClient.invalidateQueries({ queryKey: ["my-portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["lend-borrow-assets"] });
      queryClient.invalidateQueries({ queryKey: ["my-positions"] });
      queryClient.invalidateQueries({ queryKey: ["user-details"] });
    },
    onError: (error: Error) => {
      console.error("Repay mutation error:", error);
    },
  });

  return {
    ...mutation,
    repay: mutation.mutateAsync,
  };
}
