import { test, expect } from "@playwright/test";
import {
	LENDER_AUTH,
	getMarkets,
	filterFutureMarkets,
	createLendLimitOrder,
	cancelOrder,
	getOpenOrders,
} from "./helpers/api";

test.describe("Cancel Order E2E", () => {
	test("Cancel an open order", async ({ request }) => {
		const markets = await getMarkets(request);
		const futureMarkets = filterFutureMarkets(markets);

		if (futureMarkets.length === 0) {
			test.skip(true, "No future markets available");
			return;
		}

		// Create an order to cancel
		const createResult = await createLendLimitOrder(
			request,
			LENDER_AUTH,
			{
				assetId: futureMarkets[0].asset.id,
				marketId: futureMarkets[0].market.market_id,
				amount: "100",
				rate: 500,
			},
		);

		expect(createResult.status).toBe(201);
		const order = createResult.body.data?.data ?? createResult.body.data;
		const orderId = order.orderId;
		expect(orderId).toBeDefined();

		// Cancel the order
		const cancelResult = await cancelOrder(
			request,
			LENDER_AUTH,
			orderId,
		);

		expect(cancelResult.status).toBe(200);
	});

	test("Reject cancel with invalid UUID format", async ({ request }) => {
		const cancelResult = await cancelOrder(
			request,
			LENDER_AUTH,
			"not-a-uuid",
		);

		expect(cancelResult.status).toBeGreaterThanOrEqual(400);
	});

	test("Reject cancel of non-existent order", async ({ request }) => {
		const cancelResult = await cancelOrder(
			request,
			LENDER_AUTH,
			"00000000-0000-0000-0000-000000000000",
		);

		expect(cancelResult.status).toBeGreaterThanOrEqual(400);
	});

	test("Reject cancel without auth", async ({ request }) => {
		const res = await request.post(
			"/orders/00000000-0000-0000-0000-000000000000/cancel",
		);

		expect(res.status()).toBe(401);
	});
});
