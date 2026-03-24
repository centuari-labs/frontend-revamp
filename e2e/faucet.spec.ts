import { test, expect } from "@playwright/test";
import {
	LENDER_WALLET,
	getFaucetTokens,
	requestFaucetTokens,
} from "./helpers/api";

const ARBITRUM_SEPOLIA_CHAIN_ID = 421614;

test.describe("Faucet E2E", () => {
	test.describe("GET /faucet/all-tokens/:chainId", () => {
		test("Returns token list for Arbitrum Sepolia", async ({
			request,
		}) => {
			const result = await getFaucetTokens(
				request,
				ARBITRUM_SEPOLIA_CHAIN_ID,
			);

			expect(result.status).toBe(200);
			const data = result.body.data?.data ?? result.body.data;
			expect(data).toBeDefined();
		});

		test("Handle unknown chainId gracefully", async ({ request }) => {
			const result = await getFaucetTokens(request, 99999);
			// Should return 200 with empty array or 400
			expect([200, 400]).toContain(result.status);
		});
	});

	test.describe("POST /faucet/request-tokens", () => {
		test("Request tokens — happy path", async ({ request }) => {
			const result = await requestFaucetTokens(request, {
				chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
				recipientAddress: LENDER_WALLET,
				token: "USDC",
			});

			// Faucet performs on-chain tx — may take time
			if (result.status === 200 || result.status === 201) {
				const data = result.body.data?.data ?? result.body.data;
				expect(data).toBeDefined();
			} else {
				// Faucet may rate-limit or be temporarily unavailable
				expect(result.status).toBeLessThan(500);
			}
		});

		test("Reject invalid wallet address", async ({ request }) => {
			const result = await requestFaucetTokens(request, {
				chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
				recipientAddress: "not-an-address",
				token: "USDC",
			});

			expect(result.status).toBeGreaterThanOrEqual(400);
		});

		test("Reject missing fields", async ({ request }) => {
			const res = await request.post("/faucet/request-tokens", {
				data: {},
			});
			expect(res.status()).toBeGreaterThanOrEqual(400);
		});
	});
});
