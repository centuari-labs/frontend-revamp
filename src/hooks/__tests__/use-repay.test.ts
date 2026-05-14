import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { renderHookWithProviders } from "@/__tests__/helpers/render-with-providers";
import { useRepay } from "@/hooks/use-repay";

vi.mock("@privy-io/react-auth", () => ({
	usePrivy: vi.fn(() => ({
		user: { wallet: { address: "0x123" } },
		getAccessToken: vi.fn().mockResolvedValue("mock-token"),
	})),
}));

vi.mock("@/hooks/use-auth-token", () => ({
	useAuthToken: vi.fn(() => ({
		getToken: vi.fn(async () => "mock-token"),
		authFetch: vi.fn(async (fn: (t: string) => Promise<unknown>) =>
			fn("mock-token"),
		),
	})),
}));

vi.mock("@/lib/api", () => ({
	submitRepay: vi.fn(async () => ({ success: true })),
}));

import { submitRepay } from "@/lib/api";

beforeEach(() => {
	vi.clearAllMocks();
});

describe("useRepay", () => {
	it("isPending starts as false", () => {
		const { result } = renderHookWithProviders(() => useRepay());
		expect(result.current.isPending).toBe(false);
	});

	it("repay calls submitRepay via API", async () => {
		const { result } = renderHookWithProviders(() => useRepay());

		await act(async () => {
			await result.current.repay({
				marketId: "m1",
				amount: 100,
				futureAmount: 105,
				tokenValue: "usdc",
			});
		});

		expect(submitRepay).toHaveBeenCalledWith("m1", "100", "mock-token");
		expect(result.current.isPending).toBe(false);
	});
});
