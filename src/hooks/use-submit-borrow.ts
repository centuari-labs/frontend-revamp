import { useMutation, useQueryClient } from "@tanstack/react-query";
import { USE_MOCK } from "@/lib/use-mock";
import {
  submitOpenOrder,
  submitFilledBorrowPosition,
  updateOpenOrder,
  updateFilledPosition,
  buildBorrowLimitPosition,
  buildBorrowMarketPosition,
} from "@/lib/positions-adapter.mock";
import {
  submitBorrowLimitOrder,
  submitBorrowMarketOrder,
} from "@/lib/positions-adapter.api";
import type { MarketItem } from "@/lib/api";
import type {
  BorrowPosition,
  SubmitBorrowLimitParams,
  SubmitBorrowMarketParams,
} from "@/types/positions";

export interface SubmitBorrowOptions {
  token?: string;
  markets?: MarketItem[];
}

export function useSubmitBorrow() {
  const queryClient = useQueryClient();

  const limitMutation = useMutation({
    mutationFn: async ({
      params,
      options,
    }: {
      params: SubmitBorrowLimitParams;
      options?: SubmitBorrowOptions;
    }) => {
      if (USE_MOCK) {
        const position = buildBorrowLimitPosition(params);
        if (params.editingPosition) {
          await updateOpenOrder(position);
          return position;
        }
        const result = await submitOpenOrder(position);
        return result as BorrowPosition;
      }

      // API mode
      const { token, markets } = options ?? {};
      if (!token || !markets) {
        throw new Error("Auth token and market data required for API mode");
      }
      return await submitBorrowLimitOrder(params, markets, token);
    },
    onSuccess: () => {
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
      params: SubmitBorrowMarketParams;
      options?: SubmitBorrowOptions;
    }) => {
      if (USE_MOCK) {
        const position = buildBorrowMarketPosition(params);
        if (params.editingPosition) {
          await updateFilledPosition(position);
          return position;
        }
        const result = await submitFilledBorrowPosition(position, {
          amount: params.amount,
        });
        return result;
      }

      // API mode
      const { token, markets } = options ?? {};
      if (!token || !markets) {
        throw new Error("Auth token and market data required for API mode");
      }
      return await submitBorrowMarketOrder(params, markets, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-assets"] });
      queryClient.invalidateQueries({ queryKey: ["my-portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["lend-borrow-assets"] });
      queryClient.invalidateQueries({ queryKey: ["my-positions"] });
    },
  });

  return {
    submitLimit: (
      params: SubmitBorrowLimitParams,
      options?: SubmitBorrowOptions,
    ) => limitMutation.mutateAsync({ params, options }),
    submitMarket: (
      params: SubmitBorrowMarketParams,
      options?: SubmitBorrowOptions,
    ) => marketMutation.mutateAsync({ params, options }),
    isPending: limitMutation.isPending || marketMutation.isPending,
  };
}
