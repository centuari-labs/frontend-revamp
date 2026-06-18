import { test, expect } from "@playwright/test";
import {
	LENDER_AUTH,
	getDepositTokens,
	getDepositBalance,
	confirmDeposit,
} from "./helpers/api";

test.describe("Deposit E2E", () => {
	test.describe("GET /deposit/tokens", () => {
		test("Returns deposit token list (no auth required)", async ({
			request,
		}) => {
			const result = await getDepositTokens(request);

			expect(result.status).toBe(200);
			const data = result.body.data?.data ?? result.body.data;
			expect(Array.isArray(data)).toBe(true);

			if (data.length > 0) {
				const first = data[0];
				expect(first.id).toBeDefined();
				expect(first.symbol).toBeDefined();
				expect(first.name).toBeDefined();
				expect(first.tokenAddress).toBeDefined();
			}
		});
	});

	test.describe("GET /deposit/balance/:assetId", () => {
		test("Returns balance for valid asset", async ({ request }) => {
			const tokensResult = await getDepositTokens(request);
			const tokens = tokensResult.body.data?.data ?? tokensResult.body.data;

			if (!tokens || tokens.length === 0) {
				test.skip(true, "No deposit tokens available");
				return;
			}

			const assetId = tokens[0].id;
			const result = await getDepositBalance(
				request,
				LENDER_AUTH,
				assetId,
			);

			expect(result.status).toBe(200);
			const data = result.body.data?.data ?? result.body.data;
			expect(data).toBeDefined();
			expect(data.balance).toBeDefined();
			expect(data.symbol).toBeDefined();
		});

		test("Reject invalid UUID format", async ({ request }) => {
			const result = await getDepositBalance(
				request,
				LENDER_AUTH,
				"not-a-uuid",
			);
			expect(result.status).toBeGreaterThanOrEqual(400);
		});

		test("Reject without auth", async ({ request }) => {
			const res = await request.get(
				"/deposit/balance/00000000-0000-0000-0000-000000000000",
			);
			expect(res.status()).toBe(401);
		});
	});

	test.describe("POST /deposit/confirm", () => {
		test("Reject invalid txHash format", async ({ request }) => {
			const result = await confirmDeposit(
				request,
				LENDER_AUTH,
				"not-a-hash",
			);
			expect(result.status).toBeGreaterThanOrEqual(400);
		});

		test("Reject without auth", async ({ request }) => {
			const res = await request.post("/deposit/confirm", {
				data: { txHash: "0x" + "a".repeat(64) },
			});
			expect(res.status()).toBe(401);
		});

		test("Handle unknown txHash gracefully", async ({ request }) => {
			const result = await confirmDeposit(
				request,
				LENDER_AUTH,
				"0x" + "a".repeat(64),
			);
			// Should return 400 or specific error (tx not found on-chain)
			expect(result.status).toBeGreaterThanOrEqual(400);
		});
	});
});
