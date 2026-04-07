"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateOrder } from "@/lib/api";
import { useAuthToken } from "@/hooks/use-auth-token";
import { invalidateUserQueries } from "@/lib/query-keys";
import type { Position } from "@/types/positions";

export function useUpdateOpenOrder() {
  const { authFetch } = useAuthToken();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (position: Position) =>
      authFetch((token) =>
        updateOrder(
          position.id,
          {
            amount: String(position.amount),
            rate: position.apr * 10000,
          },
          token,
        ),
      ),
    onSuccess: () => invalidateUserQueries(queryClient),
  });

  return {
    update: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}
