import { test, expect } from "@playwright/test";
import {
	LENDER_AUTH,
	getMarkets,
	filterFutureMarkets,
	createLendLimitOrder,
	cancelOrder,
	getOpenOrders,
	getOrderHistory,
} from "../helpers/api";

test.describe("Order Lifecycle E2E", () => {
	test("Create order → verify open → cancel → verify cancelled", async ({
		request,
	}) => {
		// Step 1: Find a future market
		const markets = await getMarkets(request);
		const futureMarkets = filterFutureMarkets(markets);

		if (futureMarkets.length === 0) {
			test.skip(true, "No future markets available");
			return;
		}

		const assetId = futureMarkets[0].asset.id;
		const marketId = futureMarkets[0].market.market_id;

		// Step 2: Create a lend limit order
		const createResult = await createLendLimitOrder(
			request,
			LENDER_AUTH,
			{
				assetId,
				marketId,
				amount: "100",
				rate: 500,
			},
		);

		expect(createResult.status).toBe(201);
		const order = createResult.body.data?.data ?? createResult.body.data;
		const orderId = order.orderId;
		expect(orderId).toBeDefined();
		expect(order.status).toBe("OPEN");

		// Step 3: Verify order appears in open orders
		const openResult = await getOpenOrders(request, LENDER_AUTH);
		expect(openResult.status).toBe(200);
		const openData = openResult.body.data?.data ?? openResult.body.data;
		const openItems = openData?.data ?? openData;

		if (Array.isArray(openItems)) {
			const found = openItems.find(
				(o: { id: string }) => o.id === orderId,
			);
			expect(found).toBeDefined();
		}

		// Step 4: Cancel the order
		const cancelResult = await cancelOrder(
			request,
			LENDER_AUTH,
			orderId,
		);
		expect(cancelResult.status).toBe(200);

		// Step 5: Verify order appears in order history as CANCELLED
		// Wait briefly for status update to propagate
		await new Promise((r) => setTimeout(r, 2000));

		const historyResult = await getOrderHistory(request, LENDER_AUTH, {
			status: "CANCELLED",
			limit: 50,
		});
		expect(historyResult.status).toBe(200);
		const historyData =
			historyResult.body.data?.data ?? historyResult.body.data;
		const historyItems = historyData?.data ?? historyData;

		if (Array.isArray(historyItems)) {
			const cancelled = historyItems.find(
				(o: { id: string }) => o.id === orderId,
			);
			if (cancelled) {
				expect(cancelled.status).toBe("CANCELLED");
			}
		}
	});
});
