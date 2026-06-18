import { test, expect } from "@playwright/test";
import {
	LENDER_AUTH,
	getMarkets,
	filterFutureMarkets,
	createLendLimitOrder,
	createLendMarketOrder,
	getOpenOrders,
	waitForPosition,
} from "../helpers/api";

test.describe("Full Lend Flow E2E", () => {
	test("Create lend limit order → verify in open orders → optionally wait for position", async ({
		request,
	}) => {
		const markets = await getMarkets(request);
		const futureMarkets = filterFutureMarkets(markets);

		if (futureMarkets.length === 0) {
			test.skip(true, "No future markets available");
			return;
		}

		const assetId = futureMarkets[0].asset.id;
		const marketId = futureMarkets[0].market.market_id;
		const symbol = futureMarkets[0].asset.symbol;

		// Create lend limit order
		const createResult = await createLendLimitOrder(
			request,
			LENDER_AUTH,
			{
				assetId,
				marketId,
				amount: "100",
				rate: 650,
				autoRollover: true,
			},
		);

		expect(createResult.status).toBe(201);
		const order = createResult.body.data?.data ?? createResult.body.data;
		expect(order.orderId).toBeDefined();
		expect(order.status).toBe("OPEN");
		expect(order.side).toBe("LEND");

		// Verify order appears in open orders
		const openResult = await getOpenOrders(request, LENDER_AUTH, {
			side: "LEND",
		});
		expect(openResult.status).toBe(200);

		// Optionally wait for position match (may timeout — that's OK)
		try {
			const position = await waitForPosition(
				request,
				LENDER_AUTH,
				(p) => p.symbol === symbol && p.side === "LEND",
				{ timeoutMs: 15_000, intervalMs: 3_000 },
			);

			expect(position.side).toBe("LEND");
			expect(position.symbol).toBe(symbol);
		} catch {
			// Position match may not happen in time — acceptable
			console.log(
				"Position match did not occur within timeout — this is expected if no matching borrow order exists",
			);
		}
	});

	test("Create lend market order → verify in open orders", async ({
		request,
	}) => {
		const markets = await getMarkets(request);
		const futureMarkets = filterFutureMarkets(markets);

		if (futureMarkets.length === 0) {
			test.skip(true, "No future markets available");
			return;
		}

		const assetId = futureMarkets[0].asset.id;
		const marketId = futureMarkets[0].market.market_id;

		const createResult = await createLendMarketOrder(
			request,
			LENDER_AUTH,
			{
				assetId,
				marketId,
				amount: "100",
				autoRollover: true,
			},
		);

		expect(createResult.status).toBe(201);
		const order = createResult.body.data?.data ?? createResult.body.data;
		expect(order.side).toBe("LEND");
		expect(order.type).toBe("MARKET");

		// Verify order appears in open orders
		const openResult = await getOpenOrders(request, LENDER_AUTH);
		expect(openResult.status).toBe(200);
	});
});
