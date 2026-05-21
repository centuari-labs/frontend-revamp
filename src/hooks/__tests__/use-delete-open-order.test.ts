import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { renderHookWithProviders } from "@/__tests__/helpers/render-with-providers";
import { useDeleteOpenOrder } from "@/hooks/use-delete-open-order";

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
	cancelOrder: vi.fn(async () => ({ success: true })),
}));

import { cancelOrder } from "@/lib/api";

beforeEach(() => {
	vi.clearAllMocks();
});

describe("useDeleteOpenOrder", () => {
	it("isPending starts as false", () => {
		const { result } = renderHookWithProviders(() => useDeleteOpenOrder());
		expect(result.current.isPending).toBe(false);
	});

	it("deletes order via API", async () => {
		const { result } = renderHookWithProviders(() => useDeleteOpenOrder());

		await act(async () => {
			await result.current.deleteOrder("open-del");
		});

		expect(cancelOrder).toHaveBeenCalledWith("open-del", "mock-token");
	});

	it("exposes both delete and deleteOrder aliases", () => {
		const { result } = renderHookWithProviders(() => useDeleteOpenOrder());
		expect(result.current.delete).toBe(result.current.deleteOrder);
	});
});
