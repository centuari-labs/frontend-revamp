import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockSubmitLendLimitOrder = vi.fn();
const mockSubmitLendMarketOrder = vi.fn();

vi.mock("@/lib/positions-adapter.api", () => ({
	submitLendLimitOrder: (...args: unknown[]) =>
		mockSubmitLendLimitOrder(...args),
	submitLendMarketOrder: (...args: unknown[]) =>
		mockSubmitLendMarketOrder(...args),
}));

import { useSubmitLend } from "@/hooks/use-submit-lend";
import type {
	SubmitLendLimitParams,
	SubmitLendMarketParams,
} from "@/types/positions";

const baseLendFields = {
	tokenValue: "usdc",
	tokenLogo: "/tokens/usdc-icon.webp",
	tokenLabel: "USDC",
	amountInUsd: 100,
	maturity: Date.now() + 30 * 24 * 60 * 60 * 1000,
	autoRollover: false,
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

describe("useSubmitLend (thin wrapper)", () => {
	it("delegates submitLimit to submitLendLimitOrder", async () => {
		const position = { id: "lend-1", type: "lend" };
		mockSubmitLendLimitOrder.mockResolvedValue(position);

		const { result } = renderHook(() => useSubmitLend(), { wrapper });
		const marketIds = {
			assetId: "asset-1",
			marketId: "market-1",
			tokenSymbol: "USDC",
		};

		let returned: unknown;
		await act(async () => {
			returned = await result.current.submitLimit(
				{
					...baseLendFields,
					amount: 100,
					targetApr: 0.05,
				} satisfies SubmitLendLimitParams,
				{ token: "jwt", marketIds },
			);
		});

		expect(mockSubmitLendLimitOrder).toHaveBeenCalledWith(
			{ ...baseLendFields, amount: 100, targetApr: 0.05 },
			marketIds,
			"jwt",
		);
		expect(returned).toBe(position);
	});

	it("delegates submitMarket to submitLendMarketOrder", async () => {
		const position = { id: "lend-2", type: "lend", orderType: "market" };
		mockSubmitLendMarketOrder.mockResolvedValue(position);

		const { result } = renderHook(() => useSubmitLend(), { wrapper });
		const marketIds = {
			assetId: "asset-1",
			marketId: "market-1",
			tokenSymbol: "USDC",
		};

		let returned: unknown;
		await act(async () => {
			returned = await result.current.submitMarket(
				{
					...baseLendFields,
					amount: 500,
				} satisfies SubmitLendMarketParams,
				{ token: "jwt", marketIds },
			);
		});

		expect(mockSubmitLendMarketOrder).toHaveBeenCalledWith(
			{ ...baseLendFields, amount: 500 },
			marketIds,
			"jwt",
		);
		expect(returned).toBe(position);
	});

	it("invalidates queries on successful limit order", async () => {
		mockSubmitLendLimitOrder.mockResolvedValue({ id: "lend-1" });
		const spy = vi.spyOn(queryClient, "invalidateQueries");
		const { result } = renderHook(() => useSubmitLend(), { wrapper });

		await act(async () => {
			await result.current.submitLimit(
				{
					...baseLendFields,
					amount: 100,
					targetApr: 0.05,
				} satisfies SubmitLendLimitParams,
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

		expect(spy).toHaveBeenCalledTimes(7);
	});

	it("invalidates queries on successful market order", async () => {
		mockSubmitLendMarketOrder.mockResolvedValue({ id: "lend-2" });
		const spy = vi.spyOn(queryClient, "invalidateQueries");
		const { result } = renderHook(() => useSubmitLend(), { wrapper });

		await act(async () => {
			await result.current.submitMarket(
				{
					...baseLendFields,
					amount: 500,
				} satisfies SubmitLendMarketParams,
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

		expect(spy).toHaveBeenCalledTimes(7);
	});
});
