import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
	aprToBasisPoints,
	basisPointsToApr,
	mapStatus,
	normalizeOrderToLendPosition,
	normalizeOrderToBorrowPosition,
	submitLendLimitOrder,
	submitLendMarketOrder,
	submitBorrowLimitOrder,
	submitBorrowMarketOrder,
} from "@/lib/positions-adapter.api";
import type { OrderResponseData } from "@/lib/api";

vi.mock("@/lib/api", () => ({
	createLendLimitOrder: vi.fn(),
	createLendMarketOrder: vi.fn(),
	createBorrowLimitOrder: vi.fn(),
	createBorrowMarketOrder: vi.fn(),
}));

import {
	createLendLimitOrder,
	createLendMarketOrder,
	createBorrowLimitOrder,
	createBorrowMarketOrder,
} from "@/lib/api";
const mockCreateOrder = vi.mocked(createLendLimitOrder);
const mockCreateLendMarket = vi.mocked(createLendMarketOrder);
const mockCreateBorrowLimit = vi.mocked(createBorrowLimitOrder);
const mockCreateBorrowMarket = vi.mocked(createBorrowMarketOrder);

// ─── Fixtures ─────────────────────────────────────────────────────────

const MARKET_IDS = {
	assetId: "asset-uuid-usdc",
	marketId: "market-uuid-1",
	tokenSymbol: "USDC",
};

const MOCK_RESPONSE: OrderResponseData = {
	orderId: "order-123",
	walletAddress: "0xWallet",
	assetId: "asset-uuid-usdc",
	markets: [{ marketId: "market-uuid-1", maturity: 1735689600 }],
	timestamp: 1740441600000,
	side: "LEND",
	type: "LIMIT",
	status: "OPEN",
	originalAmount: "1000",
	settlementFeeAmount: "0.1",
	rate: 6.5,
	autoRollover: true,
	createdAt: "2026-02-25T00:00:00.000Z",
	updatedAt: "2026-02-25T00:00:00.000Z",
};

beforeEach(() => {
	vi.clearAllMocks();
});

// ─── aprToBasisPoints ─────────────────────────────────────────────────

describe("aprToBasisPoints", () => {
	it("converts decimal APR to basis points", () => {
		expect(aprToBasisPoints(0.065)).toBe(650);
	});

	it("handles whole percentage APR", () => {
		expect(aprToBasisPoints(0.05)).toBe(500);
	});

	it("applies Math.round for floating-point precision", () => {
		// 0.0655 * 10000 = 655.0000000000001 without rounding
		expect(aprToBasisPoints(0.0655)).toBe(655);
	});

	it("converts 100% to 10000 basis points", () => {
		expect(aprToBasisPoints(1.0)).toBe(10000);
	});

	it("converts small APR correctly", () => {
		expect(aprToBasisPoints(0.0001)).toBe(1);
	});
});

// ─── basisPointsToApr ─────────────────────────────────────────────────

describe("basisPointsToApr", () => {
	it("converts 650 bps to 0.065 decimal APR", () => {
		expect(basisPointsToApr(650)).toBeCloseTo(0.065, 6);
	});

	it("converts 500 bps to 0.05 decimal APR", () => {
		expect(basisPointsToApr(500)).toBe(0.05);
	});

	it("is exact inverse of aprToBasisPoints within rounding", () => {
		const original = 0.0537;
		const bps = aprToBasisPoints(original);
		const recovered = basisPointsToApr(bps);
		expect(Math.abs(recovered - original)).toBeLessThan(1 / 10_000);
	});
});

// ─── mapStatus ────────────────────────────────────────────────────────

describe("mapStatus", () => {
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		consoleErrorSpy.mockRestore();
	});

	it("maps OPEN to OPEN", () => {
		expect(mapStatus("OPEN")).toBe("OPEN");
		expect(consoleErrorSpy).not.toHaveBeenCalled();
	});

	it("maps FILLED to FILLED", () => {
		expect(mapStatus("FILLED")).toBe("FILLED");
		expect(consoleErrorSpy).not.toHaveBeenCalled();
	});

	it("maps CANCELLED to CANCELLED", () => {
		expect(mapStatus("CANCELLED")).toBe("CANCELLED");
		expect(consoleErrorSpy).not.toHaveBeenCalled();
	});

	it("maps PARTIALLY_FILLED to PARTIALLY_FILLED", () => {
		expect(mapStatus("PARTIALLY_FILLED")).toBe("PARTIALLY_FILLED");
		expect(consoleErrorSpy).not.toHaveBeenCalled();
	});

	it("returns UNKNOWN and logs for unrecognised string", () => {
		expect(mapStatus("WEIRD")).toBe("UNKNOWN");
		expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"[mapStatus] unknown order status",
			{ backendStatus: "WEIRD" },
		);
	});

	it("returns UNKNOWN and logs for null", () => {
		expect(mapStatus(null)).toBe("UNKNOWN");
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"[mapStatus] unknown order status",
			{ backendStatus: null },
		);
	});

	it("returns UNKNOWN and logs for undefined", () => {
		expect(mapStatus(undefined)).toBe("UNKNOWN");
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"[mapStatus] unknown order status",
			{ backendStatus: undefined },
		);
	});

	it("returns UNKNOWN and logs for empty string", () => {
		expect(mapStatus("")).toBe("UNKNOWN");
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"[mapStatus] unknown order status",
			{ backendStatus: "" },
		);
	});

	it("does NOT coerce unknown statuses to OPEN (regression guard for A4 #19)", () => {
		expect(mapStatus("ZOMBIE")).not.toBe("OPEN");
		expect(mapStatus("ZOMBIE")).toBe("UNKNOWN");
	});
});

// ─── normalizeOrderToLendPosition ─────────────────────────────────────

describe("normalizeOrderToLendPosition", () => {
	it("maps all fields correctly", () => {
		const position = normalizeOrderToLendPosition(MOCK_RESPONSE, "USDC");

		expect(position.id).toBe("order-123");
		expect(position.type).toBe("lend");
		expect(position.orderType).toBe("limit");
		expect(position.tokenValue).toBe("usdc");
		expect(position.tokenSymbol).toBe("USDC");
		expect(position.amount).toBe(1000);
		expect(position.apr).toBeCloseTo(0.065, 4);
		expect(position.maturity).toBe(1735689600000);
		expect(position.status).toBe("OPEN");
		expect(position.assetImg).toBe("/tokens/usdc-icon.webp");
	});

	it("maps OPEN status correctly", () => {
		const pos = normalizeOrderToLendPosition(MOCK_RESPONSE, "USDC");
		expect(pos.status).toBe("OPEN");
	});

	it("maps FILLED status correctly", () => {
		const filled = { ...MOCK_RESPONSE, status: "FILLED" };
		const pos = normalizeOrderToLendPosition(filled, "USDC");
		expect(pos.status).toBe("FILLED");
	});

	it("maps CANCELLED status correctly", () => {
		const cancelled = { ...MOCK_RESPONSE, status: "CANCELLED" };
		const pos = normalizeOrderToLendPosition(cancelled, "USDC");
		expect(pos.status).toBe("CANCELLED");
	});

	it("maps PARTIALLY_FILLED correctly", () => {
		const partial = { ...MOCK_RESPONSE, status: "PARTIALLY_FILLED" };
		const pos = normalizeOrderToLendPosition(partial, "USDC");
		expect(pos.status).toBe("PARTIALLY_FILLED");
	});

	it("parses originalAmount as number", () => {
		const position = normalizeOrderToLendPosition(MOCK_RESPONSE, "USDC");
		expect(position.amount).toBe(1000);
		expect(typeof position.amount).toBe("number");
	});

	it("sets tokenSymbol and tokenValue from passed symbol", () => {
		const position = normalizeOrderToLendPosition(MOCK_RESPONSE, "USDC");
		expect(position.tokenSymbol).toBe("USDC");
		expect(position.tokenValue).toBe("usdc");
	});
});

// ─── submitLendLimitOrder ─────────────────────────────────────────────

describe("submitLendLimitOrder", () => {
	const baseParams = {
		tokenValue: "usdc",
		tokenLogo: "/tokens/usdc-icon.webp",
		tokenLabel: "USDC",
		amount: 1000,
		amountInUsd: 1000,
		targetApr: 0.065,
		maturity: 1735689600000,
		autoRollover: true,
		editingPosition: undefined,
	};

	it("converts params to correct DTO and calls createLendLimitOrder", async () => {
		mockCreateOrder.mockResolvedValue(MOCK_RESPONSE);

		await submitLendLimitOrder(baseParams, MARKET_IDS, "jwt-token-123");

		expect(mockCreateOrder).toHaveBeenCalledWith(
			{
				assetId: "asset-uuid-usdc",
				amount: "1000",
				marketIds: ["market-uuid-1"],
				rate: 650,
				autoRollover: true,
			},
			"jwt-token-123",
		);
	});

	it("returns a normalized LendPosition", async () => {
		mockCreateOrder.mockResolvedValue(MOCK_RESPONSE);

		const result = await submitLendLimitOrder(baseParams, MARKET_IDS, "token");

		expect(result.id).toBe("order-123");
		expect(result.type).toBe("lend");
		expect(result.orderType).toBe("limit");
		expect(result.tokenValue).toBe("usdc");
	});

	it("passes autoRollover=false when set", async () => {
		mockCreateOrder.mockResolvedValue(MOCK_RESPONSE);

		await submitLendLimitOrder(
			{ ...baseParams, autoRollover: false },
			MARKET_IDS,
			"token",
		);

		expect(mockCreateOrder).toHaveBeenCalledWith(
			expect.objectContaining({ autoRollover: false }),
			"token",
		);
	});

	it("propagates API errors", async () => {
		mockCreateOrder.mockRejectedValue(new Error("API error: 400 Bad Request"));

		await expect(
			submitLendLimitOrder(baseParams, MARKET_IDS, "token"),
		).rejects.toThrow("API error: 400 Bad Request");
	});
});

// ─── normalizeOrderToLendPosition (market orderType) ─────────────────

describe("normalizeOrderToLendPosition with orderType", () => {
	it("defaults to limit when no orderType passed", () => {
		const pos = normalizeOrderToLendPosition(MOCK_RESPONSE, "USDC");
		expect(pos.orderType).toBe("limit");
	});

	it("passes through market orderType", () => {
		const pos = normalizeOrderToLendPosition(MOCK_RESPONSE, "USDC", "market");
		expect(pos.orderType).toBe("market");
		expect(pos.type).toBe("lend");
	});
});

// ─── normalizeOrderToBorrowPosition ──────────────────────────────────

describe("normalizeOrderToBorrowPosition", () => {
	const BORROW_RESPONSE: OrderResponseData = {
		...MOCK_RESPONSE,
		side: "BORROW",
		rate: 10.1,
	};

	it("maps all fields correctly", () => {
		const position = normalizeOrderToBorrowPosition(BORROW_RESPONSE, "USDC");

		expect(position.id).toBe("order-123");
		expect(position.type).toBe("borrow");
		expect(position.orderType).toBe("limit");
		expect(position.tokenValue).toBe("usdc");
		expect(position.tokenSymbol).toBe("USDC");
		expect(position.amount).toBe(1000);
		expect(position.apr).toBeCloseTo(0.101, 4);
		expect(position.maturity).toBe(1735689600000);
		expect(position.status).toBe("OPEN");
		expect(position.collateralTokens).toEqual([]);
		expect(position.assetImg).toBe("/tokens/usdc-icon.webp");
	});

	it("accepts market orderType", () => {
		const pos = normalizeOrderToBorrowPosition(
			BORROW_RESPONSE,
			"USDC",
			"market",
		);
		expect(pos.orderType).toBe("market");
		expect(pos.type).toBe("borrow");
	});

	it("maps all statuses correctly", () => {
		expect(
			normalizeOrderToBorrowPosition(
				{ ...BORROW_RESPONSE, status: "OPEN" },
				"USDC",
			).status,
		).toBe("OPEN");
		expect(
			normalizeOrderToBorrowPosition(
				{ ...BORROW_RESPONSE, status: "FILLED" },
				"USDC",
			).status,
		).toBe("FILLED");
		expect(
			normalizeOrderToBorrowPosition(
				{ ...BORROW_RESPONSE, status: "CANCELLED" },
				"USDC",
			).status,
		).toBe("CANCELLED");
		expect(
			normalizeOrderToBorrowPosition(
				{ ...BORROW_RESPONSE, status: "PARTIALLY_FILLED" },
				"USDC",
			).status,
		).toBe("PARTIALLY_FILLED");
	});
});

// ─── submitLendMarketOrder ───────────────────────────────────────────

describe("submitLendMarketOrder", () => {
	const baseParams = {
		tokenValue: "usdc",
		tokenLogo: "/tokens/usdc-icon.webp",
		tokenLabel: "USDC",
		amount: 1000,
		amountInUsd: 1000,
		maturity: 1735689600000,
		editingPosition: undefined,
	};

	it("converts params to correct DTO (no rate) and calls createLendMarketOrder", async () => {
		mockCreateLendMarket.mockResolvedValue({
			...MOCK_RESPONSE,
			type: "MARKET",
		});

		await submitLendMarketOrder(baseParams, MARKET_IDS, "jwt-token");

		expect(mockCreateLendMarket).toHaveBeenCalledWith(
			{
				assetId: "asset-uuid-usdc",
				amount: "1000",
				marketIds: ["market-uuid-1"],
				autoRollover: true,
			},
			"jwt-token",
		);
	});

	it("returns a normalized LendPosition with orderType market", async () => {
		mockCreateLendMarket.mockResolvedValue({
			...MOCK_RESPONSE,
			type: "MARKET",
		});

		const result = await submitLendMarketOrder(baseParams, MARKET_IDS, "token");

		expect(result.id).toBe("order-123");
		expect(result.type).toBe("lend");
		expect(result.orderType).toBe("market");
	});

	it("propagates API errors", async () => {
		mockCreateLendMarket.mockRejectedValue(new Error("API error: 500"));

		await expect(
			submitLendMarketOrder(baseParams, MARKET_IDS, "token"),
		).rejects.toThrow("API error: 500");
	});
});

// ─── submitBorrowLimitOrder ──────────────────────────────────────────

describe("submitBorrowLimitOrder", () => {
	const baseParams = {
		tokenValue: "usdc",
		tokenLogo: "/tokens/usdc-icon.webp",
		tokenLabel: "USDC",
		amount: 500,
		maturity: 1735689600000,
		targetApr: 0.101,
		collateralTokens: ["btc", "eth"],
		editingPosition: undefined,
	};

	it("converts params to correct DTO with rate and calls createBorrowLimitOrder", async () => {
		mockCreateBorrowLimit.mockResolvedValue({
			...MOCK_RESPONSE,
			side: "BORROW",
			rate: 10.1,
		});

		await submitBorrowLimitOrder(baseParams, MARKET_IDS, "jwt-borrow");

		expect(mockCreateBorrowLimit).toHaveBeenCalledWith(
			{
				assetId: "asset-uuid-usdc",
				amount: "500",
				marketIds: ["market-uuid-1"],
				rate: 1010,
				autoRollover: false,
			},
			"jwt-borrow",
		);
	});

	it("returns a normalized BorrowPosition", async () => {
		mockCreateBorrowLimit.mockResolvedValue({
			...MOCK_RESPONSE,
			side: "BORROW",
			rate: 10.1,
		});

		const result = await submitBorrowLimitOrder(
			baseParams,
			MARKET_IDS,
			"token",
		);

		expect(result.id).toBe("order-123");
		expect(result.type).toBe("borrow");
		expect(result.orderType).toBe("limit");
		expect(result.collateralTokens).toEqual([]);
	});

	it("propagates API errors", async () => {
		mockCreateBorrowLimit.mockRejectedValue(new Error("Health factor too low"));

		await expect(
			submitBorrowLimitOrder(baseParams, MARKET_IDS, "token"),
		).rejects.toThrow("Health factor too low");
	});
});

// ─── submitBorrowMarketOrder ─────────────────────────────────────────

describe("submitBorrowMarketOrder", () => {
	const baseParams = {
		tokenValue: "usdc",
		tokenLogo: "/tokens/usdc-icon.webp",
		tokenLabel: "USDC",
		amount: 500,
		maturity: 1735689600000,
		collateralTokens: ["btc"],
		editingPosition: undefined,
	};

	it("converts params to correct DTO (no rate) and calls createBorrowMarketOrder", async () => {
		mockCreateBorrowMarket.mockResolvedValue({
			...MOCK_RESPONSE,
			side: "BORROW",
			type: "MARKET",
		});

		await submitBorrowMarketOrder(baseParams, MARKET_IDS, "jwt-borrow");

		expect(mockCreateBorrowMarket).toHaveBeenCalledWith(
			{
				assetId: "asset-uuid-usdc",
				amount: "500",
				marketIds: ["market-uuid-1"],
				autoRollover: false,
			},
			"jwt-borrow",
		);
	});

	it("returns a normalized BorrowPosition with orderType market", async () => {
		mockCreateBorrowMarket.mockResolvedValue({
			...MOCK_RESPONSE,
			side: "BORROW",
			type: "MARKET",
		});

		const result = await submitBorrowMarketOrder(
			baseParams,
			MARKET_IDS,
			"token",
		);

		expect(result.id).toBe("order-123");
		expect(result.type).toBe("borrow");
		expect(result.orderType).toBe("market");
	});

	it("propagates API errors", async () => {
		mockCreateBorrowMarket.mockRejectedValue(new Error("API error: 400"));

		await expect(
			submitBorrowMarketOrder(baseParams, MARKET_IDS, "token"),
		).rejects.toThrow("API error: 400");
	});
});
