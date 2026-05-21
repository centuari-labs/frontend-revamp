/**
 * Order submission contract test — verifies the DTO shape sent to the API
 * and the correct unwrapping of the double-envelope response.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { OrderResponseData } from "@/lib/api";
import {
	aprToBasisPoints,
	normalizeOrderToLendPosition,
} from "@/lib/positions-adapter.api";
import { ORDER_RESPONSE_DATA } from "@/__tests__/fixtures/api-responses";

vi.mock("@/lib/api", () => ({
	createLendLimitOrder: vi.fn(),
	createLendMarketOrder: vi.fn(),
}));

import { createLendLimitOrder } from "@/lib/api";
const mockCreateLendLimit = vi.mocked(createLendLimitOrder);

beforeEach(() => {
	vi.clearAllMocks();
});

const MARKET_IDS = {
	assetId: "b0000000-0000-0000-0000-000000000001",
	marketId:
		"0xc000000000000000000000000000000000000000000000000000000000000001",
	tokenSymbol: "USDC",
};

describe("order submission DTO shape", () => {
	it("rate is sent as basis points in DTO (not percentage or decimal)", () => {
		const decimalApr = 0.065;
		const bps = aprToBasisPoints(decimalApr);
		expect(bps).toBe(650);
		// This is what gets sent as dto.rate
		expect(Number.isInteger(bps)).toBe(true);
	});

	it("amount is sent as a string in DTO", () => {
		const amount = 1000;
		const dtoAmount = String(amount);
		expect(typeof dtoAmount).toBe("string");
		expect(dtoAmount).toBe("1000");
	});
});

describe("response normalization to LendPosition", () => {
	it("converts rate from percentage to decimal APR", () => {
		const position = normalizeOrderToLendPosition(
			ORDER_RESPONSE_DATA as OrderResponseData,
			"USDC",
		);
		// BE returns rate=6.5 (percentage), FE converts to 0.065 (decimal APR)
		expect(position.apr).toBe(0.065);
	});

	it("converts maturity from seconds to milliseconds", () => {
		const position = normalizeOrderToLendPosition(
			ORDER_RESPONSE_DATA as OrderResponseData,
			"USDC",
		);
		// BE: 1748736000 seconds -> FE: 1748736000000 milliseconds
		expect(position.maturity).toBe(1748736000 * 1000);
	});

	it("maps OPEN status to OPEN", () => {
		const position = normalizeOrderToLendPosition(
			{ ...ORDER_RESPONSE_DATA, status: "OPEN" } as OrderResponseData,
			"USDC",
		);
		expect(position.status).toBe("OPEN");
	});

	it("maps FILLED status to FILLED", () => {
		const position = normalizeOrderToLendPosition(
			{ ...ORDER_RESPONSE_DATA, status: "FILLED" } as OrderResponseData,
			"USDC",
		);
		expect(position.status).toBe("FILLED");
	});

	it("maps CANCELLED status to CANCELLED", () => {
		const position = normalizeOrderToLendPosition(
			{ ...ORDER_RESPONSE_DATA, status: "CANCELLED" } as OrderResponseData,
			"USDC",
		);
		expect(position.status).toBe("CANCELLED");
	});

	it("maps PARTIALLY_FILLED status to PARTIALLY_FILLED", () => {
		const position = normalizeOrderToLendPosition(
			{
				...ORDER_RESPONSE_DATA,
				status: "PARTIALLY_FILLED",
			} as OrderResponseData,
			"USDC",
		);
		expect(position.status).toBe("PARTIALLY_FILLED");
	});

	it("parses originalAmount as number", () => {
		const position = normalizeOrderToLendPosition(
			ORDER_RESPONSE_DATA as OrderResponseData,
			"USDC",
		);
		expect(position.amount).toBe(1000);
		expect(typeof position.amount).toBe("number");
	});

	it("uses passed token symbol", () => {
		const position = normalizeOrderToLendPosition(
			ORDER_RESPONSE_DATA as OrderResponseData,
			"USDC",
		);
		expect(position.tokenSymbol).toBe("USDC");
		expect(position.tokenValue).toBe("usdc");
	});
});

describe("full submission chain (mocked API)", () => {
	it("sends correct DTO and returns normalized position", async () => {
		mockCreateLendLimit.mockResolvedValue(
			ORDER_RESPONSE_DATA as OrderResponseData,
		);

		const { submitLendLimitOrder } = await import(
			"@/lib/positions-adapter.api"
		);
		const position = await submitLendLimitOrder(
			{
				tokenValue: "usdc",
				tokenLogo: "/tokens/usdc-icon.webp",
				tokenLabel: "USDC",
				amount: 1000,
				amountInUsd: 1000,
				targetApr: 0.065,
				maturity: 1748736000000,
				autoRollover: false,
			},
			MARKET_IDS,
			"jwt-token",
		);

		// Verify DTO sent to API
		expect(mockCreateLendLimit).toHaveBeenCalledWith(
			{
				assetId: "b0000000-0000-0000-0000-000000000001",
				amount: "1000",
				marketIds: [
					"0xc000000000000000000000000000000000000000000000000000000000000001",
				],
				rate: 650,
				autoRollover: false,
			},
			"jwt-token",
		);

		// Verify normalized position
		expect(position.apr).toBe(0.065);
		expect(position.type).toBe("lend");
		expect(position.orderType).toBe("limit");
		expect(position.id).toBe(ORDER_RESPONSE_DATA.orderId);
	});
});
