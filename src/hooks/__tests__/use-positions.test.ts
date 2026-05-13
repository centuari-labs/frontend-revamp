import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHookWithProviders } from "@/__tests__/helpers/render-with-providers";

vi.mock("@privy-io/react-auth", () => ({
	usePrivy: vi.fn(() => ({
		user: { wallet: { address: "0x123" } },
		getAccessToken: vi.fn().mockResolvedValue("mock-token"),
	})),
}));

vi.mock("@/hooks/use-auth-token", () => ({
	useAuthToken: vi.fn(() => ({
		getToken: vi.fn(async () => "mock-token"),
	})),
}));

vi.mock("@/hooks/use-my-positions", () => ({
	useMyPositions: vi.fn(() => ({
		positions: [],
		isLoading: false,
		isError: false,
		refetch: vi.fn(),
		page: 1,
		totalData: 0,
		totalPages: 0,
	})),
}));

import { usePositions } from "@/hooks/use-positions";
import { useMyPositions } from "@/hooks/use-my-positions";

beforeEach(() => {
	vi.clearAllMocks();
});

describe("usePositions", () => {
	it("returns empty arrays when no data", () => {
		const { result } = renderHookWithProviders(() => usePositions());
		expect(result.current.openOrders).toEqual([]);
		expect(result.current.allTransactions).toEqual([]);
		expect(result.current.positions).toEqual([]);
	});

	it("maps backend positions to frontend format", () => {
		vi.mocked(useMyPositions).mockReturnValue({
			positions: [
				{
					id: "pos-1",
					assetId: "asset-1",
					marketId: "m1",
					shares: 0,
					baseAmount: 0,
					imageUrl: "/tokens/usdc.png",
					name: "USDC",
					amountInUsd: 1000,
					apr: "5.5",
					symbol: "USDC",
					maturity: 1748736,
					side: "LEND" as const,
					isCollateral: false,
				},
			],
			isLoading: false,
			isError: false,
			refetch: vi.fn(),
			page: 1,
			totalData: 1,
			totalPages: 1,
		});

		const { result } = renderHookWithProviders(() => usePositions());
		expect(result.current.positions).toHaveLength(1);
		expect(result.current.positions[0].id).toBe("pos-1");
		expect(result.current.positions[0].type).toBe("lend");
		expect(result.current.allTransactions).toHaveLength(1);
	});

	it("maps borrow positions correctly", () => {
		vi.mocked(useMyPositions).mockReturnValue({
			positions: [
				{
					id: "pos-2",
					assetId: "asset-2",
					marketId: "m2",
					shares: 0,
					baseAmount: 0,
					imageUrl: null,
					name: "ETH",
					amountInUsd: 5000,
					apr: "8.0",
					symbol: "ETH",
					maturity: 1748736,
					side: "BORROW" as const,
					isCollateral: true,
				},
			],
			isLoading: false,
			isError: false,
			refetch: vi.fn(),
			page: 1,
			totalData: 1,
			totalPages: 1,
		});

		const { result } = renderHookWithProviders(() => usePositions());
		expect(result.current.positions).toHaveLength(1);
		expect(result.current.positions[0].type).toBe("borrow");
	});

	it("returns loading state", () => {
		vi.mocked(useMyPositions).mockReturnValue({
			positions: [],
			isLoading: true,
			isError: false,
			refetch: vi.fn(),
			page: 1,
			totalData: 0,
			totalPages: 0,
		});

		const { result } = renderHookWithProviders(() => usePositions());
		expect(result.current.isLoading).toBe(true);
	});

	it("openOrders is always empty (no local storage)", () => {
		const { result } = renderHookWithProviders(() => usePositions());
		expect(result.current.openOrders).toEqual([]);
	});

	it("refresh delegates to refetch", () => {
		const mockRefetch = vi.fn();
		vi.mocked(useMyPositions).mockReturnValue({
			positions: [],
			isLoading: false,
			isError: false,
			refetch: mockRefetch,
			page: 1,
			totalData: 0,
			totalPages: 0,
		});

		const { result } = renderHookWithProviders(() => usePositions());
		result.current.refresh();
		expect(mockRefetch).toHaveBeenCalled();
	});

	it("combines multiple positions", () => {
		vi.mocked(useMyPositions).mockReturnValue({
			positions: [
				{
					id: "pos-a",
					assetId: "asset-a",
					marketId: "m1",
					shares: 0,
					baseAmount: 0,
					imageUrl: null,
					name: "USDC",
					amountInUsd: 1000,
					apr: "5.0",
					symbol: "USDC",
					maturity: 1748736,
					side: "LEND" as const,
					isCollateral: false,
				},
				{
					id: "pos-b",
					assetId: "asset-b",
					marketId: "m2",
					shares: 0,
					baseAmount: 0,
					imageUrl: null,
					name: "ETH",
					amountInUsd: 5000,
					apr: "8.0",
					symbol: "ETH",
					maturity: 1748736,
					side: "BORROW" as const,
					isCollateral: true,
				},
			],
			isLoading: false,
			isError: false,
			refetch: vi.fn(),
			page: 1,
			totalData: 2,
			totalPages: 1,
		});

		const { result } = renderHookWithProviders(() => usePositions());
		expect(result.current.positions).toHaveLength(2);
	});

	it("allTransactions equals mapped positions", () => {
		vi.mocked(useMyPositions).mockReturnValue({
			positions: [
				{
					id: "pos-c",
					assetId: "asset-c",
					marketId: "m1",
					shares: 0,
					baseAmount: 0,
					imageUrl: null,
					name: "USDC",
					amountInUsd: 1000,
					apr: "5.0",
					symbol: "USDC",
					maturity: 1748736,
					side: "LEND" as const,
					isCollateral: false,
				},
			],
			isLoading: false,
			isError: false,
			refetch: vi.fn(),
			page: 1,
			totalData: 1,
			totalPages: 1,
		});

		const { result } = renderHookWithProviders(() => usePositions());
		expect(result.current.allTransactions).toEqual(result.current.positions);
	});
});
