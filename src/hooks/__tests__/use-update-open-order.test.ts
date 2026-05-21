import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { renderHookWithProviders } from "@/__tests__/helpers/render-with-providers";
import { useUpdateOpenOrder } from "@/hooks/use-update-open-order";
import { makeLendPosition } from "@/__tests__/helpers/fixtures/positions";

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
	updateOrder: vi.fn(async () => ({ success: true })),
}));

import { updateOrder } from "@/lib/api";

beforeEach(() => {
	vi.clearAllMocks();
});

describe("useUpdateOpenOrder", () => {
	it("isPending starts as false", () => {
		const { result } = renderHookWithProviders(() => useUpdateOpenOrder());
		expect(result.current.isPending).toBe(false);
	});

	it("updates order via API", async () => {
		const pos = makeLendPosition({ id: "open-upd" });

		const { result } = renderHookWithProviders(() => useUpdateOpenOrder());
		const updated = { ...pos, amount: 999 };

		await act(async () => {
			await result.current.update(updated);
		});

		expect(updateOrder).toHaveBeenCalledWith(
			"open-upd",
			{ amount: "999", rate: updated.apr * 10000 },
			"mock-token",
		);
	});

	it("isPending returns to false after update", async () => {
		const { result } = renderHookWithProviders(() => useUpdateOpenOrder());

		await act(async () => {
			await result.current.update(makeLendPosition());
		});

		expect(result.current.isPending).toBe(false);
	});
});
