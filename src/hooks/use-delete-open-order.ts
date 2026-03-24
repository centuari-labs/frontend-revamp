"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelOrder } from "@/lib/api";
import { useAuthToken } from "@/hooks/use-auth-token";

export function useDeleteOpenOrder() {
  const { getToken } = useAuthToken();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (orderId: string) => {
      const token = await getToken();
      if (!token) throw new Error("Authentication required");
      return cancelOrder(orderId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["open-orders"] });
      queryClient.invalidateQueries({ queryKey: ["my-positions"] });
      queryClient.invalidateQueries({ queryKey: ["my-assets"] });
      queryClient.invalidateQueries({ queryKey: ["my-portfolio"] });
    },
  });

  return {
    delete: mutation.mutateAsync,
    deleteOrder: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}
