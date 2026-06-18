import { describe, it, expect } from "vitest";
import {
	isAllowlistedAddress,
	getAllowlistedAddresses,
	assertAllowlistedAddress,
	getAllowlistedTokenConfig,
} from "@/lib/token-config";

const ARB_MAINNET = 42161;
const ARB_SEPOLIA = 421614;
const MAINNET_USDC = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
const MAINNET_USDT = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9";
const MAINNET_WBTC = "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f";
const MAINNET_WETH = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1";
const TESTNET_USDC = "0x6B8d9A4C6EBC58672c00b7b9CF5f450654f5e1F0";
const TESTNET_USDT = "0x14e0361FEE0942FfC71ff39a463c8aa023Ae7F55";
const USDC_CHECKSUM = TESTNET_USDC;
const USDC_LOWER = USDC_CHECKSUM.toLowerCase();
const NOT_ALLOWLISTED = "0x000000000000000000000000000000000000dEaD";

describe("getAllowlistedAddresses", () => {
	it("returns all 11 ARB Sepolia testnet token addresses", () => {
		const list = getAllowlistedAddresses(ARB_SEPOLIA);
		expect(list).toHaveLength(11);
		expect(list).toContain(USDC_CHECKSUM);
		expect(list).toContain(TESTNET_USDT);
	});

	it("returns explicit Arbitrum One mainnet token addresses", () => {
		const list = getAllowlistedAddresses(ARB_MAINNET);
		expect(list).toHaveLength(8);
		expect(list).toContain(MAINNET_USDC);
		expect(list).toContain(MAINNET_USDT);
		expect(list).toContain(MAINNET_WBTC);
		expect(list).toContain(MAINNET_WETH);
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

describe("getAllowlistedTokenConfig", () => {
	it("returns mainnet addresses with decimals", () => {
		expect(getAllowlistedTokenConfig(ARB_MAINNET, "USDC")).toEqual({
			address: MAINNET_USDC,
			decimals: 6,
		});
		expect(getAllowlistedTokenConfig(ARB_MAINNET, "usdt")).toEqual({
			address: MAINNET_USDT,
			decimals: 6,
		});
		expect(getAllowlistedTokenConfig(ARB_MAINNET, "BTC")).toEqual({
			address: MAINNET_WBTC,
			decimals: 8,
		});
		expect(getAllowlistedTokenConfig(ARB_MAINNET, "ETH")).toEqual({
			address: MAINNET_WETH,
			decimals: 18,
		});
	});

	it("returns testnet decimals metadata", () => {
		expect(getAllowlistedTokenConfig(ARB_SEPOLIA, "USDC")).toEqual({
			address: TESTNET_USDC,
			decimals: 6,
		});
		expect(getAllowlistedTokenConfig(ARB_SEPOLIA, "NVDAon")).toEqual({
			address: "0xDF5063f2264430bBB4432E053782cb03b6aA1c63",
			decimals: 18,
		});
	});

	it("returns undefined for unknown chain or symbol", () => {
		expect(getAllowlistedTokenConfig(1, "USDC")).toBeUndefined();
		expect(getAllowlistedTokenConfig(ARB_MAINNET, "IDRX")).toBeUndefined();
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
