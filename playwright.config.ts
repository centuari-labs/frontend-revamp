import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	/* Give settlement + matching engine time to process */
	timeout: 120_000,
	use: {
		baseURL: process.env.API_BASE_URL || "http://localhost:8080",
	},
	projects: [
		{
			name: "setup",
			testMatch: /auth\.setup\.ts/,
		},
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
			dependencies: ["setup"],
			testIgnore: [/auth\.setup\.ts/, /capture-privy-session\.ts/],
		},
		{
			name: "capture",
			testMatch: /capture-privy-session\.ts/,
			use: { ...devices["Desktop Chrome"], headless: false },
		},
	],
});
