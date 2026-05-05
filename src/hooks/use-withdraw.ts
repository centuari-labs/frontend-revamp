"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthToken } from "./use-auth-token";
import { submitWithdraw } from "@/lib/api";
import { invalidateUserQueries } from "@/lib/query-keys";

export function useWithdraw() {
  const { authFetch } = useAuthToken();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      assetId,
      amount,
    }: {
      assetId: string;
      amount: string;
    }) => authFetch((token) => submitWithdraw(assetId, amount, token)),
    onSuccess: () => invalidateUserQueries(queryClient),
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
