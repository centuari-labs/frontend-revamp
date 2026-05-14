import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, waitFor } from "@testing-library/react";
import { renderHookWithProviders } from "@/__tests__/helpers/render-with-providers";
import { useWithdrawLendPosition } from "@/hooks/use-withdraw-lend-position";

vi.mock("@privy-io/react-auth", () => ({
	usePrivy: vi.fn(() => ({
		user: { wallet: { address: "0x123" } },
		getAccessToken: vi.fn().mockResolvedValue("mock-token"),
	})),
}));

const mockGetToken = vi.fn(async () => "mock-token");
const mockAuthFetch = vi.fn(async (fn: (token: string) => Promise<unknown>) =>
	fn("mock-token"),
);
vi.mock("@/hooks/use-auth-token", () => ({
	useAuthToken: vi.fn(() => ({
		getToken: mockGetToken,
		authFetch: mockAuthFetch,
	})),
}));

vi.mock("@/lib/api", () => ({
	withdrawLendPosition: vi.fn(async () => ({ success: true })),
}));

import { withdrawLendPosition as withdrawLendPositionApi } from "@/lib/api";

beforeEach(() => {
	vi.clearAllMocks();
});

describe("useWithdrawLendPosition", () => {
	it("isPending and isSuccess start as false", () => {
		const { result } = renderHookWithProviders(() => useWithdrawLendPosition());
		expect(result.current.isPending).toBe(false);
		expect(result.current.isSuccess).toBe(false);
	});

	it("withdraw calls API and sets isSuccess", async () => {
		const { result } = renderHookWithProviders(() => useWithdrawLendPosition());

		await act(async () => {
			await result.current.withdraw("market-id-w1");
		});

		expect(withdrawLendPositionApi).toHaveBeenCalledWith(
			"market-id-w1",
			"mock-token",
		);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});
		expect(result.current.isPending).toBe(false);
	});

	it("resetSuccess clears isSuccess", async () => {
		const { result } = renderHookWithProviders(() => useWithdrawLendPosition());

		await act(async () => {
			await result.current.withdraw("market-id-w2");
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		act(() => {
			result.current.resetSuccess();
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(false);
		});
	});
});
