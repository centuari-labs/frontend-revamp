/**
 * API contract tests: verify apiClient correctly unwraps all BE response shapes.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient } from "@/lib/api-client";
import {
	ORDER_WIRE_RESPONSE,
	ORDER_RESPONSE_DATA,
	MY_ASSETS_WIRE_RESPONSE,
	MY_ASSETS_ITEMS,
	MARKET_WIRE_RESPONSE,
	MARKET_RESPONSE,
} from "@/__tests__/fixtures/api-responses";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
	vi.clearAllMocks();
});

describe("apiClient envelope unwrapping", () => {
	it("unwraps standard { statusCode, data } envelope", async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => ({ statusCode: 200, data: { foo: "bar" } }),
		});

		const result = await apiClient<{ foo: string }>("/test");
		expect(result).toEqual({ foo: "bar" });
	});

	it("unwraps paginated envelope: returns the inner array", async () => {
		// The interceptor restructures { data: [...], page, ... } into
		// { statusCode, data: [...], meta: {...} }
		// apiClient accesses json.data → gets the array
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => MY_ASSETS_WIRE_RESPONSE,
		});

		const result = await apiClient<typeof MY_ASSETS_ITEMS>(
			"/portfolio/my-assets",
		);
		expect(Array.isArray(result)).toBe(true);
		expect(result).toEqual(MY_ASSETS_ITEMS);
	});

	it("unwraps market response: returns MarketResponse object", async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => MARKET_WIRE_RESPONSE,
		});

		const result =
			await apiClient<typeof MARKET_RESPONSE>("/market");
		expect(result.total_deposit).toBe("1500000.00");
		expect(result.markets).toHaveLength(2);
	});

	it("unwraps order double-envelope: returns inner { statusCode, data }", async () => {
		// Orders have a double envelope:
		// Wire: { statusCode: 201, data: { statusCode: 201, data: {...} } }
		// apiClient unwraps outer → gets { statusCode: 201, data: {...} }
		// Then createLendLimitOrder() unwraps .data → gets the order
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => ORDER_WIRE_RESPONSE,
		});

		const result = await apiClient<{
			statusCode: number;
			data: typeof ORDER_RESPONSE_DATA;
		}>("/orders/lend/limit", { method: "POST", body: {} });

		// apiClient returns the outer .data (which is the inner envelope)
		expect(result.statusCode).toBe(201);
		expect(result.data).toEqual(ORDER_RESPONSE_DATA);
	});
});

describe("getMyAssets returns paginated response", () => {
	it("returns { data, page, totalData, totalPages } after unwrapping", async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => MY_ASSETS_WIRE_RESPONSE,
		});

		// Import the actual function
		const { getMyAssets } = await import("@/lib/api");
		const result = await getMyAssets("test-token");

		expect(Array.isArray(result.data)).toBe(true);
		expect(result.data).toHaveLength(2);
		expect(result.data[0].symbol).toBe("USDC");
		expect(result.page).toBe(1);
		expect(result.totalData).toBe(2);
	});
});

describe("createLendLimitOrder unwraps double envelope", () => {
	it("returns OrderResponseData after unwrapping inner envelope", async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => ORDER_WIRE_RESPONSE,
		});

		const { createLendLimitOrder } = await import("@/lib/api");
		const result = await createLendLimitOrder(
			{
				assetId: "b0000000-0000-0000-0000-000000000001",
				amount: "1000",
				marketIds: ["c0000000-0000-0000-0000-000000000001"],
				rate: 650,
			},
			"test-token",
		);

		expect(result.orderId).toBe(ORDER_RESPONSE_DATA.orderId);
		expect(result.rate).toBe(6.5);
		expect(result.side).toBe("LEND");
	});
});
