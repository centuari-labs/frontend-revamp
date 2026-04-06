import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { renderHookWithProviders } from "@/__tests__/helpers/render-with-providers";
import { useLendForm } from "@/hooks/use-lend-form";

const mockGetToken = vi.fn(async () => "mock-token");
vi.mock("@/hooks/use-auth-token", () => ({
	useAuthToken: vi.fn(() => ({
		getToken: mockGetToken,
	})),
}));

vi.mock("@privy-io/react-auth", () => ({
	usePrivy: vi.fn(() => ({
		user: { wallet: { address: "0x123" } },
		getAccessToken: vi.fn().mockResolvedValue("mock-token"),
	})),
}));

vi.mock("@/hooks/use-market-data", () => ({
	useMarketData: vi.fn(() => ({
		markets: [],
		totalDeposit: 0,
		activeLoans: 0,
		isLoading: false,
		isError: false,
	})),
}));

vi.mock("@/hooks/use-market-detail", () => ({
	useMarketDetail: vi.fn(() => ({
		assetId: undefined,
		symbol: undefined,
		decimals: null,
		imageUrl: null,
		totalDeposit: 0,
		activeLoans: 0,
		collateralFactor: 0,
		upcomingMaturities: [],
		isLoading: false,
		isError: false,
		refetch: vi.fn(),
	})),
}));

vi.mock("@/hooks/use-orderbook", () => ({
	useOrderbook: vi.fn(() => ({
		borrowOrders: [],
		lendOrders: [],
		isConnected: false,
	})),
}));

vi.mock("@/hooks/use-my-assets", () => ({
	useMyAssets: vi.fn(() => ({
		assets: [
			{
				symbol: "USDC",
				name: "USD Coin",
				walletBalance: 50000,
				amountInUsd: 50000,
				isCollateral: false,
				imageUrl: "/tokens/usdc-icon.webp",
				ltv: 0,
				liquidationThreshold: 0,
			},
			{
				symbol: "XSGD",
				name: "XSGD",
				walletBalance: 10000,
				amountInUsd: 10000,
				isCollateral: false,
				imageUrl: "/tokens/xsgd-icon.webp",
				ltv: 0,
				liquidationThreshold: 0,
			},
		],
		isLoading: false,
		isError: false,
	})),
}));

vi.mock("@/lib/use-mock", () => ({ USE_MOCK: true }));

const mockSubmitLimit = vi.fn(async () => ({
	id: "lend-result",
	type: "lend",
	orderType: "limit",
	apr: 0.065,
	amount: 1000,
	tokenValue: "usdc",
	tokenSymbol: "USDC",
	maturity: Date.now(),
	status: "OPEN",
}));
const mockSubmitMarket = vi.fn(async () => ({
	id: "lend-market-result",
	type: "lend",
	orderType: "market",
	apr: 0.065,
	amount: 500,
	tokenValue: "usdc",
	tokenSymbol: "USDC",
	maturity: Date.now(),
	status: "success",
}));

vi.mock("@/hooks/use-submit-lend", () => ({
	useSubmitLend: vi.fn(() => ({
		submitLimit: mockSubmitLimit,
		submitMarket: mockSubmitMarket,
		isPending: false,
	})),
}));

const tokenList = [
	{ logo: "/tokens/usdc-icon.webp", value: "usdc", label: "USDC" },
	{ logo: "/tokens/xsgd-icon.webp", value: "xsgd", label: "XSGD" },
];

beforeEach(() => {
	vi.clearAllMocks();
	localStorage.clear();
});

describe("useLendForm", () => {
	it("initializes with default token usdc", () => {
		const { result } = renderHookWithProviders(() =>
			useLendForm({ tokenList }),
		);
		expect(result.current.selectedToken.value).toBe("usdc");
	});

	it("initializes with empty amounts", () => {
		const { result } = renderHookWithProviders(() =>
			useLendForm({ tokenList }),
		);
		expect(result.current.limitAmount).toBe("");
		expect(result.current.marketAmount).toBe("");
	});

	it("calculates limit transaction fee", () => {
		const { result } = renderHookWithProviders(() =>
			useLendForm({ tokenList }),
		);

		act(() => {
			result.current.handleLimitAmountChange({
				target: { value: "10000" },
			} as React.ChangeEvent<HTMLInputElement>);
		});

		// Settlement fee: min(10000 * 0.0001, 0.05) = 0.05
		// Trade fee: 10000 * 0.001 = 10
		// Total: 10.05
		expect(result.current.limitTransactionFee).toBeCloseTo(10.05, 1);
		expect(result.current.limitAmountToPay).toBeCloseTo(10010.05, 1);
	});

	it("calculates market transaction fee", () => {
		const { result } = renderHookWithProviders(() =>
			useLendForm({ tokenList }),
		);

		act(() => {
			result.current.handleMarketAmountChange({
				target: { value: "5000" },
			} as React.ChangeEvent<HTMLInputElement>);
		});

		// Settlement fee: min(5000 * 0.0001, 0.05) = 0.05
		// Trade fee: 5000 * 0.002 = 10
		// Total: 10.05
		expect(result.current.marketTransactionFee).toBeCloseTo(10.05, 1);
	});

	it("handleLimitSubmit does nothing when amount is 0", async () => {
		const { result } = renderHookWithProviders(() =>
			useLendForm({ tokenList }),
		);

		await act(async () => {
			await result.current.handleLimitSubmit({
				preventDefault: vi.fn(),
			} as unknown as React.FormEvent);
		});

		expect(result.current.showSuccessDialog).toBe(false);
	});

	it("handleLimitSubmit shows success dialog on completion", async () => {
		const { result } = renderHookWithProviders(() =>
			useLendForm({ tokenList }),
		);

		act(() => {
			result.current.handleLimitAmountChange({
				target: { value: "1000" },
			} as React.ChangeEvent<HTMLInputElement>);
		});

		await act(async () => {
			await result.current.handleLimitSubmit({
				preventDefault: vi.fn(),
			} as unknown as React.FormEvent);
		});

		expect(result.current.showSuccessDialog).toBe(true);
		expect(result.current.successAmount).toBeTruthy();
	});

	it("handleMarketSubmit shows success dialog on completion", async () => {
		const { result } = renderHookWithProviders(() =>
			useLendForm({ tokenList }),
		);

		act(() => {
			result.current.handleMarketAmountChange({
				target: { value: "500" },
			} as React.ChangeEvent<HTMLInputElement>);
		});

		await act(async () => {
			await result.current.handleMarketSubmit({
				preventDefault: vi.fn(),
			} as unknown as React.FormEvent);
		});

		expect(result.current.showSuccessDialog).toBe(true);
	});

	it("resets limit form after successful submit", async () => {
		const { result } = renderHookWithProviders(() =>
			useLendForm({ tokenList }),
		);

		act(() => {
			result.current.handleLimitAmountChange({
				target: { value: "1000" },
			} as React.ChangeEvent<HTMLInputElement>);
			result.current.setLimitTargetAPR("6,5");
		});

		await act(async () => {
			await result.current.handleLimitSubmit({
				preventDefault: vi.fn(),
			} as unknown as React.FormEvent);
		});

		expect(result.current.limitAmount).toBe("");
		expect(result.current.limitTargetAPR).toBe("");
	});

	it("setLimitMax fills from available balance", () => {
		const { result } = renderHookWithProviders(() =>
			useLendForm({ tokenList }),
		);

		act(() => {
			result.current.setLimitMax();
		});

		// USDC has walletBalance 50000
		expect(parseFloat(result.current.limitAmount)).toBeGreaterThan(0);
	});

	it("autoRollover defaults to true", () => {
		const { result } = renderHookWithProviders(() =>
			useLendForm({ tokenList }),
		);
		expect(result.current.autoRollover).toBe(true);
	});
});
