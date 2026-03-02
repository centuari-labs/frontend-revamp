"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setAssetAsCollateral } from "@/lib/api";
import { useAuthToken } from "@/hooks/use-auth-token";

export function useSetCollateral() {
  const { getToken } = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assetIds,
      isCollateral,
    }: { assetIds: string[]; isCollateral: boolean }) => {
      const token = await getToken();
      if (!token) throw new Error("No auth token");
      return setAssetAsCollateral(assetIds, isCollateral, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-assets"] });
    },
  });
}
