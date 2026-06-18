import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, waitFor } from "@testing-library/react";
import { renderHookWithProviders } from "@/__tests__/helpers/render-with-providers";

vi.mock("@privy-io/react-auth", () => ({
	usePrivy: vi.fn(() => ({
		user: { wallet: { address: "0x123" } },
		getAccessToken: vi.fn().mockResolvedValue("test-jwt-token"),
	})),
}));

const mockGetToken = vi.fn().mockResolvedValue("test-jwt-token");
const mockAuthFetch = vi.fn(async (fn: (token: string) => Promise<unknown>) =>
	fn("test-jwt-token"),
);
vi.mock("@/hooks/use-auth-token", () => ({
	useAuthToken: () => ({
		getToken: mockGetToken,
		authFetch: mockAuthFetch,
	}),
}));

// API mode
vi.mock("@/lib/use-mock", () => ({ USE_MOCK: false }));

vi.mock("@/lib/api", () => ({
	submitWithdraw: vi.fn(),
}));

import { useWithdraw } from "@/hooks/use-withdraw";
import { submitWithdraw } from "@/lib/api";

beforeEach(() => {
	vi.clearAllMocks();
});

describe("useWithdraw (API mode)", () => {
	it("calls submitWithdraw with correct params", async () => {
		vi.mocked(submitWithdraw).mockResolvedValue({
			txHash: "0xRealTxHash",
			status: "success",
		});

		const { result } = renderHookWithProviders(() => useWithdraw());

		await act(async () => {
			await result.current.withdraw("asset-uuid-123", "50.5");
		});

		expect(submitWithdraw).toHaveBeenCalledWith(
			"asset-uuid-123",
			"50.5",
			"test-jwt-token",
		);

		await waitFor(() => {
			expect(result.current.withdrawStatus).toBe("success");
		});
		expect(result.current.txHash).toBe("0xRealTxHash");
	});

	it("invalidates queries on success", async () => {
		vi.mocked(submitWithdraw).mockResolvedValue({
			txHash: "0xTxHash",
			status: "success",
		});

		const { result } = renderHookWithProviders(() => useWithdraw());

		await act(async () => {
			await result.current.withdraw("asset-uuid-123", "100");
		});

		await waitFor(() => {
			expect(result.current.withdrawStatus).toBe("success");
		});
	});

	it("handles API error", async () => {
		vi.mocked(submitWithdraw).mockRejectedValue(
			new Error("Insufficient non-collateral balance"),
		);

		const { result } = renderHookWithProviders(() => useWithdraw());

		try {
			await act(async () => {
				await result.current.withdraw("asset-uuid-123", "99999");
			});
		} catch {
			// mutateAsync throws on error
		}

		await waitFor(() => {
			expect(result.current.withdrawStatus).toBe("error");
		});
		expect(result.current.withdrawError).toBe(
			"Insufficient non-collateral balance",
		);
		expect(result.current.txHash).toBeNull();
	});

	it("handles API error with non-Error throw", async () => {
		vi.mocked(submitWithdraw).mockRejectedValue("string error");

		const { result } = renderHookWithProviders(() => useWithdraw());

		try {
			await act(async () => {
				await result.current.withdraw("asset-uuid-123", "100");
			});
		} catch {
			// mutateAsync throws on error
		}

		await waitFor(() => {
			expect(result.current.withdrawStatus).toBe("error");
		});
	});
});
