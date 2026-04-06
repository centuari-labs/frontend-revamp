import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, waitFor } from "@testing-library/react";
import { renderHookWithProviders } from "@/__tests__/helpers/render-with-providers";

vi.mock("@privy-io/react-auth", () => ({
	usePrivy: vi.fn(() => ({
		user: { wallet: { address: "0x123" } },
		getAccessToken: vi.fn().mockResolvedValue("mock-jwt-token"),
	})),
}));

const mockGetToken = vi.fn().mockResolvedValue("mock-jwt-token");
vi.mock("@/hooks/use-auth-token", () => ({
	useAuthToken: () => ({
		getToken: mockGetToken,
	}),
}));

vi.mock("@/lib/api", () => ({
	submitWithdraw: vi.fn(async () => ({
		txHash: "0xmock_tx_hash",
		status: "success",
	})),
}));

import { useWithdraw } from "@/hooks/use-withdraw";

beforeEach(() => {
	vi.clearAllMocks();
});

describe("useWithdraw (mock mode)", () => {
	it("starts with idle status", () => {
		const { result } = renderHookWithProviders(() => useWithdraw());
		expect(result.current.withdrawStatus).toBe("idle");
		expect(result.current.withdrawError).toBeNull();
		expect(result.current.txHash).toBeNull();
	});

	it("simulates withdrawal and transitions to success", async () => {
		const { result } = renderHookWithProviders(() => useWithdraw());

		await act(async () => {
			await result.current.withdraw("asset-123", "100");
		});

		await waitFor(() => {
			expect(result.current.withdrawStatus).toBe("success");
		});
		expect(result.current.txHash).toBe("0xmock_tx_hash");
	});

	it("resets state correctly", async () => {
		const { result } = renderHookWithProviders(() => useWithdraw());

		await act(async () => {
			await result.current.withdraw("asset-123", "100");
		});

		await waitFor(() => {
			expect(result.current.withdrawStatus).toBe("success");
		});

		act(() => {
			result.current.reset();
		});

		await waitFor(() => {
			expect(result.current.withdrawStatus).toBe("idle");
		});
		expect(result.current.txHash).toBeNull();
	});
});
