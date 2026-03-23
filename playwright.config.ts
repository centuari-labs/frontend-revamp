import { defineConfig } from "@playwright/test";

export default defineConfig({
	use: {
		baseURL: process.env.API_BASE_URL || "http://localhost:8080",
	},
	testDir: "./e2e",
	/* Give settlement + matching engine time to process */
	timeout: 120_000,
});
