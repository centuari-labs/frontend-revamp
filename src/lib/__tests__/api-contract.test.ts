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
	type MARKET_RESPONSE,
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

		const result = await apiClient<typeof MARKET_RESPONSE>("/market");
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

describe("getMyPositions paginated migration", () => {
	it("calls apiClientPaginated with params and returns reshaped pagination", async () => {
		const positions = [
			{
				id: "p1",
				assetId: "b0000000-0000-0000-0000-000000000001",
				marketId: "c0000000-0000-0000-0000-000000000001",
				symbol: "USDC",
				name: "USD Coin",
				shares: 1000,
				baseAmount: 1000,
				amountInUsd: 1000,
				apr: 6.5,
				isCollateral: false,
				imageUrl: null,
				side: "LEND" as const,
				maturity: 1748736000,
			},
		];
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => ({
				statusCode: 200,
				data: positions,
				meta: { page: 2, limit: 5, totalData: 12, totalPages: 3 },
			}),
		});

		const { getMyPositions } = await import("@/lib/api");
		const result = await getMyPositions("test-token", {
			page: 2,
			limit: 5,
			type: "LEND",
			assetId: "b0000000-0000-0000-0000-000000000001",
		});

		expect(result.data).toEqual(positions);
		expect(result.page).toBe(2);
		expect(result.limit).toBe(5);
		expect(result.totalData).toBe(12);
		expect(result.totalPages).toBe(3);

		const [url, options] = mockFetch.mock.calls[0];
		expect(url).toContain("/api/portfolio/my-position");
		expect(url).toContain("page=2");
		expect(url).toContain("limit=5");
		expect(url).toContain("type=LEND");
		expect(url).toContain("assetId=b0000000-0000-0000-0000-000000000001");
		expect(options.headers.Authorization).toBe("Bearer test-token");
	});
});

describe("getOrderHistory paginated migration", () => {
	it("calls apiClientPaginated with uppercased side and returns inner envelope shape", async () => {
		const orders = [
			{
				id: "o1",
				side: "LEND" as const,
				orderType: "LIMIT" as const,
				rate: 6.5,
				amount: "1000",
				filledQuantity: null,
				status: "OPEN" as const,
				cancelReason: null,
				maturity: "1748736000",
				asset: {
					id: "b0000000-0000-0000-0000-000000000001",
					name: "USD Coin",
					symbol: "USDC",
					decimals: 6,
					imageUrl: null,
					tokenAddress: "0x0",
				},
				fee: null,
				createdAt: "2026-05-01T00:00:00.000Z",
			},
		];
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => ({
				statusCode: 200,
				data: orders,
				meta: { page: 1, limit: 10, total: 1 },
			}),
		});

		const { getOrderHistory } = await import("@/lib/api");
		const result = await getOrderHistory("tok", {
			side: "lend",
			status: "OPEN",
			startDate: "2026-01-01",
			endDate: "2026-06-01",
		});

		expect(result.data).toEqual(orders);
		expect(result.meta).toEqual({ page: 1, limit: 10, total: 1 });
		expect(result.statusCode).toBe(200);

		const [url] = mockFetch.mock.calls[0];
		expect(url).toContain("/api/portfolio/order-history");
		expect(url).toContain("side=LEND");
		expect(url).toContain("status=OPEN");
		expect(url).toContain("startDate=2026-01-01");
	});

	it("omits side/status when they are the 'all' sentinels", async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => ({
				statusCode: 200,
				data: [],
				meta: { page: 1, limit: 10, total: 0 },
			}),
		});

		const { getOrderHistory } = await import("@/lib/api");
		await getOrderHistory("tok", {
			side: "all_transaction",
			status: "all_status",
		});

		const [url] = mockFetch.mock.calls[0];
		expect(url).not.toContain("side=");
		expect(url).not.toContain("status=");
	});
});

describe("getTransactionHistory paginated migration", () => {
	it("calls apiClientPaginated and returns inner envelope shape", async () => {
		const txs = [
			{
				id: "t1",
				side: "BORROW" as const,
				rate: 10.1,
				amount: "500",
				fee: null,
				maturity: "1748736000",
				asset: {
					id: "b0000000-0000-0000-0000-000000000001",
					name: "USD Coin",
					symbol: "USDC",
					decimals: 6,
					imageUrl: null,
					tokenAddress: "0x0",
				},
				createdAt: "2026-05-02T00:00:00.000Z",
			},
		];
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => ({
				statusCode: 200,
				data: txs,
				meta: { page: 1, limit: 10, total: 1 },
			}),
		});

		const { getTransactionHistory } = await import("@/lib/api");
		const result = await getTransactionHistory("tok", { side: "borrow" });

		expect(result.data).toEqual(txs);
		expect(result.meta).toEqual({ page: 1, limit: 10, total: 1 });
		expect(result.statusCode).toBe(200);

		const [url] = mockFetch.mock.calls[0];
		expect(url).toContain("/api/portfolio/transaction-history");
		expect(url).toContain("side=BORROW");
	});
});
