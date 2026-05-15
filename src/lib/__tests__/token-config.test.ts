import { describe, it, expect } from "vitest";
import {
	isAllowlistedAddress,
	getAllowlistedAddresses,
	assertAllowlistedAddress,
} from "@/lib/token-config";

const ARB_SEPOLIA = 421614;
const USDC_CHECKSUM = "0x218A9082C712FA709c044a6cea6Ef333df04cc3d";
const USDC_LOWER = USDC_CHECKSUM.toLowerCase();
const NOT_ALLOWLISTED = "0x000000000000000000000000000000000000dEaD";

describe("getAllowlistedAddresses", () => {
	it("returns all 11 ARB Sepolia testnet token addresses", () => {
		const list = getAllowlistedAddresses(ARB_SEPOLIA);
		expect(list).toHaveLength(11);
		expect(list).toContain(USDC_CHECKSUM);
	});

	it("returns checksummed addresses", () => {
		const list = getAllowlistedAddresses(ARB_SEPOLIA);
		for (const addr of list) {
			expect(addr).toMatch(/^0x[a-fA-F0-9]{40}$/);
			expect(addr).not.toBe(addr.toLowerCase());
		}
	});

	it("returns empty array for unknown chainId", () => {
		expect(getAllowlistedAddresses(1)).toEqual([]);
	});
});

describe("isAllowlistedAddress", () => {
	it("accepts a checksummed allowlisted address", () => {
		expect(isAllowlistedAddress(ARB_SEPOLIA, USDC_CHECKSUM)).toBe(true);
	});

	it("accepts a lowercase variant of an allowlisted address", () => {
		expect(isAllowlistedAddress(ARB_SEPOLIA, USDC_LOWER)).toBe(true);
	});

	it("rejects a valid but non-allowlisted address", () => {
		expect(isAllowlistedAddress(ARB_SEPOLIA, NOT_ALLOWLISTED)).toBe(false);
	});

	it("rejects an unknown chainId", () => {
		expect(isAllowlistedAddress(1, USDC_CHECKSUM)).toBe(false);
	});

	it("returns false (no throw) for malformed address input", () => {
		expect(isAllowlistedAddress(ARB_SEPOLIA, "")).toBe(false);
		expect(isAllowlistedAddress(ARB_SEPOLIA, "0xnotanaddress")).toBe(false);
		expect(isAllowlistedAddress(ARB_SEPOLIA, "garbage")).toBe(false);
	});
});

describe("assertAllowlistedAddress", () => {
	it("returns the checksummed form for a lowercase allowlisted address", () => {
		expect(assertAllowlistedAddress(ARB_SEPOLIA, USDC_LOWER, "test")).toBe(
			USDC_CHECKSUM,
		);
	});

	it("passes through a checksummed allowlisted address unchanged", () => {
		expect(assertAllowlistedAddress(ARB_SEPOLIA, USDC_CHECKSUM, "test")).toBe(
			USDC_CHECKSUM,
		);
	});

	it("throws for an invalid address", () => {
		expect(() => assertAllowlistedAddress(ARB_SEPOLIA, "", "token X")).toThrow(
			/Invalid Ethereum address \(token X\)/,
		);
		expect(() =>
			assertAllowlistedAddress(ARB_SEPOLIA, null, "token X"),
		).toThrow(/Invalid Ethereum address \(token X\)/);
		expect(() =>
			assertAllowlistedAddress(ARB_SEPOLIA, "0xinvalid", "token X"),
		).toThrow(/Invalid Ethereum address/);
	});

	it("throws for a valid but non-allowlisted address", () => {
		expect(() =>
			assertAllowlistedAddress(ARB_SEPOLIA, NOT_ALLOWLISTED, "token X"),
		).toThrow(/Address not in allowlist for chain 421614 \(token X\)/);
	});

	it("throws for unknown chainId even with a valid address", () => {
		expect(() => assertAllowlistedAddress(1, USDC_CHECKSUM, "token X")).toThrow(
			/Address not in allowlist for chain 1/,
		);
	});
});
