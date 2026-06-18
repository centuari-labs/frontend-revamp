import { describe, it, expect, vi, beforeEach } from "vitest";
import { waitFor } from "@testing-library/react";
import { renderHookWithProviders } from "@/__tests__/helpers/render-with-providers";

vi.mock("@privy-io/react-auth", () => ({
	usePrivy: vi.fn(() => ({
		user: { wallet: { address: "0x123" } },
		getAccessToken: vi.fn().mockResolvedValue("test-jwt-token"),
	})),
}));

const mockGetToken = vi.fn().mockResolvedValue("test-jwt-token");
vi.mock("@/hooks/use-auth-token", () => ({
	useAuthToken: () => ({
		getToken: mockGetToken,
		authFetch: vi.fn(),
	}),
}));

// API mode
vi.mock("@/lib/use-mock", () => ({ USE_MOCK: false }));

vi.mock("@/lib/api", () => ({
	getWithdrawableMax: vi.fn(),
}));

import { useWithdrawableMax } from "@/hooks/use-withdrawable-max";
import { getWithdrawableMax } from "@/lib/api";

const sampleResponse = {
	assetId: "asset-uuid-123",
	isCollateral: true,
	availableBalanceBaseUnits: "1000000000",
	availableBalance: "1000",
	currentHealthFactor: 3,
	maxWithdrawableBaseUnits: "530666666",
	maxWithdrawable: "530.666666",
	canUnflag: false,
	bufferBps: 100,
};

beforeEach(() => {
	vi.clearAllMocks();
});

describe("useWithdrawableMax (API mode)", () => {
	it("fetches limits for a collateral asset with the auth token", async () => {
		vi.mocked(getWithdrawableMax).mockResolvedValue(sampleResponse);

		const { result } = renderHookWithProviders(() =>
			useWithdrawableMax("asset-uuid-123", true),
		);

		await waitFor(() => {
			expect(result.current.withdrawableMax).toEqual(sampleResponse);
		});
		expect(getWithdrawableMax).toHaveBeenCalledWith(
			"asset-uuid-123",
			"test-jwt-token",
		);
	});

	it("stays disabled for a non-collateral asset", async () => {
		const { result } = renderHookWithProviders(() =>
			useWithdrawableMax("asset-uuid-123", false),
		);

		// Disabled queries never run their queryFn; give react-query a tick.
		await new Promise((r) => setTimeout(r, 0));

		expect(getWithdrawableMax).not.toHaveBeenCalled();
		expect(result.current.withdrawableMax).toBeNull();
	});

	it("stays disabled when assetId is missing", async () => {
		const { result } = renderHookWithProviders(() =>
			useWithdrawableMax(undefined, true),
		);

		await new Promise((r) => setTimeout(r, 0));

		expect(getWithdrawableMax).not.toHaveBeenCalled();
		expect(result.current.withdrawableMax).toBeNull();
	});
});
