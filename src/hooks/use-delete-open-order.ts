"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelOrder } from "@/lib/api";
import { useAuthToken } from "@/hooks/use-auth-token";
import { invalidateUserQueries } from "@/lib/query-keys";

export function useDeleteOpenOrder() {
  const { authFetch } = useAuthToken();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (orderId: string) =>
      authFetch((token) => cancelOrder(orderId, token)),
    onSuccess: () => invalidateUserQueries(queryClient),
  });

  return {
    delete: mutation.mutateAsync,
    deleteOrder: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}
