"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setAssetAsCollateral } from "@/lib/api";
import { useAuthToken } from "@/hooks/use-auth-token";
import { invalidateUserQueries } from "@/lib/query-keys";

export function useSetCollateral() {
  const { authFetch } = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      assetIds,
      isCollateral,
    }: {
      assetIds: string[];
      isCollateral: boolean;
    }) => authFetch((token) => setAssetAsCollateral(assetIds, isCollateral, token)),
    onSuccess: () => invalidateUserQueries(queryClient),
  });
}
