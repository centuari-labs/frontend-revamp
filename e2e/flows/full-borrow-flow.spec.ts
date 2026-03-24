import { test, expect } from "@playwright/test";
import {
	BORROWER_AUTH,
	getMarkets,
	filterFutureMarkets,
	createBorrowLimitOrder,
	getUserDetails,
	getHealthFactor,
} from "../helpers/api";

test.describe("Full Borrow Flow E2E", () => {
	test("Verify collateral → create borrow order → check health factor", async ({
		request,
	}) => {
		// Step 1: Verify borrower has collateral
		const userDetails = await getUserDetails(request, BORROWER_AUTH);
		expect(userDetails.status).toBe(200);
		const details =
			userDetails.body.data?.data ?? userDetails.body.data;
		const collateralUsd = details.collateralUsd;

		if (collateralUsd === 0) {
			test.skip(
				true,
				"Test wallet has no collateral — deposit and enable collateral first",
			);
			return;
		}

		// Step 2: Find a future market
		const markets = await getMarkets(request);
		const futureMarkets = filterFutureMarkets(markets);

		if (futureMarkets.length === 0) {
			test.skip(true, "No future markets available");
			return;
		}

		const assetId = futureMarkets[0].asset.id;
		const marketId = futureMarkets[0].market.market_id;

		// Step 3: Create borrow limit order
		const createResult = await createBorrowLimitOrder(
			request,
			BORROWER_AUTH,
			{
				assetId,
				marketId,
				amount: "100",
				rate: 800,
				autoRollover: false,
			},
		);

		expect(createResult.status).toBe(201);
		const order = createResult.body.data?.data ?? createResult.body.data;
		expect(order.side).toBe("BORROW");
		expect(order.status).toBe("OPEN");

		// Step 4: Check health factor
		const hfResult = await getHealthFactor(request, BORROWER_AUTH);
		expect(hfResult.status).toBe(200);
		const hf = hfResult.body.data?.data ?? hfResult.body.data;
		expect(hf.healthFactor).toBeDefined();
		expect(typeof hf.healthFactor).toBe("number");
	});
});
