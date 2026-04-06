import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { renderHookWithProviders } from "@/__tests__/helpers/render-with-providers";
import { useBorrowForm } from "@/hooks/use-borrow-form";

vi.mock("@/hooks/use-auth-token", () => ({
	useAuthToken: vi.fn(() => ({
		getToken: vi.fn(async () => "mock-token"),
	})),
}));

vi.mock("@privy-io/react-auth", () => ({
	usePrivy: vi.fn(() => ({
		user: { wallet: { address: "0x123" } },
		getAccessToken: vi.fn().mockResolvedValue("mock-token"),
	})),
}));

vi.mock("@/contexts/user-details-context", () => ({
	useUserDetailsContext: vi.fn(() => ({
		userDetails: null,
		isLoading: false,
		isError: false,
		refetch: vi.fn(),
	})),
}));

vi.mock("@/hooks/use-my-assets", () => ({
	useMyAssets: vi.fn(() => ({
		assets: [],
		isLoading: false,
		isError: false,
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

vi.mock("@/contexts/price-context", () => ({
	useTokenPrice: vi.fn(() => 1),
}));

vi.mock("@/lib/positions-adapter.api", () => ({
	submitBorrowLimitOrder: vi.fn(),
	submitBorrowMarketOrder: vi.fn(),
}));

vi.mock("@/lib/positions-adapter.mock", () => ({
	submitOpenOrder: vi.fn(async (pos) => pos),
	submitFilledBorrowPosition: vi.fn(async (pos) => pos),
	updateOpenOrder: vi.fn(async () => {}),
	updateFilledPosition: vi.fn(async () => {}),
	buildBorrowLimitPosition: vi.fn((params) => ({
		id: `borrow-${params.tokenValue}-${Date.now()}`,
		type: "borrow",
		orderType: "limit",
		apr: params.targetApr,
		amount: params.amount,
		collateralTokens: params.collateralTokens,
		tokenValue: params.tokenValue,
		tokenSymbol: params.tokenLabel,
		maturity: params.maturity,
		status: "OPEN",
		createdAt: "",
		timestamp: Date.now(),
		assetImg: "",
		assetName: "",
	})),
	buildBorrowMarketPosition: vi.fn((params) => ({
		id: `borrow-${params.tokenValue}-${Date.now()}`,
		type: "borrow",
		orderType: "market",
		status: "success",
		amount: params.amount,
		collateralTokens: params.collateralTokens,
		tokenValue: params.tokenValue,
		tokenSymbol: params.tokenLabel,
		maturity: params.maturity,
		apr: 0,
		createdAt: "",
		timestamp: Date.now(),
		assetImg: "",
		assetName: "",
	})),
	getBestBorrowAPR: vi.fn(() => 10.1),
	getBestBorrowAPRDisplay: vi.fn(() => "10,1%"),
}));

const tokenList = [
	{ logo: "/tokens/centuari-usdt.png", value: "usdt", label: "USDT" },
	{ logo: "/tokens/usdc-icon.webp", value: "usdc", label: "USDC" },
];

beforeEach(() => {
	vi.clearAllMocks();
	localStorage.clear();
});

describe("useBorrowForm", () => {
	it("initializes with default token usdt", () => {
		const { result } = renderHookWithProviders(() =>
			useBorrowForm({ tokenList }),
		);
		expect(result.current.selectedToken.value).toBe("usdt");
	});

	it("initializes with empty amounts", () => {
		const { result } = renderHookWithProviders(() =>
			useBorrowForm({ tokenList }),
		);
		expect(result.current.limitAmount).toBe("");
		expect(result.current.marketAmount).toBe("");
	});

	it("limitHealthFactor is 0 when no amount entered", () => {
		const { result } = renderHookWithProviders(() =>
			useBorrowForm({ tokenList }),
		);
		expect(result.current.limitHealthFactor).toBe(0);
	});

	it("handleLimitSubmit blocks when amount is 0", async () => {
		const { result } = renderHookWithProviders(() =>
			useBorrowForm({ tokenList }),
		);

		await act(async () => {
			await result.current.handleLimitSubmit({
				preventDefault: vi.fn(),
			} as unknown as React.FormEvent);
		});

		expect(result.current.showSuccessDialog).toBe(false);
	});

	it("handleLimitSubmit blocks when no collateral selected", async () => {
		const { result } = renderHookWithProviders(() =>
			useBorrowForm({ tokenList }),
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

		expect(result.current.showSuccessDialog).toBe(false);
	});

	it("autoRefinance defaults to true", () => {
		const { result } = renderHookWithProviders(() =>
			useBorrowForm({ tokenList }),
		);
		expect(result.current.autoRefinance).toBe(true);
	});

	it("portfolio starts empty when no assets", () => {
		const { result } = renderHookWithProviders(() =>
			useBorrowForm({ tokenList }),
		);
		expect(result.current.portfolio).toEqual({});
	});

	it("totalDebt starts at 0 when no user details", () => {
		const { result } = renderHookWithProviders(() =>
			useBorrowForm({ tokenList }),
		);
		expect(result.current.totalDebt).toBe(0);
	});

	it("collateralTokenList starts empty when no assets", () => {
		const { result } = renderHookWithProviders(() =>
			useBorrowForm({ tokenList }),
		);
		expect(result.current.collateralTokenList).toEqual([]);
	});

	it("limitSelectedCollaterals starts empty", () => {
		const { result } = renderHookWithProviders(() =>
			useBorrowForm({ tokenList }),
		);
		expect(result.current.limitSelectedCollaterals).toEqual([]);
	});

	it("exposes borrowTokenPrice", () => {
		const { result } = renderHookWithProviders(() =>
			useBorrowForm({ tokenList }),
		);
		expect(result.current.borrowTokenPrice).toBe(1);
	});
});
