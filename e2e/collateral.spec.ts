import { test, expect } from "@playwright/test";
import {
	LENDER_AUTH,
	getMyAssets,
	setCollateral,
} from "./helpers/api";

test.describe("Collateral Toggle E2E", () => {
	test("Toggle asset as collateral — on", async ({ request }) => {
		const assetsResult = await getMyAssets(request, LENDER_AUTH, {
			page: 1,
			limit: 10,
		});
		const assetsBody = assetsResult.body.data?.data ?? assetsResult.body.data;
		const items = assetsBody?.data ?? assetsBody;

		if (!Array.isArray(items) || items.length === 0) {
			test.skip(true, "No assets available for test wallet");
			return;
		}

		const assetId = items[0].assetId;
		const result = await setCollateral(request, LENDER_AUTH, {
			assetIds: [assetId],
			isCollateral: true,
		});

		expect(result.status).toBe(200);
	});

	test("Toggle asset as collateral — off", async ({ request }) => {
		const assetsResult = await getMyAssets(request, LENDER_AUTH, {
			page: 1,
			limit: 10,
		});
		const assetsBody = assetsResult.body.data?.data ?? assetsResult.body.data;
		const items = assetsBody?.data ?? assetsBody;

		if (!Array.isArray(items) || items.length === 0) {
			test.skip(true, "No assets available for test wallet");
			return;
		}

		const assetId = items[0].assetId;
		const result = await setCollateral(request, LENDER_AUTH, {
			assetIds: [assetId],
			isCollateral: false,
		});

		expect(result.status).toBe(200);
	});

	test("Reject without auth", async ({ request }) => {
		const res = await request.put("/portfolio/is-collateral", {
			data: {
				assetIds: ["00000000-0000-0000-0000-000000000000"],
				isCollateral: true,
			},
		});

		expect(res.status()).toBe(401);
	});

	test("Handle empty assetIds array", async ({ request }) => {
		const result = await setCollateral(request, LENDER_AUTH, {
			assetIds: [],
			isCollateral: true,
		});

		// May succeed as no-op or reject with 400
		expect([200, 400]).toContain(result.status);
	});
});
