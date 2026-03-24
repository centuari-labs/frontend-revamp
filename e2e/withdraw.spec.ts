import { test, expect } from "@playwright/test";
import {
	LENDER_AUTH,
	getMyAssets,
	submitWithdraw,
} from "./helpers/api";

test.describe("Withdraw E2E", () => {
	test("Reject without auth", async ({ request }) => {
		const res = await request.post("/withdraw", {
			data: {
				assetId: "00000000-0000-0000-0000-000000000000",
				amount: "10",
			},
		});

		expect(res.status()).toBe(401);
	});

	test("Reject invalid assetId format", async ({ request }) => {
		const result = await submitWithdraw(request, LENDER_AUTH, {
			assetId: "not-a-uuid",
			amount: "10",
		});

		expect(result.status).toBeGreaterThanOrEqual(400);
	});

	test("Reject non-existent assetId", async ({ request }) => {
		const result = await submitWithdraw(request, LENDER_AUTH, {
			assetId: "00000000-0000-0000-0000-000000000000",
			amount: "10",
		});

		expect(result.status).toBeGreaterThanOrEqual(400);
	});

	test("Withdraw small amount from deposited asset", async ({
		request,
	}) => {
		const assetsResult = await getMyAssets(request, LENDER_AUTH, {
			page: 1,
			limit: 100,
		});
		const assetsBody =
			assetsResult.body.data?.data ?? assetsResult.body.data;
		const items = assetsBody?.data ?? assetsBody;

		if (!Array.isArray(items)) {
			test.skip(true, "No assets returned");
			return;
		}

		const assetWithBalance = items.find(
			(a: { walletBalance: number }) => a.walletBalance > 0,
		);

		if (!assetWithBalance) {
			test.skip(
				true,
				"No asset with positive balance found for test wallet",
			);
			return;
		}

		const result = await submitWithdraw(request, LENDER_AUTH, {
			assetId: assetWithBalance.assetId,
			amount: "0.001",
		});

		// May succeed or fail if balance is too low for fees
		if (result.status === 200) {
			const data = result.body.data?.data ?? result.body.data;
			expect(data.txHash).toBeDefined();
			expect(data.status).toBe("success");
		} else {
			// Acceptable: insufficient balance or on-chain error
			expect(result.status).toBeGreaterThanOrEqual(400);
			expect(result.status).toBeLessThan(500);
		}
	});

	test("Reject withdraw exceeding balance", async ({ request }) => {
		const assetsResult = await getMyAssets(request, LENDER_AUTH, {
			page: 1,
			limit: 10,
		});
		const assetsBody =
			assetsResult.body.data?.data ?? assetsResult.body.data;
		const items = assetsBody?.data ?? assetsBody;

		if (!Array.isArray(items) || items.length === 0) {
			test.skip(true, "No assets available for test wallet");
			return;
		}

		const result = await submitWithdraw(request, LENDER_AUTH, {
			assetId: items[0].assetId,
			amount: "999999999999",
		});

		expect(result.status).toBeGreaterThanOrEqual(400);
	});
});
