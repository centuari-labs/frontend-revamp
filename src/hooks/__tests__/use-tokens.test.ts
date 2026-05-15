import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { Token } from "@/types";

vi.mock("@/hooks/use-deposit-tokens", () => ({
	useDepositTokens: vi.fn(),
}));

import { useDepositTokens } from "@/hooks/use-deposit-tokens";
import { useTokens, getTokenById } from "@/hooks/use-tokens";

const mockTokens: Token[] = [
	{
		id: "token-uuid-usdc",
		symbol: "USDC",
		name: "USD Coin",
		tokenAddress: "0xUSDC",
		decimals: 6,
		imageUrl: "/tokens/usdc-icon.webp",
		chainId: 421614,
	},
	{
		id: "token-uuid-eth",
		symbol: "ETH",
		name: "Ethereum",
		tokenAddress: "0xETH",
		decimals: 18,
		imageUrl: null,
		chainId: 421614,
	},
];

function mockDepositTokens(data: Token[] | undefined, isLoading = false) {
	(useDepositTokens as ReturnType<typeof vi.fn>).mockReturnValue({
		data,
		isLoading,
	});
}

beforeEach(() => {
	localStorage.clear();
	vi.clearAllMocks();
});

describe("useTokens", () => {
	it("returns empty tokens and isLoading=true on first visit with no cache", () => {
		mockDepositTokens(undefined, true);

		const { result } = renderHook(() => useTokens());

		expect(result.current.tokens).toEqual([]);
		expect(result.current.isLoading).toBe(true);
	});

	it("returns cached tokens from localStorage immediately", () => {
		localStorage.setItem("centuari_tokens", JSON.stringify(mockTokens));
		mockDepositTokens(undefined, true);

		const { result } = renderHook(() => useTokens());

		expect(result.current.tokens).toEqual(mockTokens);
		expect(result.current.isLoading).toBe(false);
	});

	it("writes fresh data to localStorage when fetch completes", () => {
		mockDepositTokens(mockTokens, false);

		renderHook(() => useTokens());

		const stored = JSON.parse(localStorage.getItem("centuari_tokens") ?? "[]");
		expect(stored).toEqual(mockTokens);
	});

	it("updates state when fresh data arrives", () => {
		mockDepositTokens(mockTokens, false);

		const { result } = renderHook(() => useTokens());

		expect(result.current.tokens).toEqual(mockTokens);
	});

	it("falls back to empty array on corrupted localStorage", () => {
		localStorage.setItem("centuari_tokens", "not-json");
		mockDepositTokens(undefined, false);

		const { result } = renderHook(() => useTokens());

		expect(result.current.tokens).toEqual([]);
	});

	it("reacts to centuari-tokens-updated event for same-tab sync", () => {
		mockDepositTokens(undefined, false);

		const { result } = renderHook(() => useTokens());

		localStorage.setItem("centuari_tokens", JSON.stringify(mockTokens));
		act(() => {
			window.dispatchEvent(new Event("centuari-tokens-updated"));
		});

		expect(result.current.tokens).toEqual(mockTokens);
	});

	it("reacts to storage event for cross-tab sync", () => {
		mockDepositTokens(undefined, false);

		const { result } = renderHook(() => useTokens());

		localStorage.setItem("centuari_tokens", JSON.stringify(mockTokens));
		act(() => {
			window.dispatchEvent(new Event("storage"));
		});

		expect(result.current.tokens).toEqual(mockTokens);
	});
});

describe("getTokenById", () => {
	it("finds a token by id", () => {
		expect(getTokenById(mockTokens, "token-uuid-usdc")).toEqual(mockTokens[0]);
	});

	it("returns undefined for unknown id", () => {
		expect(getTokenById(mockTokens, "unknown")).toBeUndefined();
	});
});
