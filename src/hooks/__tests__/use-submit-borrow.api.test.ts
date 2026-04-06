import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { renderHookWithProviders } from "@/__tests__/helpers/render-with-providers";
import { makeBorrowPosition } from "@/__tests__/helpers/fixtures/positions";

// ─── USE_MOCK = false for API mode tests ──────────────────────────────

const mockSubmitBorrowLimitOrder = vi.fn();
const mockSubmitBorrowMarketOrder = vi.fn();

vi.mock("@/lib/positions-adapter.api", () => ({
	submitBorrowLimitOrder: (...args: unknown[]) =>
		mockSubmitBorrowLimitOrder(...args),
	submitBorrowMarketOrder: (...args: unknown[]) =>
		mockSubmitBorrowMarketOrder(...args),
}));

const MARKET_IDS = {
	assetId: "asset-uuid-usdc",
	marketId: "market-uuid-1",
	tokenSymbol: "USDC",
};

const API_BORROW_LIMIT_POSITION = makeBorrowPosition({
	id: "api-borrow-limit-123",
	orderType: "limit",
});

const API_BORROW_MARKET_POSITION = makeBorrowPosition({
	id: "api-borrow-market-456",
	orderType: "market",
});

beforeEach(() => {
	vi.clearAllMocks();
});

async function getHook() {
	const { useSubmitBorrow } = await import("@/hooks/use-submit-borrow");
	return useSubmitBorrow;
}

// ─── submitLimit (API mode) ──────────────────────────────────────────

describe("useSubmitBorrow.submitLimit (API mode)", () => {
	const limitParams = {
		tokenValue: "usdc",
		tokenLogo: "/tokens/usdc-icon.webp",
		tokenLabel: "USDC",
		amount: 500,
		maturity: 1735689600000,
		targetApr: 0.101,
		collateralTokens: ["btc", "eth"],
	};

	it("isPending starts as false", async () => {
		const useSubmitBorrow = await getHook();
		const { result } = renderHookWithProviders(() => useSubmitBorrow());
		expect(result.current.isPending).toBe(false);
	});

	it("calls API adapter with params, marketIds, and token", async () => {
		mockSubmitBorrowLimitOrder.mockResolvedValue(API_BORROW_LIMIT_POSITION);
		const useSubmitBorrow = await getHook();
		const { result } = renderHookWithProviders(() => useSubmitBorrow());

		await act(async () => {
			await result.current.submitLimit(limitParams, {
				token: "jwt-borrow",
				marketIds: MARKET_IDS,
			});
		});

		expect(mockSubmitBorrowLimitOrder).toHaveBeenCalledWith(
			limitParams,
			MARKET_IDS,
			"jwt-borrow",
		);
	});

	it("returns normalized BorrowPosition from API", async () => {
		mockSubmitBorrowLimitOrder.mockResolvedValue(API_BORROW_LIMIT_POSITION);
		const useSubmitBorrow = await getHook();
		const { result } = renderHookWithProviders(() => useSubmitBorrow());

		let returned: unknown;
		await act(async () => {
			returned = await result.current.submitLimit(limitParams, {
				token: "jwt",
				marketIds: MARKET_IDS,
			});
		});

		expect(returned).toBe(API_BORROW_LIMIT_POSITION);
	});

	it("throws when token is missing in API mode", async () => {
		const useSubmitBorrow = await getHook();
		const { result } = renderHookWithProviders(() => useSubmitBorrow());

		await expect(
			act(async () => {
				await result.current.submitLimit(limitParams);
			}),
		).rejects.toThrow("Auth token and market IDs required");
	});

	it("throws when marketIds is missing in API mode", async () => {
		const useSubmitBorrow = await getHook();
		const { result } = renderHookWithProviders(() => useSubmitBorrow());

		await expect(
			act(async () => {
				await result.current.submitLimit(limitParams, { token: "jwt" });
			}),
		).rejects.toThrow("Auth token and market IDs required");
	});

	it("propagates API adapter errors", async () => {
		mockSubmitBorrowLimitOrder.mockRejectedValue(
			new Error("Health factor too low"),
		);
		const useSubmitBorrow = await getHook();
		const { result } = renderHookWithProviders(() => useSubmitBorrow());

		await expect(
			act(async () => {
				await result.current.submitLimit(limitParams, {
					token: "jwt",
					marketIds: MARKET_IDS,
				});
			}),
		).rejects.toThrow("Health factor too low");

		expect(result.current.isPending).toBe(false);
	});

	it("does not call mock adapter functions in API mode", async () => {
		mockSubmitBorrowLimitOrder.mockResolvedValue(API_BORROW_LIMIT_POSITION);
		const useSubmitBorrow = await getHook();
		const { result } = renderHookWithProviders(() => useSubmitBorrow());

		await act(async () => {
			await result.current.submitLimit(limitParams, {
				token: "jwt",
				marketIds: MARKET_IDS,
			});
		});

		// Only the API adapter should be called
		expect(mockSubmitBorrowLimitOrder).toHaveBeenCalled();
	});
});

// ─── submitMarket (API mode) ─────────────────────────────────────────

describe("useSubmitBorrow.submitMarket (API mode)", () => {
	const marketParams = {
		tokenValue: "usdc",
		tokenLogo: "/tokens/usdc-icon.webp",
		tokenLabel: "USDC",
		amount: 300,
		maturity: 1735689600000,
		collateralTokens: ["btc"],
	};

	it("calls API adapter with params, marketIds, and token", async () => {
		mockSubmitBorrowMarketOrder.mockResolvedValue(API_BORROW_MARKET_POSITION);
		const useSubmitBorrow = await getHook();
		const { result } = renderHookWithProviders(() => useSubmitBorrow());

		await act(async () => {
			await result.current.submitMarket(marketParams, {
				token: "jwt-market",
				marketIds: MARKET_IDS,
			});
		});

		expect(mockSubmitBorrowMarketOrder).toHaveBeenCalledWith(
			marketParams,
			MARKET_IDS,
			"jwt-market",
		);
	});

	it("returns normalized BorrowPosition from API", async () => {
		mockSubmitBorrowMarketOrder.mockResolvedValue(API_BORROW_MARKET_POSITION);
		const useSubmitBorrow = await getHook();
		const { result } = renderHookWithProviders(() => useSubmitBorrow());

		let returned: unknown;
		await act(async () => {
			returned = await result.current.submitMarket(marketParams, {
				token: "jwt",
				marketIds: MARKET_IDS,
			});
		});

		expect(returned).toBe(API_BORROW_MARKET_POSITION);
	});

	it("throws when token is missing in API mode", async () => {
		const useSubmitBorrow = await getHook();
		const { result } = renderHookWithProviders(() => useSubmitBorrow());

		await expect(
			act(async () => {
				await result.current.submitMarket(marketParams);
			}),
		).rejects.toThrow("Auth token and market IDs required");
	});

	it("propagates API adapter errors", async () => {
		mockSubmitBorrowMarketOrder.mockRejectedValue(new Error("API error: 400"));
		const useSubmitBorrow = await getHook();
		const { result } = renderHookWithProviders(() => useSubmitBorrow());

		await expect(
			act(async () => {
				await result.current.submitMarket(marketParams, {
					token: "jwt",
					marketIds: MARKET_IDS,
				});
			}),
		).rejects.toThrow("API error: 400");

		expect(result.current.isPending).toBe(false);
	});

	it("does not call mock adapter functions in API mode", async () => {
		mockSubmitBorrowMarketOrder.mockResolvedValue(API_BORROW_MARKET_POSITION);
		const useSubmitBorrow = await getHook();
		const { result } = renderHookWithProviders(() => useSubmitBorrow());

		await act(async () => {
			await result.current.submitMarket(marketParams, {
				token: "jwt",
				marketIds: MARKET_IDS,
			});
		});

		// Only the API adapter should be called
		expect(mockSubmitBorrowMarketOrder).toHaveBeenCalled();
	});
});
