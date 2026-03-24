import { test, expect } from "@playwright/test";
import {
	LENDER_AUTH,
	BORROWER_AUTH,
	getMyPortfolio,
	getMyAssets,
	getLendBorrowAssets,
	getHealthFactor,
	getUserDetails,
	getPositions,
} from "./helpers/api";

test.describe("Portfolio E2E", () => {
	test.describe("GET /portfolio/my-portfolio", () => {
		test("Returns portfolio summary", async ({ request }) => {
			const result = await getMyPortfolio(request, LENDER_AUTH);

			expect(result.status).toBe(200);
			const data = result.body.data?.data ?? result.body.data;
			expect(data).toBeDefined();
			expect(typeof data.totalDeposit).toBe("number");
			expect(typeof data.netAPY).toBe("number");
			expect(data.allocation).toBeDefined();
		});

		test("Reject without auth", async ({ request }) => {
			const res = await request.get("/portfolio/my-portfolio");
			expect(res.status()).toBe(401);
		});
	});

	test.describe("GET /portfolio/my-assets", () => {
		test("Returns user assets with pagination", async ({ request }) => {
			const result = await getMyAssets(request, LENDER_AUTH, {
				page: 1,
				limit: 10,
			});

			expect(result.status).toBe(200);
			const body = result.body.data?.data ?? result.body.data;
			expect(body).toBeDefined();

			// Check pagination metadata exists
			if (body.data) {
				expect(Array.isArray(body.data)).toBe(true);
			}
		});

		test("Reject without auth", async ({ request }) => {
			const res = await request.get("/portfolio/my-assets");
			expect(res.status()).toBe(401);
		});
	});

	test.describe("GET /portfolio/lend-borrow-assets", () => {
		test("Returns chart data", async ({ request }) => {
			const result = await getLendBorrowAssets(
				request,
				LENDER_AUTH,
				30,
			);

			expect(result.status).toBe(200);
			expect(result.body.data).toBeDefined();
		});

		test("Reject without auth", async ({ request }) => {
			const res = await request.get("/portfolio/lend-borrow-assets");
			expect(res.status()).toBe(401);
		});
	});

	test.describe("GET /portfolio/my-health-factor", () => {
		test("Returns health factor data", async ({ request }) => {
			const result = await getHealthFactor(request, LENDER_AUTH);

			expect(result.status).toBe(200);
			const data = result.body.data?.data ?? result.body.data;
			expect(data).toBeDefined();
			expect(typeof data.collateralUsd).toBe("number");
			expect(typeof data.debtUsd).toBe("number");
			expect(typeof data.weightedLtv).toBe("number");
			// healthFactor may be Infinity when no debt
			expect(data.healthFactor).toBeDefined();
		});

		test("Reject without auth", async ({ request }) => {
			const res = await request.get("/portfolio/my-health-factor");
			expect(res.status()).toBe(401);
		});
	});

	test.describe("GET /portfolio/user-details", () => {
		test("Returns detailed user info", async ({ request }) => {
			const result = await getUserDetails(request, LENDER_AUTH);

			expect(result.status).toBe(200);
			const data = result.body.data?.data ?? result.body.data;
			expect(data).toBeDefined();
			expect(Array.isArray(data.assets)).toBe(true);
			expect(typeof data.totalDebtUsd).toBe("number");
			expect(typeof data.healthFactor).toBe("number");
			expect(typeof data.collateralUsd).toBe("number");
		});

		test("Reject without auth", async ({ request }) => {
			const res = await request.get("/portfolio/user-details");
			expect(res.status()).toBe(401);
		});
	});

	test.describe("GET /portfolio/my-position", () => {
		test("Filter positions by LEND type", async ({ request }) => {
			const positions = await getPositions(
				request,
				LENDER_AUTH,
				"LEND",
			);

			// All returned positions should be LEND side
			for (const pos of positions) {
				expect(pos.side).toBe("LEND");
			}
		});

		test("Filter positions by BORROW type", async ({ request }) => {
			const positions = await getPositions(
				request,
				BORROWER_AUTH,
				"BORROW",
			);

			for (const pos of positions) {
				expect(pos.side).toBe("BORROW");
			}
		});

		test("Reject without auth", async ({ request }) => {
			const res = await request.get("/portfolio/my-position");
			expect(res.status()).toBe(401);
		});
	});
});
