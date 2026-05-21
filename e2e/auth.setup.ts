/**
 * Playwright setup project — verifies the captured Privy session at
 * `e2e/.auth/privy.json` is present and still valid before any chromium spec
 * that depends on it runs.
 *
 * Fails fast with a clear instruction when:
 *   - the storage state file is missing (run `pnpm test:e2e:capture`)
 *   - the session has expired (the portfolio page lands on the Login Required
 *     gate instead of the My Assets heading — re-capture)
 *
 * Runs as a dependency of the `chromium` project (see playwright.config.ts).
 */

import fs from "node:fs";
import path from "node:path";
import { expect, test as setup } from "@playwright/test";

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3200";
const STATE_PATH = path.join(__dirname, ".auth", "privy.json");

const MISSING_STATE_MESSAGE = [
	"",
	`No captured Privy session at ${STATE_PATH}.`,
	"",
	"  Run:  pnpm test:e2e:capture",
	"  Docs: e2e/.auth/README.md",
	"",
].join("\n");

const EXPIRED_SESSION_MESSAGE = [
	"",
	`Captured Privy session at ${STATE_PATH} is expired or invalid`,
	"(the portfolio page rendered the Login Required gate).",
	"",
	"  Re-capture: pnpm test:e2e:capture",
	"",
].join("\n");

if (!fs.existsSync(STATE_PATH)) {
	throw new Error(MISSING_STATE_MESSAGE);
}

setup.use({ storageState: STATE_PATH });

setup("Privy session is valid", async ({ page }) => {
	await page.goto(`${FRONTEND_URL}/portfolio`);

	const myAssets = page.getByRole("heading", { name: "My Assets" });
	const loginGate = page.getByRole("heading", { name: "Login Required" });

	await Promise.race([
		myAssets.waitFor({ state: "visible", timeout: 15_000 }),
		loginGate.waitFor({ state: "visible", timeout: 15_000 }),
	]).catch(() => {
		// Either never settled; let the assertion below produce the failure.
	});

	if (await loginGate.isVisible().catch(() => false)) {
		throw new Error(EXPIRED_SESSION_MESSAGE);
	}

	await expect(myAssets).toBeVisible({ timeout: 5_000 });
});
