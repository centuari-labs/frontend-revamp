"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	getMyPortfolio,
	getMyAssets,
	getLendBorrowAssets,
	getMyPositions,
	setAssetAsCollateral,
} from "@/lib/api";
import { useAuthToken } from "./use-auth-token";
import type {
	MyPortfolioResponse,
	MyAssetsResponse,
	LendBorrowAssetsResponse,
	MyPositionsResponse,
} from "@/types/api";

export function useMyPortfolio() {
	const { getToken, authenticated } = useAuthToken();
	return useQuery<MyPortfolioResponse>({
		queryKey: ["portfolio", "summary"],
		queryFn: async () => {
			const token = await getToken();
			return getMyPortfolio(token);
		},
		enabled: authenticated,
		staleTime: 30_000,
	});
}

export function useMyAssets(page = 1, limit = 10) {
	const { getToken, authenticated } = useAuthToken();
	return useQuery<MyAssetsResponse>({
		queryKey: ["portfolio", "assets", page, limit],
		queryFn: async () => {
			const token = await getToken();
			return getMyAssets(token, page, limit);
		},
		enabled: authenticated,
		staleTime: 30_000,
	});
}

export function useLendBorrowAssets() {
	const { getToken, authenticated } = useAuthToken();
	return useQuery<LendBorrowAssetsResponse>({
		queryKey: ["portfolio", "lend-borrow"],
		queryFn: async () => {
			const token = await getToken();
			return getLendBorrowAssets(token);
		},
		enabled: authenticated,
		staleTime: 30_000,
	});
}

export function useMyPositions(
	opts: { page?: number; limit?: number; type?: "LEND" | "BORROW" } = {},
) {
	const { getToken, authenticated } = useAuthToken();
	return useQuery<MyPositionsResponse>({
		queryKey: ["portfolio", "positions", opts],
		queryFn: async () => {
			const token = await getToken();
			return getMyPositions(token, opts);
		},
		enabled: authenticated,
		staleTime: 15_000,
	});
}

export function useSetCollateral() {
	const { getToken } = useAuthToken();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (params: {
			assetIds: string[];
			isCollateral: boolean;
		}) => {
			const token = await getToken();
			return setAssetAsCollateral(token, params);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["portfolio"] });
		},
	});
}
