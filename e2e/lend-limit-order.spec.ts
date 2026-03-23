import { test, expect } from "@playwright/test";

const TEST_WALLET = "0x63f799163222e9CfC4afbddE7a632599AE0F1298";
const AUTH_HEADER = `Bearer DEV_TOKEN_${TEST_WALLET}`;

test.describe("Lend Limit Order E2E", () => {
	test("GET /market returns assets and markets", async ({ request }) => {
		const res = await request.get("/market");
		expect(res.status()).toBe(200);

		const body = await res.json();
		expect(body.data).toBeDefined();
		expect(body.data.markets).toBeInstanceOf(Array);
		expect(body.data.markets.length).toBeGreaterThan(0);

		const first = body.data.markets[0];
		expect(first.asset.id).toBeDefined();
		expect(first.market.market_id).toBeDefined();
	});

	test("Create lend limit order — happy path", async ({ request }) => {
		const marketRes = await request.get("/market");
		const { data: marketData } = await marketRes.json();
		const assetId = marketData.markets[0].asset.id;
		const marketId = marketData.markets[0].market.market_id;

		const res = await request.post("/orders/lend/limit", {
			headers: { Authorization: AUTH_HEADER },
			data: {
				assetId,
				amount: "100",
				marketIds: [marketId],
				rate: 650,
				autoRollover: true,
			},
		});

		expect(res.status()).toBe(201);

		const body = await res.json();
		// ResponseInterceptor double-wraps: { statusCode, data: { statusCode, data: {...} } }
		const order = body.data.data;
		expect(order).toBeDefined();
		expect(order.status).toBe("OPEN");
		expect(order.side).toBe("LEND");
		expect(order.type).toBe("LIMIT");
	});

	test("Verify response fields", async ({ request }) => {
		const marketRes = await request.get("/market");
		const { data: marketData } = await marketRes.json();
		const assetId = marketData.markets[0].asset.id;
		const marketId = marketData.markets[0].market.market_id;

		const res = await request.post("/orders/lend/limit", {
			headers: { Authorization: AUTH_HEADER },
			data: {
				assetId,
				amount: "100",
				marketIds: [marketId],
				rate: 650,
				autoRollover: true,
			},
		});

		const body = await res.json();
		const order = body.data.data;

		// orderId is a valid UUID
		expect(order.orderId).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
		);

		// rate: 650 bps input → 6.5% in response
		expect(order.rate).toBe(6.5);

		expect(order.originalAmount).toBe("100");
		expect(order.autoRollover).toBe(true);
		expect(order.walletAddress).toBe(TEST_WALLET);
		expect(order.assetId).toBe(assetId);
		expect(order.markets).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ marketId }),
			]),
		);
	});

	test("Reject missing auth token", async ({ request }) => {
		const marketRes = await request.get("/market");
		const { data: marketData } = await marketRes.json();

		const res = await request.post("/orders/lend/limit", {
			data: {
				assetId: marketData.markets[0].asset.id,
				amount: "1000",
				marketIds: [marketData.markets[0].market.market_id],
				rate: 650,
			},
		});

		expect(res.status()).toBe(401);
	});

	test("Reject empty body", async ({ request }) => {
		const res = await request.post("/orders/lend/limit", {
			headers: { Authorization: AUTH_HEADER },
			data: {},
		});

		expect(res.ok()).toBe(false);
	});

	test("Reject unknown assetId", async ({ request }) => {
		const marketRes = await request.get("/market");
		const { data: marketData } = await marketRes.json();

		const res = await request.post("/orders/lend/limit", {
			headers: { Authorization: AUTH_HEADER },
			data: {
				assetId: "00000000-0000-0000-0000-000000000000",
				amount: "1000",
				marketIds: [marketData.markets[0].market.market_id],
				rate: 650,
			},
		});

		expect(res.status()).toBe(400);
	});
});
