import { test, expect } from "@playwright/test";
import { getMarkets, getMarketDetail, getRateHistory } from "./helpers/api";

test.describe("Market E2E", () => {
	test.describe("GET /market", () => {
		test("Returns markets list with expected structure", async ({
			request,
		}) => {
			const markets = await getMarkets(request);

			expect(markets.length).toBeGreaterThan(0);

			const first = markets[0];
			expect(first.asset).toBeDefined();
			expect(first.asset.id).toBeDefined();
			expect(first.asset.symbol).toBeDefined();
			expect(first.asset.name).toBeDefined();
			expect(first.market).toBeDefined();
			expect(first.market.market_id).toBeDefined();
			expect(first.market.maturity).toBeDefined();
		});
	});

	test.describe("GET /market/:assetId", () => {
		test("Returns market detail for valid asset", async ({ request }) => {
			const markets = await getMarkets(request);
			const assetId = markets[0].asset.id;

			const result = await getMarketDetail(request, assetId);

			expect(result.status).toBe(200);
			expect(result.body.data).toBeDefined();
		});

		test("Reject invalid UUID format", async ({ request }) => {
			const result = await getMarketDetail(request, "not-a-uuid");
			expect(result.status).toBeGreaterThanOrEqual(400);
		});

		test("Handle unknown asset gracefully", async ({ request }) => {
			const result = await getMarketDetail(
				request,
				"00000000-0000-0000-0000-000000000000",
			);
			// Should return 404 or empty data
			expect([200, 404]).toContain(result.status);
		});
	});

	test.describe("GET /market/:assetId/rate-history", () => {
		test("Returns rate history for valid asset", async ({ request }) => {
			const markets = await getMarkets(request);
			const assetId = markets[0].asset.id;

			const result = await getRateHistory(request, assetId);

			expect(result.status).toBe(200);
			expect(result.body.data).toBeDefined();
		});

		test("Reject invalid UUID format", async ({ request }) => {
			const result = await getRateHistory(request, "not-a-uuid");
			expect(result.status).toBeGreaterThanOrEqual(400);
		});
	});
});
