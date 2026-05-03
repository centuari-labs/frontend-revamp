import { waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHookWithProviders } from "@/__tests__/helpers/render-with-providers";

const getDepositTokensMock = vi.fn();
vi.mock("@/lib/api", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/lib/api")>();
	return {
		...actual,
		getDepositTokens: (...args: unknown[]) => getDepositTokensMock(...args),
	};
});

vi.mock("@/hooks/use-auth-token", () => ({
	useAuthToken: vi.fn(() => ({
		getToken: vi.fn(async () => "mock-jwt"),
	})),
}));

import { ACTIVE_CHAIN } from "@/lib/chain-config";
import { useDepositTokens } from "@/hooks/use-deposit-tokens";
import {
	__resetMirrorForTesting,
	readTokenCache,
	setTokenCache,
} from "@/lib/token-cache";

const SAMPLE_TOKENS = [
	{
		id: "id-usdc",
		symbol: "USDC",
		name: "USD Coin",
		tokenAddress: "0xusdc",
		decimals: 6,
		imageUrl: "/tokens/usdc-icon.webp",
		chainId: ACTIVE_CHAIN.id,
	},
];

beforeEach(() => {
	localStorage.clear();
	__resetMirrorForTesting();
	getDepositTokensMock.mockReset();
});

describe("useDepositTokens", () => {
	it("fetches and persists when cache is empty", async () => {
		getDepositTokensMock.mockResolvedValueOnce(SAMPLE_TOKENS);

		const { result } = renderHookWithProviders(() => useDepositTokens());

		await waitFor(() => expect(result.current.data).toEqual(SAMPLE_TOKENS));
		expect(getDepositTokensMock).toHaveBeenCalledTimes(1);
		expect(readTokenCache(ACTIVE_CHAIN.id)).toEqual(SAMPLE_TOKENS);
	});

	it("uses cached data without firing the network when cache is fresh", async () => {
		setTokenCache(ACTIVE_CHAIN.id, SAMPLE_TOKENS);

		const { result } = renderHookWithProviders(() => useDepositTokens());

		expect(result.current.data).toEqual(SAMPLE_TOKENS);
		expect(getDepositTokensMock).not.toHaveBeenCalled();
	});

	it("does not write to cache when the fetch fails", async () => {
		getDepositTokensMock.mockRejectedValue(new Error("network down"));

		const { result } = renderHookWithProviders(() => useDepositTokens());

		await waitFor(() => expect(result.current.isError).toBe(true), {
			timeout: 5000,
		});
		expect(readTokenCache(ACTIVE_CHAIN.id)).toBeNull();
	});
});
