import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { renderHookWithProviders } from "@/__tests__/helpers/render-with-providers";
import { makeLendPosition } from "@/__tests__/helpers/fixtures/positions";

const mockSubmitLendLimitOrder = vi.fn();
const mockSubmitLendMarketOrder = vi.fn();

vi.mock("@/lib/positions-adapter.api", () => ({
	submitLendLimitOrder: (...args: unknown[]) =>
		mockSubmitLendLimitOrder(...args),
	submitLendMarketOrder: (...args: unknown[]) =>
		mockSubmitLendMarketOrder(...args),
}));

import { useSubmitLend } from "@/hooks/use-submit-lend";

const MARKET_IDS = {
	assetId: "asset-uuid-usdc",
	marketId:
		"0xc000000000000000000000000000000000000000000000000000000000000001",
	tokenSymbol: "USDC",
};

beforeEach(() => {
	vi.clearAllMocks();
});

describe("useSubmitLend", () => {
	it("isPending starts as false", () => {
		const { result } = renderHookWithProviders(() => useSubmitLend());
		expect(result.current.isPending).toBe(false);
	});

	it("submitLimit calls submitLendLimitOrder for new order", async () => {
		const position = makeLendPosition({ orderType: "limit" });
		mockSubmitLendLimitOrder.mockResolvedValue(position);
		const { result } = renderHookWithProviders(() => useSubmitLend());

		await act(async () => {
			await result.current.submitLimit(
				{
					tokenValue: "usdc",
					tokenLogo: "/tokens/usdc-icon.webp",
					tokenLabel: "USDC",
					amount: 100,
					amountInUsd: 100,
					targetApr: 0.065,
					maturity: 1000,
					autoRollover: true,
				},
				{ token: "jwt", marketIds: MARKET_IDS },
			);
		});

		expect(mockSubmitLendLimitOrder).toHaveBeenCalled();
		expect(result.current.isPending).toBe(false);
	});

	it("submitLimit passes params, marketIds, and token to API adapter", async () => {
		const position = makeLendPosition({ id: "edit-1", orderType: "limit" });
		mockSubmitLendLimitOrder.mockResolvedValue(position);
		const { result } = renderHookWithProviders(() => useSubmitLend());

		const params = {
			tokenValue: "usdc",
			tokenLogo: "/tokens/usdc-icon.webp",
			tokenLabel: "USDC",
			amount: 200,
			amountInUsd: 200,
			targetApr: 0.07,
			maturity: 1000,
			autoRollover: true,
		};

		await act(async () => {
			await result.current.submitLimit(params, {
				token: "jwt",
				marketIds: MARKET_IDS,
			});
		});

		expect(mockSubmitLendLimitOrder).toHaveBeenCalledWith(
			params,
			MARKET_IDS,
			"jwt",
		);
	});

	it("submitMarket calls submitLendMarketOrder for new order", async () => {
		const position = makeLendPosition({ orderType: "market" });
		mockSubmitLendMarketOrder.mockResolvedValue(position);
		const { result } = renderHookWithProviders(() => useSubmitLend());

		await act(async () => {
			await result.current.submitMarket(
				{
					tokenValue: "usdc",
					tokenLogo: "/tokens/usdc-icon.webp",
					tokenLabel: "USDC",
					amount: 500,
					amountInUsd: 500,
					maturity: 2000,
				},
				{ token: "jwt", marketIds: MARKET_IDS },
			);
		});

		expect(mockSubmitLendMarketOrder).toHaveBeenCalled();
	});

	it("submitMarket passes params, marketIds, and token to API adapter", async () => {
		const position = makeLendPosition({ id: "edit-2", orderType: "market" });
		mockSubmitLendMarketOrder.mockResolvedValue(position);
		const { result } = renderHookWithProviders(() => useSubmitLend());

		const params = {
			tokenValue: "usdc",
			tokenLogo: "/tokens/usdc-icon.webp",
			tokenLabel: "USDC",
			amount: 500,
			amountInUsd: 500,
			maturity: 2000,
		};

		await act(async () => {
			await result.current.submitMarket(params, {
				token: "jwt",
				marketIds: MARKET_IDS,
			});
		});

		expect(mockSubmitLendMarketOrder).toHaveBeenCalledWith(
			params,
			MARKET_IDS,
			"jwt",
		);
	});
});
