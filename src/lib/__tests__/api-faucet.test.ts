import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestFaucetTokens } from "@/lib/api";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
	vi.clearAllMocks();
});

describe("requestFaucetTokens", () => {
	it("posts via apiClient with Bearer JWT and backend-shaped body", async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => ({
				statusCode: 200,
				data: {
					chainId: 421614,
					recipientAddress: "0xabc",
					transactionHash: "0xdef",
					blockNumber: "1",
					status: "completed",
					results: [],
				},
			}),
		});

		await requestFaucetTokens(421614, "0xabc", ["USDC", "USDT"], "jwt-tok");

		expect(mockFetch).toHaveBeenCalledWith("/api/faucet/request-tokens", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: "Bearer jwt-tok",
			},
			body: JSON.stringify({
				chainId: 421614,
				recipientAddress: "0xabc",
				token: ["USDC", "USDT"],
			}),
		});
	});
});
