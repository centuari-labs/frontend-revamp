import { test, expect } from "@playwright/test";
import {
	LENDER_AUTH,
	getMarkets,
	getOpenOrders,
	getOrderHistory,
	getTransactionHistory,
} from "./helpers/api";

test.describe("Open Orders & History E2E", () => {
	test.describe("GET /portfolio/open-orders", () => {
		test("Returns open orders list", async ({ request }) => {
			const result = await getOpenOrders(request, LENDER_AUTH);

			expect(result.status).toBe(200);
			const data = result.body.data?.data ?? result.body.data;
			expect(data).toBeDefined();
		});

		test("Filter by side", async ({ request }) => {
			const result = await getOpenOrders(request, LENDER_AUTH, {
				side: "LEND",
			});

			expect(result.status).toBe(200);
			const data = result.body.data?.data ?? result.body.data;
			const items = data?.data ?? data;

			if (Array.isArray(items)) {
				for (const item of items) {
					expect(item.side).toBe("LEND");
				}
			}
		});

		test("Filter by assetId", async ({ request }) => {
			const markets = await getMarkets(request);
			const assetId = markets[0].asset.id;

			const result = await getOpenOrders(request, LENDER_AUTH, {
				assetId,
			});

			expect(result.status).toBe(200);
		});

		test("Reject without auth", async ({ request }) => {
			const res = await request.get("/portfolio/open-orders");
			expect(res.status()).toBe(401);
		});
	});

	test.describe("GET /portfolio/order-history", () => {
		test("Returns order history", async ({ request }) => {
			const result = await getOrderHistory(request, LENDER_AUTH);

			expect(result.status).toBe(200);
			const data = result.body.data?.data ?? result.body.data;
			expect(data).toBeDefined();
		});

		test("Filter by side and status", async ({ request }) => {
			const result = await getOrderHistory(request, LENDER_AUTH, {
				side: "LEND",
				status: "FILLED",
			});

			expect(result.status).toBe(200);
		});

		test("Supports pagination", async ({ request }) => {
			const result = await getOrderHistory(request, LENDER_AUTH, {
				page: 1,
				limit: 5,
			});

			expect(result.status).toBe(200);
		});

		test("Reject without auth", async ({ request }) => {
			const res = await request.get("/portfolio/order-history");
			expect(res.status()).toBe(401);
		});
	});

	test.describe("GET /portfolio/transaction-history", () => {
		test("Returns transaction history", async ({ request }) => {
			const result = await getTransactionHistory(
				request,
				LENDER_AUTH,
			);

			expect(result.status).toBe(200);
			const data = result.body.data?.data ?? result.body.data;
			expect(data).toBeDefined();
		});

		test("Filter by side", async ({ request }) => {
			const result = await getTransactionHistory(
				request,
				LENDER_AUTH,
				{ side: "LEND" },
			);

			expect(result.status).toBe(200);
		});

		test("Reject without auth", async ({ request }) => {
			const res = await request.get("/portfolio/transaction-history");
			expect(res.status()).toBe(401);
		});
	});
});
