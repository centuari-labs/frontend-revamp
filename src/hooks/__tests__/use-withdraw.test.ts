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
		getToken: vi.fn().mockResolvedValue("mock-jwt-token"),
	}),
}));

// Default: USE_MOCK = true (mock mode)
vi.mock("@/lib/use-mock", () => ({ USE_MOCK: true }));

vi.mock("@/lib/api", () => ({
	submitWithdraw: vi.fn(),
}));

import { useWithdraw } from "@/hooks/use-withdraw";

beforeEach(() => {
	vi.clearAllMocks();
});

describe("useWithdraw (mock mode)", () => {
	it("starts with idle status", () => {
		const { result } = renderHook(() => useWithdraw());
		expect(result.current.status).toBe("idle");
		expect(result.current.error).toBeNull();
		expect(result.current.txHash).toBeNull();
	});

	it("simulates withdrawal and transitions to success", async () => {
		const { result } = renderHook(() => useWithdraw());

		await act(async () => {
			await result.current.withdraw("asset-123", "100");
		});

		expect(result.current.status).toBe("success");
		expect(result.current.txHash).toBe("0xmock_tx_hash");
		expect(result.current.error).toBeNull();
	});

	it("resets state correctly", async () => {
		const { result } = renderHook(() => useWithdraw());

		await act(async () => {
			await result.current.withdraw("asset-123", "100");
		});
		expect(result.current.status).toBe("success");

		act(() => {
			result.current.reset();
		});
		expect(result.current.status).toBe("idle");
		expect(result.current.txHash).toBeNull();
		expect(result.current.error).toBeNull();
	});
});
