"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateOrder } from "@/lib/api";
import { useAuthToken } from "@/hooks/use-auth-token";
import type { Position } from "@/types/positions";

export function useUpdateOpenOrder() {
  const { getToken } = useAuthToken();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (position: Position) => {
      const token = await getToken();
      if (!token) throw new Error("Authentication required");
      return updateOrder(
        position.id,
        {
          amount: String(position.amount),
          rate: position.apr * 10000,
        },
        token,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-positions"] });
      queryClient.invalidateQueries({ queryKey: ["my-assets"] });
      queryClient.invalidateQueries({ queryKey: ["my-portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["open-lend-amounts"] });
    },
  });

  return {
    update: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}
