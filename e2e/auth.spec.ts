import { test, expect } from "@playwright/test";
import {
	LENDER_AUTH,
	LENDER_WALLET,
	validateWallet,
	login,
	updateName,
} from "./helpers/api";

test.describe("Auth E2E", () => {
	test.describe("POST /auth/validate", () => {
		test("Validate valid wallet address", async ({ request }) => {
			const result = await validateWallet(request, LENDER_WALLET);

			expect(result.status).toBeLessThan(300);
			const data = result.body.data?.data ?? result.body.data;
			expect(data).toBeDefined();
			expect(data.wallet_address).toBe(LENDER_WALLET);
			expect(data.paired_wallet_address).toBeDefined();
		});

		test("Reject invalid wallet format", async ({ request }) => {
			const result = await validateWallet(request, "not-a-wallet");
			expect(result.status).toBeGreaterThanOrEqual(400);
		});

		test("Reject empty body", async ({ request }) => {
			const res = await request.post("/auth/validate", { data: {} });
			expect(res.status()).toBeGreaterThanOrEqual(400);
		});
	});

	test.describe("POST /auth/login", () => {
		test("Login with valid auth token", async ({ request }) => {
			const result = await login(request, LENDER_AUTH);
			expect(result.status).toBeLessThan(300);
		});

		test("Reject without auth", async ({ request }) => {
			const res = await request.post("/auth/login");
			expect(res.status()).toBe(401);
		});
	});

	test.describe("PATCH /auth/name", () => {
		test("Update display name", async ({ request }) => {
			const name = `TestUser_${Date.now()}`;
			const result = await updateName(request, LENDER_AUTH, name);
			expect(result.status).toBeLessThan(300);
		});

		test("Reject without auth", async ({ request }) => {
			const res = await request.patch("/auth/name", {
				data: { name: "TestUser" },
			});
			expect(res.status()).toBe(401);
		});

		test("Reject empty name", async ({ request }) => {
			const result = await updateName(request, LENDER_AUTH, "");
			expect(result.status).toBeGreaterThanOrEqual(400);
		});
	});
});
