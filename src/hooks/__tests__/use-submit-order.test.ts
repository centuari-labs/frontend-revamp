import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useSubmitOrder } from "@/hooks/use-submit-order";
import { QUERY_KEYS } from "@/lib/query-keys";

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

const mockLimitFn = vi.fn();
const mockMarketFn = vi.fn();

describe("useSubmitOrder", () => {
	it("returns submitLimit, submitMarket, and isPending", () => {
		const { result } = renderHook(
			() => useSubmitOrder(mockLimitFn, mockMarketFn),
			{ wrapper },
		);

		expect(result.current).toHaveProperty("submitLimit");
		expect(result.current).toHaveProperty("submitMarket");
		expect(result.current).toHaveProperty("isPending");
		expect(typeof result.current.submitLimit).toBe("function");
		expect(typeof result.current.submitMarket).toBe("function");
	});

	it("isPending starts as false", () => {
		const { result } = renderHook(
			() => useSubmitOrder(mockLimitFn, mockMarketFn),
			{ wrapper },
		);
		expect(result.current.isPending).toBe(false);
	});

	describe("submitLimit", () => {
		it("calls limitFn with params, marketIds, and token", async () => {
			mockLimitFn.mockResolvedValue({ id: "order-1" });
			const { result } = renderHook(
				() => useSubmitOrder(mockLimitFn, mockMarketFn),
				{ wrapper },
			);

			const params = { amount: 100, rate: 0.05 };
			const marketIds = {
				assetId: "asset-1",
				marketId: "market-1",
				tokenSymbol: "USDC",
			};

			await act(async () => {
				await result.current.submitLimit(params, {
					token: "jwt-123",
					marketIds,
				});
			});

			expect(mockLimitFn).toHaveBeenCalledWith(params, marketIds, "jwt-123");
		});

		it("returns the result from limitFn", async () => {
			const expected = { id: "order-1", status: "created" };
			mockLimitFn.mockResolvedValue(expected);
			const { result } = renderHook(
				() => useSubmitOrder(mockLimitFn, mockMarketFn),
				{ wrapper },
			);

			let returned: unknown;
			await act(async () => {
				returned = await result.current.submitLimit(
					{ amount: 100 },
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

			expect(returned).toBe(expected);
		});

		it("throws when token is missing", async () => {
			const { result } = renderHook(
				() => useSubmitOrder(mockLimitFn, mockMarketFn),
				{ wrapper },
			);

			await expect(
				act(async () => {
					await result.current.submitLimit(
						{ amount: 100 },
						{
							marketIds: {
								assetId: "a",
								marketId: "m",
								tokenSymbol: "USDC",
							},
						},
					);
				}),
			).rejects.toThrow("Auth token and market IDs required");
		});

		it("throws when marketIds is missing", async () => {
			const { result } = renderHook(
				() => useSubmitOrder(mockLimitFn, mockMarketFn),
				{ wrapper },
			);

			await expect(
				act(async () => {
					await result.current.submitLimit(
						{ amount: 100 },
						{ token: "jwt" },
					);
				}),
			).rejects.toThrow("Auth token and market IDs required");
		});

		it("throws when no options provided", async () => {
			const { result } = renderHook(
				() => useSubmitOrder(mockLimitFn, mockMarketFn),
				{ wrapper },
			);

			await expect(
				act(async () => {
					await result.current.submitLimit({ amount: 100 });
				}),
			).rejects.toThrow("Auth token and market IDs required");
		});

		it("invalidates all user queries on success", async () => {
			mockLimitFn.mockResolvedValue({ id: "order-1" });
			const spy = vi.spyOn(queryClient, "invalidateQueries");
			const { result } = renderHook(
				() => useSubmitOrder(mockLimitFn, mockMarketFn),
				{ wrapper },
			);

			await act(async () => {
				await result.current.submitLimit(
					{ amount: 100 },
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
			expect(spy).toHaveBeenCalledWith({
				queryKey: [QUERY_KEYS.MY_ASSETS],
			});
			expect(spy).toHaveBeenCalledWith({
				queryKey: [QUERY_KEYS.MY_PORTFOLIO],
			});
			expect(spy).toHaveBeenCalledWith({
				queryKey: [QUERY_KEYS.LEND_BORROW_ASSETS],
			});
			expect(spy).toHaveBeenCalledWith({
				queryKey: [QUERY_KEYS.MY_POSITIONS],
			});
			expect(spy).toHaveBeenCalledWith({
				queryKey: [QUERY_KEYS.OPEN_ORDERS],
			});
			expect(spy).toHaveBeenCalledWith({
				queryKey: [QUERY_KEYS.ORDER_HISTORY],
			});
			expect(spy).toHaveBeenCalledWith({
				queryKey: [QUERY_KEYS.USER_DETAILS],
			});
		});

		it("does not invalidate on failure", async () => {
			mockLimitFn.mockRejectedValue(new Error("API error"));
			const spy = vi.spyOn(queryClient, "invalidateQueries");
			const { result } = renderHook(
				() => useSubmitOrder(mockLimitFn, mockMarketFn),
				{ wrapper },
			);

			await expect(
				act(async () => {
					await result.current.submitLimit(
						{ amount: 100 },
						{
							token: "jwt",
							marketIds: {
								assetId: "a",
								marketId: "m",
								tokenSymbol: "USDC",
							},
						},
					);
				}),
			).rejects.toThrow("API error");

			expect(spy).not.toHaveBeenCalled();
		});

		it("propagates errors from limitFn", async () => {
			mockLimitFn.mockRejectedValue(new Error("Unauthorized"));
			const { result } = renderHook(
				() => useSubmitOrder(mockLimitFn, mockMarketFn),
				{ wrapper },
			);

			await expect(
				act(async () => {
					await result.current.submitLimit(
						{ amount: 100 },
						{
							token: "jwt",
							marketIds: {
								assetId: "a",
								marketId: "m",
								tokenSymbol: "USDC",
							},
						},
					);
				}),
			).rejects.toThrow("Unauthorized");
		});
	});

	describe("submitMarket", () => {
		it("calls marketFn with params, marketIds, and token", async () => {
			mockMarketFn.mockResolvedValue({ id: "market-order-1" });
			const { result } = renderHook(
				() => useSubmitOrder(mockLimitFn, mockMarketFn),
				{ wrapper },
			);

			const params = { amount: 500 };
			const marketIds = {
				assetId: "asset-1",
				marketId: "market-1",
				tokenSymbol: "USDC",
			};

			await act(async () => {
				await result.current.submitMarket(params, {
					token: "jwt-456",
					marketIds,
				});
			});

			expect(mockMarketFn).toHaveBeenCalledWith(
				params,
				marketIds,
				"jwt-456",
			);
			expect(mockLimitFn).not.toHaveBeenCalled();
		});

		it("returns the result from marketFn", async () => {
			const expected = { id: "market-1", status: "filled" };
			mockMarketFn.mockResolvedValue(expected);
			const { result } = renderHook(
				() => useSubmitOrder(mockLimitFn, mockMarketFn),
				{ wrapper },
			);

			let returned: unknown;
			await act(async () => {
				returned = await result.current.submitMarket(
					{ amount: 500 },
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

			expect(returned).toBe(expected);
		});

		it("throws when token is missing", async () => {
			const { result } = renderHook(
				() => useSubmitOrder(mockLimitFn, mockMarketFn),
				{ wrapper },
			);

			await expect(
				act(async () => {
					await result.current.submitMarket(
						{ amount: 500 },
						{
							marketIds: {
								assetId: "a",
								marketId: "m",
								tokenSymbol: "USDC",
							},
						},
					);
				}),
			).rejects.toThrow("Auth token and market IDs required");
		});

		it("invalidates all user queries on success", async () => {
			mockMarketFn.mockResolvedValue({ id: "market-1" });
			const spy = vi.spyOn(queryClient, "invalidateQueries");
			const { result } = renderHook(
				() => useSubmitOrder(mockLimitFn, mockMarketFn),
				{ wrapper },
			);

			await act(async () => {
				await result.current.submitMarket(
					{ amount: 500 },
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

	describe("isPending", () => {
		it("reflects pending state during limit submission", async () => {
			let resolveFn: (value: unknown) => void;
			mockLimitFn.mockReturnValue(
				new Promise((resolve) => {
					resolveFn = resolve;
				}),
			);

			const { result } = renderHook(
				() => useSubmitOrder(mockLimitFn, mockMarketFn),
				{ wrapper },
			);

			const promise = await act(async () => {
				const p = result.current.submitLimit(
					{ amount: 100 },
					{
						token: "jwt",
						marketIds: {
							assetId: "a",
							marketId: "m",
							tokenSymbol: "USDC",
						},
					},
				);
				resolveFn!({ id: "done" });
				return p;
			});

			expect(result.current.isPending).toBe(false);
		});

		it("resets to false after failed submission", async () => {
			mockLimitFn.mockRejectedValue(new Error("fail"));
			const { result } = renderHook(
				() => useSubmitOrder(mockLimitFn, mockMarketFn),
				{ wrapper },
			);

			await expect(
				act(async () => {
					await result.current.submitLimit(
						{ amount: 100 },
						{
							token: "jwt",
							marketIds: {
								assetId: "a",
								marketId: "m",
								tokenSymbol: "USDC",
							},
						},
					);
				}),
			).rejects.toThrow();

			expect(result.current.isPending).toBe(false);
		});
	});
});
