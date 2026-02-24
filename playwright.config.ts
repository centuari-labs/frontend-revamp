import { defineConfig } from "@playwright/test";

export default defineConfig({
	use: {
		baseURL: process.env.API_BASE_URL || "http://localhost:3000",
	},
	testDir: "./e2e",
});
