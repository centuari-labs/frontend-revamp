import { test, expect } from "@playwright/test";
import {
	LENDER_AUTH,
	getMarkets,
	filterMaturedMarkets,
	getPositions,
	submitWithdrawLendPosition,
} from "./helpers/api";

test.describe("Withdraw Lend Position E2E", () => {
	/**
	 * Verify that withdrawing an unmatured position is rejected.
	 * Uses an existing lend position with future maturity.
	 */
	test("Reject withdrawal before maturity", async ({ request }) => {
		const positions = await getPositions(request, LENDER_AUTH, "LEND");
		const nowSec = Math.floor(Date.now() / 1000);

		const futurePosition = positions.find(
			(p) =>
				p.side === "LEND" &&
				p.shares > 0 &&
				p.maturity != null &&
				p.maturity > nowSec,
		);

		if (!futurePosition) {
			test.skip(
				true,
				"No lend position with future maturity found for test wallet",
			);
			return;
		}

		const result = await submitWithdrawLendPosition(
			request,
			LENDER_AUTH,
			futurePosition.id,
		);

		expect(result.status).toBe(400);
		const message =
			result.body.message?.message ??
			result.body.message ??
			JSON.stringify(result.body);
		expect(message.toLowerCase()).toContain("matured");
	});

	/**
	 * Withdraw from a matured position.
	 * Skips gracefully if no matured lend positions exist.
	 */
	test("Withdraw matured lend position", async ({ request }) => {
		const positions = await getPositions(request, LENDER_AUTH, "LEND");
		const nowSec = Math.floor(Date.now() / 1000);

		const maturedPosition = positions.find(
			(p) =>
				p.shares > 0 &&
				p.maturity != null &&
				p.maturity < nowSec,
		);

		if (!maturedPosition) {
			const markets = await getMarkets(request);
			const futureMaturity = positions
				.filter((p) => p.maturity != null)
				.map((p) => p.maturity as number)
				.sort((a, b) => a - b)[0];

			const nearestDate = futureMaturity
				? new Date(futureMaturity * 1000).toISOString()
				: "unknown";

			test.skip(
				true,
				`No matured lend positions with shares > 0 found. ` +
					`Nearest maturity: ${nearestDate}. Re-run after that date.`,
			);
			return;
		}

		const sharesBefore = maturedPosition.shares;
		expect(sharesBefore).toBeGreaterThan(0);

		const result = await submitWithdrawLendPosition(
			request,
			LENDER_AUTH,
			maturedPosition.id,
		);

		expect([200, 201]).toContain(result.status);
		const data = result.body.data?.data ?? result.body.data;
		expect(data.txHash).toBeDefined();
		expect(data.status).toBe("success");

		// Verify shares reduced after withdrawal
		const positionsAfter = await getPositions(request, LENDER_AUTH, "LEND");
		const updatedPosition = positionsAfter.find(
			(p) => p.id === maturedPosition.id,
		);

		if (updatedPosition) {
			expect(updatedPosition.shares).toBeLessThan(sharesBefore);
		}
	});

	test("Reject withdrawal without auth", async ({ request }) => {
		const res = await request.post("/portfolio/withdraw-lend-position", {
			data: { positionId: "00000000-0000-0000-0000-000000000000" },
		});

		expect(res.status()).toBe(401);
	});
});
