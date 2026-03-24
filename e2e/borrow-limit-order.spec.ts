import { test, expect } from "@playwright/test";
import {
	BORROWER_AUTH,
	BORROWER_WALLET,
	getMarkets,
	filterFutureMarkets,
} from "./helpers/api";

test.describe("Borrow Limit Order E2E", () => {
	test("Create borrow limit order — happy path", async ({ request }) => {
		const markets = await getMarkets(request);
		const futureMarkets = filterFutureMarkets(markets);

		if (futureMarkets.length === 0) {
			test.skip(true, "No future markets available");
			return;
		}

		const assetId = futureMarkets[0].asset.id;
		const marketId = futureMarkets[0].market.market_id;

		const res = await request.post("/orders/borrow/limit", {
			headers: { Authorization: BORROWER_AUTH },
			data: {
				assetId,
				amount: "100",
				marketIds: [marketId],
				rate: 650,
				autoRollover: false,
			},
		});

		expect(res.status()).toBe(201);

		const body = await res.json();
		const order = body.data?.data ?? body.data;
		expect(order).toBeDefined();
		expect(order.status).toBe("OPEN");
		expect(order.side).toBe("BORROW");
		expect(order.type).toBe("LIMIT");
	});

	test("Verify response fields", async ({ request }) => {
		const markets = await getMarkets(request);
		const futureMarkets = filterFutureMarkets(markets);

		if (futureMarkets.length === 0) {
			test.skip(true, "No future markets available");
			return;
		}

		const assetId = futureMarkets[0].asset.id;
		const marketId = futureMarkets[0].market.market_id;

		const res = await request.post("/orders/borrow/limit", {
			headers: { Authorization: BORROWER_AUTH },
			data: {
				assetId,
				amount: "100",
				marketIds: [marketId],
				rate: 650,
				autoRollover: false,
			},
		});

		const body = await res.json();
		const order = body.data?.data ?? body.data;

		// orderId is a valid UUID
		expect(order.orderId).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
		);

		// rate: 650 bps input → 6.5% in response
		expect(order.rate).toBe(6.5);
		expect(order.originalAmount).toBe("100");
		expect(order.autoRollover).toBe(false);
		expect(order.walletAddress).toBe(BORROWER_WALLET);
		expect(order.assetId).toBe(assetId);
		expect(order.markets).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ marketId }),
			]),
		);
	});

	test("Reject missing auth token", async ({ request }) => {
		const markets = await getMarkets(request);

		const res = await request.post("/orders/borrow/limit", {
			data: {
				assetId: markets[0].asset.id,
				amount: "100",
				marketIds: [markets[0].market.market_id],
				rate: 650,
			},
		});

		expect(res.status()).toBe(401);
	});

	test("Reject empty body", async ({ request }) => {
		const res = await request.post("/orders/borrow/limit", {
			headers: { Authorization: BORROWER_AUTH },
			data: {},
		});

		expect(res.ok()).toBe(false);
	});

	test("Reject unknown assetId", async ({ request }) => {
		const markets = await getMarkets(request);

		const res = await request.post("/orders/borrow/limit", {
			headers: { Authorization: BORROWER_AUTH },
			data: {
				assetId: "00000000-0000-0000-0000-000000000000",
				amount: "100",
				marketIds: [markets[0].market.market_id],
				rate: 650,
			},
		});

		expect(res.status()).toBe(400);
	});

	test("Reject invalid rate (0)", async ({ request }) => {
		const markets = await getMarkets(request);
		const futureMarkets = filterFutureMarkets(markets);

		if (futureMarkets.length === 0) {
			test.skip(true, "No future markets available");
			return;
		}

		const res = await request.post("/orders/borrow/limit", {
			headers: { Authorization: BORROWER_AUTH },
			data: {
				assetId: futureMarkets[0].asset.id,
				amount: "100",
				marketIds: [futureMarkets[0].market.market_id],
				rate: 0,
			},
		});

		expect(res.ok()).toBe(false);
	});

	test("Reject rate exceeding maximum", async ({ request }) => {
		const markets = await getMarkets(request);
		const futureMarkets = filterFutureMarkets(markets);

		if (futureMarkets.length === 0) {
			test.skip(true, "No future markets available");
			return;
		}

		const res = await request.post("/orders/borrow/limit", {
			headers: { Authorization: BORROWER_AUTH },
			data: {
				assetId: futureMarkets[0].asset.id,
				amount: "100",
				marketIds: [futureMarkets[0].market.market_id],
				rate: 10001,
			},
		});

		expect(res.ok()).toBe(false);
	});
});
