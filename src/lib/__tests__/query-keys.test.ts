import { describe, it, expect, vi } from "vitest";
import { QUERY_KEYS, invalidateUserQueries } from "@/lib/query-keys";

// Keys explicitly excluded from invalidateUserQueries because they are not
// user-scoped (e.g. token list is shared across all users for the chain).
const NON_USER_SCOPED_KEYS = new Set<string>([QUERY_KEYS.DEPOSIT_TOKENS]);

const USER_SCOPED_KEYS = Object.values(QUERY_KEYS).filter(
	(key) => !NON_USER_SCOPED_KEYS.has(key),
);

describe("QUERY_KEYS", () => {
	it("exports all expected key constants", () => {
		expect(QUERY_KEYS.MY_ASSETS).toBe("my-assets");
		expect(QUERY_KEYS.MY_PORTFOLIO).toBe("my-portfolio");
		expect(QUERY_KEYS.LEND_BORROW_ASSETS).toBe("lend-borrow-assets");
		expect(QUERY_KEYS.MY_POSITIONS).toBe("my-positions");
		expect(QUERY_KEYS.OPEN_ORDERS).toBe("open-orders");
		expect(QUERY_KEYS.ORDER_HISTORY).toBe("order-history");
		expect(QUERY_KEYS.USER_DETAILS).toBe("user-details");
		expect(QUERY_KEYS.DEPOSIT_TOKENS).toBe("deposit-tokens");
	});

	it("contains exactly 8 keys", () => {
		expect(Object.keys(QUERY_KEYS)).toHaveLength(8);
	});
});

describe("invalidateUserQueries", () => {
	it("invalidates only user-scoped query keys", () => {
		const mockInvalidateQueries = vi.fn();
		const mockQueryClient = {
			invalidateQueries: mockInvalidateQueries,
		};

		invalidateUserQueries(mockQueryClient as never);

		expect(mockInvalidateQueries).toHaveBeenCalledTimes(
			USER_SCOPED_KEYS.length,
		);
	});

	it("passes each user-scoped key wrapped in an array", () => {
		const mockInvalidateQueries = vi.fn();
		const mockQueryClient = {
			invalidateQueries: mockInvalidateQueries,
		};

		invalidateUserQueries(mockQueryClient as never);

		for (const key of USER_SCOPED_KEYS) {
			expect(mockInvalidateQueries).toHaveBeenCalledWith({
				queryKey: [key],
			});
		}
	});

	it("does not invalidate non-user-scoped keys (e.g. token list)", () => {
		const mockInvalidateQueries = vi.fn();
		const mockQueryClient = {
			invalidateQueries: mockInvalidateQueries,
		};

		invalidateUserQueries(mockQueryClient as never);

		const calledKeys = mockInvalidateQueries.mock.calls.map(
			(call: [{ queryKey: string[] }]) => call[0].queryKey[0],
		);

		for (const excluded of NON_USER_SCOPED_KEYS) {
			expect(calledKeys).not.toContain(excluded);
		}
	});
});
