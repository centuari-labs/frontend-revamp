import { describe, it, expect, vi } from "vitest";
import { QUERY_KEYS, invalidateUserQueries } from "@/lib/query-keys";

describe("QUERY_KEYS", () => {
	it("exports all expected key constants", () => {
		expect(QUERY_KEYS.MY_ASSETS).toBe("my-assets");
		expect(QUERY_KEYS.MY_PORTFOLIO).toBe("my-portfolio");
		expect(QUERY_KEYS.LEND_BORROW_ASSETS).toBe("lend-borrow-assets");
		expect(QUERY_KEYS.MY_POSITIONS).toBe("my-positions");
		expect(QUERY_KEYS.OPEN_ORDERS).toBe("open-orders");
		expect(QUERY_KEYS.ORDER_HISTORY).toBe("order-history");
		expect(QUERY_KEYS.USER_DETAILS).toBe("user-details");
	});

	it("contains exactly 7 keys", () => {
		expect(Object.keys(QUERY_KEYS)).toHaveLength(7);
	});
});

describe("invalidateUserQueries", () => {
	it("invalidates all 7 query keys", () => {
		const mockInvalidateQueries = vi.fn();
		const mockQueryClient = {
			invalidateQueries: mockInvalidateQueries,
		};

		invalidateUserQueries(mockQueryClient as never);

		expect(mockInvalidateQueries).toHaveBeenCalledTimes(7);
	});

	it("passes each key wrapped in an array", () => {
		const mockInvalidateQueries = vi.fn();
		const mockQueryClient = {
			invalidateQueries: mockInvalidateQueries,
		};

		invalidateUserQueries(mockQueryClient as never);

		const expectedKeys = [
			"my-assets",
			"my-portfolio",
			"lend-borrow-assets",
			"my-positions",
			"open-orders",
			"order-history",
			"user-details",
		];

		for (const key of expectedKeys) {
			expect(mockInvalidateQueries).toHaveBeenCalledWith({
				queryKey: [key],
			});
		}
	});

	it("invalidation keys match QUERY_KEYS values exactly", () => {
		const mockInvalidateQueries = vi.fn();
		const mockQueryClient = {
			invalidateQueries: mockInvalidateQueries,
		};

		invalidateUserQueries(mockQueryClient as never);

		const calledKeys = mockInvalidateQueries.mock.calls.map(
			(call: [{ queryKey: string[] }]) => call[0].queryKey[0],
		);

		expect(calledKeys).toEqual(Object.values(QUERY_KEYS));
	});
});
