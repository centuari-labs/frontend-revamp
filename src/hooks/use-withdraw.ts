"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthToken } from "./use-auth-token";
import { submitWithdraw } from "@/lib/api";

export function useWithdraw() {
  const { getToken } = useAuthToken();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      assetId,
      amount,
    }: {
      assetId: string;
      amount: string;
    }) => {
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      return await submitWithdraw(assetId, amount, token);
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["my-assets"] });
      queryClient.invalidateQueries({ queryKey: ["my-portfolio"] });
      queryClient.invalidateQueries({
        queryKey: ["lend-borrow-assets"],
      });
    },
  });

  return {
    ...mutation,
    withdraw: (assetId: string, amount: string) =>
      mutation.mutateAsync({ assetId, amount }),
    txHash: mutation.data?.txHash ?? null,
    withdrawStatus: mutation.status,
    withdrawError: mutation.error?.message ?? null,
  };
}
