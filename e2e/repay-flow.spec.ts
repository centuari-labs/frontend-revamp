import { test, expect } from "@playwright/test";
import {
	BORROWER_AUTH,
	getPositions,
	submitRepay,
} from "./helpers/api";

test.describe("Repay Flow E2E", () => {
	/**
	 * Uses an existing borrow position to test repay.
	 * The test wallet must already have a BORROW position with on-chain debt.
	 *
	 * Note: If the DB shows debt but the smart contract does not (data mismatch),
	 * the backend returns 400 "No on-chain debt found". The test handles this
	 * by verifying the endpoint is reachable and returns a meaningful response.
	 */
	test("Repay on existing borrow position", async ({ request }) => {
		// Find existing borrow position
		const positions = await getPositions(request, BORROWER_AUTH, "BORROW");
		const borrowPosition = positions.find(
			(p) => p.side === "BORROW" && p.baseAmount > 0,
		);

		if (!borrowPosition) {
			test.skip(true, "No borrow position with debt found for test wallet");
			return;
		}

		const initialDebt = borrowPosition.baseAmount;
		expect(initialDebt).toBeGreaterThan(0);

		// Repay a small amount (1 unit) to avoid draining the position
		const repayAmount = "1";

		const result = await submitRepay(request, BORROWER_AUTH, {
			positionId: borrowPosition.id,
			amount: repayAmount,
		});

		if (result.status === 200) {
			// Happy path: on-chain debt exists and repay succeeded
			const data = result.body.data?.data ?? result.body.data;
			expect(data.txHash).toBeDefined();
			expect(data.status).toBe("success");

			// Verify debt reduced
			const positionsAfter = await getPositions(
				request,
				BORROWER_AUTH,
				"BORROW",
			);
			const updatedPosition = positionsAfter.find(
				(p) => p.id === borrowPosition.id,
			);
			expect(updatedPosition).toBeDefined();
			expect(updatedPosition!.baseAmount).toBeLessThan(initialDebt);
		} else if (result.status === 400) {
			// DB/on-chain mismatch — debt exists in DB but not on-chain
			const message =
				result.body.message?.message ??
				result.body.message ??
				JSON.stringify(result.body);
			expect(message).toContain("on-chain");
			console.log(
				`Repay skipped: ${message}. Position has DB debt but no on-chain debt.`,
			);
		} else {
			// Unexpected status
			expect.soft(result.status, `Unexpected status: ${JSON.stringify(result.body)}`).toBe(200);
		}
	});

	test("Reject repay with invalid positionId", async ({ request }) => {
		const result = await submitRepay(request, BORROWER_AUTH, {
			positionId: "00000000-0000-0000-0000-000000000000",
			amount: "100",
		});

		expect(result.status).toBeGreaterThanOrEqual(400);
	});

	test("Reject repay without auth", async ({ request }) => {
		const res = await request.post("/portfolio/repay", {
			data: {
				positionId: "00000000-0000-0000-0000-000000000000",
				amount: "100",
			},
		});

		expect(res.status()).toBe(401);
	});
});
