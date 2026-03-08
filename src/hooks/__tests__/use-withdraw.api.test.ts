import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const mockInvalidateQueries = vi.fn();

vi.mock("@tanstack/react-query", () => ({
	useQueryClient: () => ({
		invalidateQueries: mockInvalidateQueries,
	}),
}));

vi.mock("@/hooks/use-auth-token", () => ({
	useAuthToken: () => ({
		getToken: vi.fn().mockResolvedValue("test-jwt-token"),
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

		const { result } = renderHook(() => useWithdraw());

		await act(async () => {
			await result.current.withdraw("asset-uuid-123", "50.5");
		});

		expect(submitWithdraw).toHaveBeenCalledWith(
			"asset-uuid-123",
			"50.5",
			"test-jwt-token",
		);
		expect(result.current.status).toBe("success");
		expect(result.current.txHash).toBe("0xRealTxHash");
	});

	it("invalidates queries on success", async () => {
		vi.mocked(submitWithdraw).mockResolvedValue({
			txHash: "0xTxHash",
			status: "success",
		});

		const { result } = renderHook(() => useWithdraw());

		await act(async () => {
			await result.current.withdraw("asset-uuid-123", "100");
		});

		expect(mockInvalidateQueries).toHaveBeenCalledWith({
			queryKey: ["my-assets"],
		});
		expect(mockInvalidateQueries).toHaveBeenCalledWith({
			queryKey: ["my-portfolio"],
		});
		expect(mockInvalidateQueries).toHaveBeenCalledWith({
			queryKey: ["lend-borrow-assets"],
		});
	});

	it("handles API error", async () => {
		vi.mocked(submitWithdraw).mockRejectedValue(
			new Error("Insufficient non-collateral balance"),
		);

		const { result } = renderHook(() => useWithdraw());

		await act(async () => {
			await result.current.withdraw("asset-uuid-123", "99999");
		});

		expect(result.current.status).toBe("error");
		expect(result.current.error).toBe(
			"Insufficient non-collateral balance",
		);
		expect(result.current.txHash).toBeNull();
	});

	it("handles API error with non-Error throw", async () => {
		vi.mocked(submitWithdraw).mockRejectedValue("string error");

		const { result } = renderHook(() => useWithdraw());

		await act(async () => {
			await result.current.withdraw("asset-uuid-123", "100");
		});

		expect(result.current.status).toBe("error");
		expect(result.current.error).toBe("Withdrawal failed");
	});
});
