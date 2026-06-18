import { describe, it, expect } from "vitest";
import { isLendPosition, isBorrowPosition } from "@/types/positions";
import {
	makeLendPosition,
	makeBorrowPosition,
} from "@/__tests__/helpers/fixtures/positions";

describe("isLendPosition", () => {
	it("returns true for lend position", () => {
		expect(isLendPosition(makeLendPosition())).toBe(true);
	});

	it("returns false for borrow position", () => {
		expect(isLendPosition(makeBorrowPosition())).toBe(false);
	});
});

describe("isBorrowPosition", () => {
	it("returns true for borrow position", () => {
		expect(isBorrowPosition(makeBorrowPosition())).toBe(true);
	});

	it("returns false for lend position", () => {
		expect(isBorrowPosition(makeLendPosition())).toBe(false);
	});
});
