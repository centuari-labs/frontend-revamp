import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3200";

test.describe("Browser smoke tests — post-refactor verification", () => {
	test("home page loads without errors", async ({ page }) => {
		const errors: string[] = [];
		page.on("pageerror", (err) => errors.push(err.message));

		await page.goto(BASE);
		await expect(page).toHaveTitle(/Centuari/i);
		expect(errors).toEqual([]);
	});

	test("market page loads and renders content", async ({ page }) => {
		const errors: string[] = [];
		page.on("pageerror", (err) => errors.push(err.message));

		await page.goto(`${BASE}/market`);
		await page.waitForLoadState("networkidle");

		// Page should have rendered something (not a blank/error page)
		const body = await page.locator("body").innerText();
		expect(body.length).toBeGreaterThan(0);
		expect(errors).toEqual([]);
	});

	test("portfolio page loads without errors", async ({ page }) => {
		const errors: string[] = [];
		page.on("pageerror", (err) => errors.push(err.message));

		await page.goto(`${BASE}/portfolio`);
		await page.waitForLoadState("networkidle");

		const body = await page.locator("body").innerText();
		expect(body.length).toBeGreaterThan(0);
		expect(errors).toEqual([]);
	});

	test("faucet page loads without errors", async ({ page }) => {
		const errors: string[] = [];
		page.on("pageerror", (err) => errors.push(err.message));

		await page.goto(`${BASE}/faucet`);
		await page.waitForLoadState("networkidle");

		const body = await page.locator("body").innerText();
		expect(body.length).toBeGreaterThan(0);
		expect(errors).toEqual([]);
	});

	test("points page loads without errors", async ({ page }) => {
		const errors: string[] = [];
		page.on("pageerror", (err) => errors.push(err.message));

		await page.goto(`${BASE}/points`);
		await page.waitForLoadState("networkidle");

		const body = await page.locator("body").innerText();
		expect(body.length).toBeGreaterThan(0);
		expect(errors).toEqual([]);
	});

	test("no console errors related to query keys on market page", async ({ page }) => {
		const consoleErrors: string[] = [];
		page.on("console", (msg) => {
			if (msg.type() === "error") {
				consoleErrors.push(msg.text());
			}
		});

		await page.goto(`${BASE}/market`);
		await page.waitForLoadState("networkidle");
		// Wait a bit for any async queries to fire
		await page.waitForTimeout(3000);

		// Filter for query-key related errors (invalidation, fetch failures from our refactor)
		const queryKeyErrors = consoleErrors.filter(
			(msg) =>
				msg.includes("queryKey") ||
				msg.includes("invalidateQueries") ||
				msg.includes("QUERY_KEYS"),
		);
		expect(queryKeyErrors).toEqual([]);
	});

	test("no console errors related to query keys on portfolio page", async ({ page }) => {
		const consoleErrors: string[] = [];
		page.on("console", (msg) => {
			if (msg.type() === "error") {
				consoleErrors.push(msg.text());
			}
		});

		await page.goto(`${BASE}/portfolio`);
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(3000);

		const queryKeyErrors = consoleErrors.filter(
			(msg) =>
				msg.includes("queryKey") ||
				msg.includes("invalidateQueries") ||
				msg.includes("QUERY_KEYS"),
		);
		expect(queryKeyErrors).toEqual([]);
	});

	test("404 page renders for unknown route", async ({ page }) => {
		const errors: string[] = [];
		page.on("pageerror", (err) => errors.push(err.message));

		await page.goto(`${BASE}/this-does-not-exist`);
		await page.waitForLoadState("networkidle");
		expect(errors).toEqual([]);
	});
});
