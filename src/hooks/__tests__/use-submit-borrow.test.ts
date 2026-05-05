import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { renderHookWithProviders } from "@/__tests__/helpers/render-with-providers";
import { makeBorrowPosition } from "@/__tests__/helpers/fixtures/positions";

const mockSubmitBorrowLimitOrder = vi.fn();
const mockSubmitBorrowMarketOrder = vi.fn();

vi.mock("@/lib/positions-adapter.api", () => ({
	submitBorrowLimitOrder: (...args: unknown[]) =>
		mockSubmitBorrowLimitOrder(...args),
	submitBorrowMarketOrder: (...args: unknown[]) =>
		mockSubmitBorrowMarketOrder(...args),
}));

import { useSubmitBorrow } from "@/hooks/use-submit-borrow";

const MARKET_IDS = {
	assetId: "asset-uuid-usdc",
	marketId: "market-uuid-1",
	tokenSymbol: "USDC",
};

beforeEach(() => {
	vi.clearAllMocks();
});

describe("useSubmitBorrow", () => {
	it("isPending starts as false", () => {
		const { result } = renderHookWithProviders(() => useSubmitBorrow());
		expect(result.current.isPending).toBe(false);
	});

	it("submitLimit calls submitBorrowLimitOrder for new order", async () => {
		const position = makeBorrowPosition({ orderType: "limit" });
		mockSubmitBorrowLimitOrder.mockResolvedValue(position);
		const { result } = renderHookWithProviders(() => useSubmitBorrow());

		await act(async () => {
			await result.current.submitLimit(
				{
					tokenValue: "usdt",
					tokenLogo: "/tokens/centuari-usdt.png",
					tokenLabel: "USDT",
					amount: 500,
					maturity: 1000,
					targetApr: 0.1,
					collateralTokens: ["btc"],
				},
				{ token: "jwt", marketIds: MARKET_IDS },
			);
		});

		expect(mockSubmitBorrowLimitOrder).toHaveBeenCalled();
		expect(result.current.isPending).toBe(false);
	});

	it("submitLimit passes params, marketIds, and token to API adapter", async () => {
		const position = makeBorrowPosition({ id: "edit-b1", orderType: "limit" });
		mockSubmitBorrowLimitOrder.mockResolvedValue(position);
		const { result } = renderHookWithProviders(() => useSubmitBorrow());

		const params = {
			tokenValue: "usdt",
			tokenLogo: "/tokens/centuari-usdt.png",
			tokenLabel: "USDT",
			amount: 600,
			maturity: 1000,
			targetApr: 0.11,
			collateralTokens: ["btc"],
		};

		await act(async () => {
			await result.current.submitLimit(params, {
				token: "jwt",
				marketIds: MARKET_IDS,
			});
		});

		expect(mockSubmitBorrowLimitOrder).toHaveBeenCalledWith(
			params,
			MARKET_IDS,
			"jwt",
		);
	});

	it("submitMarket calls submitBorrowMarketOrder for new order", async () => {
		const position = makeBorrowPosition({ orderType: "market" });
		mockSubmitBorrowMarketOrder.mockResolvedValue(position);
		const { result } = renderHookWithProviders(() => useSubmitBorrow());

		await act(async () => {
			await result.current.submitMarket(
				{
					tokenValue: "usdc",
					tokenLogo: "/tokens/usdc-icon.webp",
					tokenLabel: "USDC",
					amount: 300,
					maturity: 2000,
					collateralTokens: ["eth"],
				},
				{ token: "jwt", marketIds: MARKET_IDS },
			);
		});

		expect(mockSubmitBorrowMarketOrder).toHaveBeenCalled();
	});

	it("submitMarket passes params, marketIds, and token to API adapter", async () => {
		const position = makeBorrowPosition({ id: "edit-b2", orderType: "market" });
		mockSubmitBorrowMarketOrder.mockResolvedValue(position);
		const { result } = renderHookWithProviders(() => useSubmitBorrow());

		const params = {
			tokenValue: "usdc",
			tokenLogo: "/tokens/usdc-icon.webp",
			tokenLabel: "USDC",
			amount: 300,
			maturity: 2000,
			collateralTokens: ["eth"],
		};

		await act(async () => {
			await result.current.submitMarket(params, {
				token: "jwt",
				marketIds: MARKET_IDS,
			});
		});

		expect(mockSubmitBorrowMarketOrder).toHaveBeenCalledWith(
			params,
			MARKET_IDS,
			"jwt",
		);
	});
});
