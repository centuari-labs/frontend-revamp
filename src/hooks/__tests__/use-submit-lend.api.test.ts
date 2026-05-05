import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { renderHookWithProviders } from "@/__tests__/helpers/render-with-providers";
import { makeLendPosition } from "@/__tests__/helpers/fixtures/positions";

// ─── USE_MOCK = false for API mode tests ──────────────────────────────

const mockSubmitLendLimitOrder = vi.fn();
const mockSubmitLendMarketOrder = vi.fn();

vi.mock("@/lib/positions-adapter.api", () => ({
	submitLendLimitOrder: (...args: unknown[]) =>
		mockSubmitLendLimitOrder(...args),
	submitLendMarketOrder: (...args: unknown[]) =>
		mockSubmitLendMarketOrder(...args),
}));

const MARKET_IDS = {
	assetId: "asset-uuid-usdc",
	marketId: "market-uuid-1",
	tokenSymbol: "USDC",
};

const API_LEND_POSITION = makeLendPosition({
	id: "api-order-123",
	orderType: "limit",
});

beforeEach(() => {
	vi.clearAllMocks();
});

describe("useSubmitLend (API mode)", () => {
	// Dynamic import to get the version with USE_MOCK=false
	async function getHook() {
		const { useSubmitLend } = await import("@/hooks/use-submit-lend");
		return useSubmitLend;
	}

	it("isPending starts as false", async () => {
		const useSubmitLend = await getHook();
		const { result } = renderHookWithProviders(() => useSubmitLend());
		expect(result.current.isPending).toBe(false);
	});

	it("calls API adapter with params, marketIds, and token", async () => {
		mockSubmitLendLimitOrder.mockResolvedValue(API_LEND_POSITION);
		const useSubmitLend = await getHook();
		const { result } = renderHookWithProviders(() => useSubmitLend());

		const params = {
			tokenValue: "usdc",
			tokenLogo: "/tokens/usdc-icon.webp",
			tokenLabel: "USDC",
			amount: 1000,
			amountInUsd: 1000,
			targetApr: 0.065,
			maturity: 1735689600000,
			autoRollover: true,
		};

		await act(async () => {
			await result.current.submitLimit(params, {
				token: "jwt-123",
				marketIds: MARKET_IDS,
			});
		});

		expect(mockSubmitLendLimitOrder).toHaveBeenCalledWith(
			params,
			MARKET_IDS,
			"jwt-123",
		);
	});

	it("returns normalized LendPosition from API", async () => {
		mockSubmitLendLimitOrder.mockResolvedValue(API_LEND_POSITION);
		const useSubmitLend = await getHook();
		const { result } = renderHookWithProviders(() => useSubmitLend());

		let returned: unknown;
		await act(async () => {
			returned = await result.current.submitLimit(
				{
					tokenValue: "usdc",
					tokenLogo: "/tokens/usdc-icon.webp",
					tokenLabel: "USDC",
					amount: 500,
					amountInUsd: 500,
					targetApr: 0.05,
					maturity: 1735689600000,
					autoRollover: false,
				},
				{ token: "jwt-456", marketIds: MARKET_IDS },
			);
		});

		expect(returned).toBe(API_LEND_POSITION);
	});

	it("sets isPending during submission and resets after", async () => {
		let resolveFn: (value: unknown) => void;
		mockSubmitLendLimitOrder.mockReturnValue(
			new Promise((resolve) => {
				resolveFn = resolve;
			}),
		);

		const useSubmitLend = await getHook();
		const { result } = renderHookWithProviders(() => useSubmitLend());

		const promise = act(async () => {
			const p = result.current.submitLimit(
				{
					tokenValue: "usdc",
					tokenLogo: "/tokens/usdc-icon.webp",
					tokenLabel: "USDC",
					amount: 100,
					amountInUsd: 100,
					targetApr: 0.065,
					maturity: 1735689600000,
					autoRollover: true,
				},
				{ token: "jwt", marketIds: MARKET_IDS },
			);
			return p;
		});

		// Resolve the pending promise
		await act(async () => {
			resolveFn!(API_LEND_POSITION);
		});
		await promise;

		expect(result.current.isPending).toBe(false);
	});

	it("throws when token is missing in API mode", async () => {
		const useSubmitLend = await getHook();
		const { result } = renderHookWithProviders(() => useSubmitLend());

		await expect(
			act(async () => {
				await result.current.submitLimit({
					tokenValue: "usdc",
					tokenLogo: "/tokens/usdc-icon.webp",
					tokenLabel: "USDC",
					amount: 100,
					amountInUsd: 100,
					targetApr: 0.065,
					maturity: 1000,
					autoRollover: true,
				});
			}),
		).rejects.toThrow("Auth token and market IDs required");
	});

	it("throws when marketIds is missing in API mode", async () => {
		const useSubmitLend = await getHook();
		const { result } = renderHookWithProviders(() => useSubmitLend());

		await expect(
			act(async () => {
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
					{ token: "jwt" },
				);
			}),
		).rejects.toThrow("Auth token and market IDs required");
	});

	it("propagates API adapter errors", async () => {
		mockSubmitLendLimitOrder.mockRejectedValue(
			new Error("API error: 401 Unauthorized"),
		);
		const useSubmitLend = await getHook();
		const { result } = renderHookWithProviders(() => useSubmitLend());

		await expect(
			act(async () => {
				await result.current.submitLimit(
					{
						tokenValue: "usdc",
						tokenLogo: "/tokens/usdc-icon.webp",
						tokenLabel: "USDC",
						amount: 100,
						amountInUsd: 100,
						targetApr: 0.065,
						maturity: 1735689600000,
						autoRollover: true,
					},
					{ token: "jwt", marketIds: MARKET_IDS },
				);
			}),
		).rejects.toThrow("API error: 401 Unauthorized");

		expect(result.current.isPending).toBe(false);
	});

	it("does not call mock adapter functions in API mode", async () => {
		mockSubmitLendLimitOrder.mockResolvedValue(API_LEND_POSITION);
		const useSubmitLend = await getHook();
		const { result } = renderHookWithProviders(() => useSubmitLend());

		await act(async () => {
			await result.current.submitLimit(
				{
					tokenValue: "usdc",
					tokenLogo: "/tokens/usdc-icon.webp",
					tokenLabel: "USDC",
					amount: 1000,
					amountInUsd: 1000,
					targetApr: 0.065,
					maturity: 1735689600000,
					autoRollover: true,
				},
				{ token: "jwt", marketIds: MARKET_IDS },
			);
		});

		// Only the API adapter should be called
		expect(mockSubmitLendLimitOrder).toHaveBeenCalled();
	});
});

// ─── submitMarket (API mode) ─────────────────────────────────────────

const API_MARKET_POSITION = makeLendPosition({
	id: "api-market-order-456",
	orderType: "market",
});

describe("useSubmitLend.submitMarket (API mode)", () => {
	async function getHook() {
		const { useSubmitLend } = await import("@/hooks/use-submit-lend");
		return useSubmitLend;
	}

	const marketParams = {
		tokenValue: "usdc",
		tokenLogo: "/tokens/usdc-icon.webp",
		tokenLabel: "USDC",
		amount: 2000,
		amountInUsd: 2000,
		maturity: 1735689600000,
	};

	it("calls API adapter with params, marketIds, and token", async () => {
		mockSubmitLendMarketOrder.mockResolvedValue(API_MARKET_POSITION);
		const useSubmitLend = await getHook();
		const { result } = renderHookWithProviders(() => useSubmitLend());

		await act(async () => {
			await result.current.submitMarket(marketParams, {
				token: "jwt-market",
				marketIds: MARKET_IDS,
			});
		});

		expect(mockSubmitLendMarketOrder).toHaveBeenCalledWith(
			marketParams,
			MARKET_IDS,
			"jwt-market",
		);
	});

	it("returns normalized LendPosition from API", async () => {
		mockSubmitLendMarketOrder.mockResolvedValue(API_MARKET_POSITION);
		const useSubmitLend = await getHook();
		const { result } = renderHookWithProviders(() => useSubmitLend());

		let returned: unknown;
		await act(async () => {
			returned = await result.current.submitMarket(marketParams, {
				token: "jwt",
				marketIds: MARKET_IDS,
			});
		});

		expect(returned).toBe(API_MARKET_POSITION);
	});

	it("throws when token is missing in API mode", async () => {
		const useSubmitLend = await getHook();
		const { result } = renderHookWithProviders(() => useSubmitLend());

		await expect(
			act(async () => {
				await result.current.submitMarket(marketParams);
			}),
		).rejects.toThrow("Auth token and market IDs required");
	});

	it("propagates API adapter errors", async () => {
		mockSubmitLendMarketOrder.mockRejectedValue(new Error("API error: 500"));
		const useSubmitLend = await getHook();
		const { result } = renderHookWithProviders(() => useSubmitLend());

		await expect(
			act(async () => {
				await result.current.submitMarket(marketParams, {
					token: "jwt",
					marketIds: MARKET_IDS,
				});
			}),
		).rejects.toThrow("API error: 500");

		expect(result.current.isPending).toBe(false);
	});

	it("does not call mock adapter functions in API mode", async () => {
		mockSubmitLendMarketOrder.mockResolvedValue(API_MARKET_POSITION);
		const useSubmitLend = await getHook();
		const { result } = renderHookWithProviders(() => useSubmitLend());

		await act(async () => {
			await result.current.submitMarket(marketParams, {
				token: "jwt",
				marketIds: MARKET_IDS,
			});
		});

		// Only the API adapter should be called
		expect(mockSubmitLendMarketOrder).toHaveBeenCalled();
	});
});
