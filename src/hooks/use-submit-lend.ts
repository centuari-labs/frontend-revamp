"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { USE_MOCK } from "@/lib/use-mock";
import {
  submitOpenOrder,
  submitFilledLendPosition,
  updateOpenOrder,
  updateFilledPosition,
  buildLendLimitPosition,
  buildLendMarketPosition,
} from "@/lib/positions-adapter.mock";
import {
  submitLendLimitOrder,
  submitLendMarketOrder,
} from "@/lib/positions-adapter.api";
import type { MarketItem } from "@/lib/api";
import type {
  LendPosition,
  SubmitLendLimitParams,
  SubmitLendMarketParams,
} from "@/types/positions";

export interface SubmitLimitOptions {
  token?: string;
  markets?: MarketItem[];
}

export function useSubmitLend() {
  const queryClient = useQueryClient();

  const limitMutation = useMutation({
    mutationFn: async ({
      params,
      options,
    }: {
      params: SubmitLendLimitParams;
      options?: SubmitLimitOptions;
    }) => {
      if (USE_MOCK) {
        const position = buildLendLimitPosition(params);
        if (params.editingPosition) {
          await updateOpenOrder(position);
          return position;
        }
        const result = await submitOpenOrder(position);
        return result as LendPosition;
      }

      // API mode
      const { token, markets } = options ?? {};
      if (!token || !markets) {
        throw new Error("Auth token and market data required for API mode");
      }
      return await submitLendLimitOrder(params, markets, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["open-lend-amounts"] });
      queryClient.invalidateQueries({ queryKey: ["my-assets"] });
      queryClient.invalidateQueries({ queryKey: ["my-portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["lend-borrow-assets"] });
      queryClient.invalidateQueries({ queryKey: ["my-positions"] });
    },
  });

  const marketMutation = useMutation({
    mutationFn: async ({
      params,
      options,
    }: {
      params: SubmitLendMarketParams;
      options?: SubmitLimitOptions;
    }) => {
      if (USE_MOCK) {
        const position = buildLendMarketPosition(params);
        if (params.editingPosition) {
          await updateFilledPosition(position);
          return position;
        }
        const result = await submitFilledLendPosition(position, {
          amountInUsd: params.amountInUsd,
          tokenValue: params.tokenValue,
        });
        return result;
      }

      // API mode
      const { token, markets } = options ?? {};
      if (!token || !markets) {
        throw new Error("Auth token and market data required for API mode");
      }
      return await submitLendMarketOrder(params, markets, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["open-lend-amounts"] });
      queryClient.invalidateQueries({ queryKey: ["my-assets"] });
      queryClient.invalidateQueries({ queryKey: ["my-portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["lend-borrow-assets"] });
      queryClient.invalidateQueries({ queryKey: ["my-positions"] });
    },
  });

  return {
    submitLimit: (
      params: SubmitLendLimitParams,
      options?: SubmitLimitOptions,
    ) => limitMutation.mutateAsync({ params, options }),
    submitMarket: (
      params: SubmitLendMarketParams,
      options?: SubmitLimitOptions,
    ) => marketMutation.mutateAsync({ params, options }),
    isPending: limitMutation.isPending || marketMutation.isPending,
  };
}
