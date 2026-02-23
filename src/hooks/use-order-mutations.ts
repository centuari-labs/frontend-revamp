"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	createLendMarketOrder,
	createLendLimitOrder,
	createBorrowMarketOrder,
	createBorrowLimitOrder,
	cancelOrder,
} from "@/lib/api";
import { useAuthToken } from "./use-auth-token";
import type {
	CreateLendMarketOrderRequest,
	CreateLendLimitOrderRequest,
	CreateBorrowMarketOrderRequest,
	CreateBorrowLimitOrderRequest,
} from "@/types/api";

function useOrderMutation<T>(
	mutationFn: (token: string, data: T) => Promise<unknown>,
) {
	const { getToken } = useAuthToken();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: T) => {
			const token = await getToken();
			return mutationFn(token, data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["portfolio"] });
		},
	});
}

export function useCreateLendMarketOrder() {
	return useOrderMutation<CreateLendMarketOrderRequest>(createLendMarketOrder);
}

export function useCreateLendLimitOrder() {
	return useOrderMutation<CreateLendLimitOrderRequest>(createLendLimitOrder);
}

export function useCreateBorrowMarketOrder() {
	return useOrderMutation<CreateBorrowMarketOrderRequest>(
		createBorrowMarketOrder,
	);
}

export function useCreateBorrowLimitOrder() {
	return useOrderMutation<CreateBorrowLimitOrderRequest>(
		createBorrowLimitOrder,
	);
}

export function useCancelOrder() {
	const { getToken } = useAuthToken();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (orderId: string) => {
			const token = await getToken();
			return cancelOrder(token, orderId);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["portfolio"] });
		},
	});
}
