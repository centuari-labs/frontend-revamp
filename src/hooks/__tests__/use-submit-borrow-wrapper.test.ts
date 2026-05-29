import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockSubmitBorrowLimitOrder = vi.fn();
const mockSubmitBorrowMarketOrder = vi.fn();

vi.mock("@/lib/positions-adapter.api", () => ({
	submitBorrowLimitOrder: (...args: unknown[]) =>
		mockSubmitBorrowLimitOrder(...args),
	submitBorrowMarketOrder: (...args: unknown[]) =>
		mockSubmitBorrowMarketOrder(...args),
}));

import { useSubmitBorrow } from "@/hooks/use-submit-borrow";
import type {
	SubmitBorrowLimitParams,
	SubmitBorrowMarketParams,
} from "@/types/positions";

const baseBorrowFields = {
	tokenValue: "usdc",
	tokenLogo: "/tokens/usdc-icon.webp",
	tokenLabel: "USDC",
	maturity: Date.now() + 30 * 24 * 60 * 60 * 1000,
	collateralTokens: ["btc"],
};

let queryClient: QueryClient;
let wrapper: React.FC<{ children: React.ReactNode }>;

beforeEach(() => {
	vi.clearAllMocks();
	queryClient = new QueryClient({
		defaultOptions: { mutations: { retry: false } },
	});
	wrapper = ({ children }: { children: React.ReactNode }) =>
		React.createElement(QueryClientProvider, { client: queryClient }, children);
});

describe("useSubmitBorrow (thin wrapper)", () => {
	it("delegates submitLimit to submitBorrowLimitOrder", async () => {
		const position = { id: "borrow-1", type: "borrow" };
		mockSubmitBorrowLimitOrder.mockResolvedValue(position);

		const { result } = renderHook(() => useSubmitBorrow(), { wrapper });
		const marketIds = {
			assetId: "asset-1",
			marketId: "market-1",
			tokenSymbol: "USDC",
		};

		let returned: unknown;
		await act(async () => {
			returned = await result.current.submitLimit(
				{
					...baseBorrowFields,
					amount: 500,
					targetApr: 0.1,
				} satisfies SubmitBorrowLimitParams,
				{ token: "jwt", marketIds },
			);
		});

		expect(mockSubmitBorrowLimitOrder).toHaveBeenCalledWith(
			{ ...baseBorrowFields, amount: 500, targetApr: 0.1 },
			marketIds,
			"jwt",
		);
		expect(returned).toBe(position);
	});

	it("delegates submitMarket to submitBorrowMarketOrder", async () => {
		const position = {
			id: "borrow-2",
			type: "borrow",
			orderType: "market",
		};
		mockSubmitBorrowMarketOrder.mockResolvedValue(position);

		const { result } = renderHook(() => useSubmitBorrow(), { wrapper });
		const marketIds = {
			assetId: "asset-1",
			marketId: "market-1",
			tokenSymbol: "USDC",
		};

		let returned: unknown;
		await act(async () => {
			returned = await result.current.submitMarket(
				{
					...baseBorrowFields,
					amount: 300,
					collateralTokens: ["eth"],
				} satisfies SubmitBorrowMarketParams,
				{ token: "jwt", marketIds },
			);
		});

		expect(mockSubmitBorrowMarketOrder).toHaveBeenCalledWith(
			{ ...baseBorrowFields, amount: 300, collateralTokens: ["eth"] },
			marketIds,
			"jwt",
		);
		expect(returned).toBe(position);
	});

	it("invalidates queries on successful limit order", async () => {
		mockSubmitBorrowLimitOrder.mockResolvedValue({ id: "borrow-1" });
		const spy = vi.spyOn(queryClient, "invalidateQueries");
		const { result } = renderHook(() => useSubmitBorrow(), { wrapper });

		await act(async () => {
			await result.current.submitLimit(
				{
					...baseBorrowFields,
					amount: 500,
					targetApr: 0.1,
				} satisfies SubmitBorrowLimitParams,
				{
					token: "jwt",
					marketIds: {
						assetId: "a",
						marketId: "m",
						tokenSymbol: "USDC",
					},
				},
			);
		});

		expect(spy).toHaveBeenCalledTimes(8);
	});

	it("invalidates queries on successful market order", async () => {
		mockSubmitBorrowMarketOrder.mockResolvedValue({ id: "borrow-2" });
		const spy = vi.spyOn(queryClient, "invalidateQueries");
		const { result } = renderHook(() => useSubmitBorrow(), { wrapper });

		await act(async () => {
			await result.current.submitMarket(
				{
					...baseBorrowFields,
					amount: 300,
				} satisfies SubmitBorrowMarketParams,
				{
					token: "jwt",
					marketIds: {
						assetId: "a",
						marketId: "m",
						tokenSymbol: "USDC",
					},
				},
			);
		});

		expect(spy).toHaveBeenCalledTimes(8);
	});

	it("throws when options are missing", async () => {
		const { result } = renderHook(() => useSubmitBorrow(), { wrapper });

		await expect(
			act(async () => {
				await result.current.submitLimit({
					...baseBorrowFields,
					amount: 500,
					targetApr: 0.1,
				} satisfies SubmitBorrowLimitParams);
			}),
		).rejects.toThrow("Auth token and market IDs required");
	});
});
