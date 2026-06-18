import { describe, it, expect } from "vitest";
import {
	MAX_APR_PCT,
	MIN_APR_PCT,
	mapOrderErrorToFriendlyMessage,
} from "@/lib/order-errors";

describe("mapOrderErrorToFriendlyMessage", () => {
	it("maps class-validator rate-too-big message to friendly copy", () => {
		expect(
			mapOrderErrorToFriendlyMessage(
				"Rate must not exceed 10000 basis points (100%)",
			),
		).toBe(`Target APR cannot exceed ${MAX_APR_PCT}%.`);
	});

	it("maps Zod too_big rate issue to friendly copy", () => {
		const zodMessage = JSON.stringify([
			{
				code: "too_big",
				maximum: 10000,
				type: "number",
				message: "Rate must not exceed 10000 basis points (100%)",
				path: ["rate"],
			},
		]);
		expect(mapOrderErrorToFriendlyMessage(zodMessage)).toBe(
			`Target APR cannot exceed ${MAX_APR_PCT}%.`,
		);
	});

	it("maps class-validator rate-too-small message to friendly copy", () => {
		expect(
			mapOrderErrorToFriendlyMessage(
				"Rate must be at least 1 basis point (0.01%)",
			),
		).toBe(`Target APR must be at least ${MIN_APR_PCT}%.`);
	});

	it("maps Zod too_small rate issue to friendly copy", () => {
		const zodMessage = JSON.stringify([
			{
				code: "too_small",
				minimum: 1,
				message: "Rate must be at least 1 basis point",
				path: ["rate"],
			},
		]);
		expect(mapOrderErrorToFriendlyMessage(zodMessage)).toBe(
			`Target APR must be at least ${MIN_APR_PCT}%.`,
		);
	});

	it("maps amount-too-small message to friendly copy", () => {
		expect(
			mapOrderErrorToFriendlyMessage("amount must be at least 10 USD"),
		).toBe("Order amount must be at least 10 USD.");
	});

	it("maps internal server error message to generic copy", () => {
		expect(
			mapOrderErrorToFriendlyMessage(
				"Internal server error: something blew up",
			),
		).toBe("Something went wrong. Please try again.");
	});

	it("returns the original message when no rule matches", () => {
		const raw = "Network request failed";
		expect(mapOrderErrorToFriendlyMessage(raw)).toBe(raw);
	});

	it("does not match too_big without rate path", () => {
		const raw = "value too_big for column amount";
		expect(mapOrderErrorToFriendlyMessage(raw)).toBe(raw);
	});
});
