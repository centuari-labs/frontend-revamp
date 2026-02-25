import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLendForm } from "@/hooks/use-lend-form";
import { makeLendPosition } from "@/__tests__/helpers/fixtures/positions";

vi.mock("@/hooks/use-auth-token", () => ({
  useAuthToken: vi.fn(() => ({
    getToken: vi.fn(async () => "mock-token"),
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

vi.mock("@/lib/use-mock", () => ({ USE_MOCK: true }));

vi.mock("@/hooks/use-my-assets", () => ({
  useMyAssets: vi.fn(() => ({
    assets: [],
    isLoading: false,
    isError: false,
  })),
}));

vi.mock("@/lib/positions-adapter.api", () => ({
  submitLendLimitOrder: vi.fn(),
  submitLendMarketOrder: vi.fn(),
}));

// Mock all adapter functions
vi.mock("@/lib/positions-adapter.mock", () => ({
  submitOpenOrder: vi.fn(async (pos) => pos),
  submitFilledLendPosition: vi.fn(async (pos) => pos),
  updateOpenOrder: vi.fn(async () => {}),
  updateFilledPosition: vi.fn(async () => {}),
  buildLendLimitPosition: vi.fn((params) => ({
    ...makeLendPosition(),
    id: `lend-${params.tokenValue}-${Date.now()}`,
    orderType: "limit",
    apr: params.targetApr,
    amount: params.amountInUsd,
  })),
  buildLendMarketPosition: vi.fn((params) => ({
    ...makeLendPosition(),
    id: `lend-${params.tokenValue}-${Date.now()}`,
    orderType: "market",
    status: "success",
    amount: params.amountInUsd,
  })),
  getBestLendAPR: vi.fn(() => 6.5),
  getBestLendAPRDisplay: vi.fn(() => "6,5%"),
}));

const tokenList = [
  { logo: "/tokens/usdc-icon.svg", value: "usdc", label: "USDC" },
  { logo: "/tokens/xsgd-icon.png", value: "xsgd", label: "XSGD" },
];

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("useLendForm", () => {
  it("initializes with default token usdc", () => {
    const { result } = renderHook(() =>
      useLendForm({ tokenList }),
    );
    expect(result.current.selectedToken.value).toBe("usdc");
  });

  it("initializes with empty amounts", () => {
    const { result } = renderHook(() =>
      useLendForm({ tokenList }),
    );
    expect(result.current.limitAmount).toBe("");
    expect(result.current.marketAmount).toBe("");
  });

  it("calculates limit transaction fee (0.01%)", () => {
    const { result } = renderHook(() =>
      useLendForm({ tokenList }),
    );

    act(() => {
      result.current.handleLimitAmountChange({
        target: { value: "10000" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.limitTransactionFee).toBeCloseTo(1, 1);
    expect(result.current.limitAmountToPay).toBeCloseTo(10001, 1);
  });

  it("calculates market transaction fee (0.01%)", () => {
    const { result } = renderHook(() =>
      useLendForm({ tokenList }),
    );

    act(() => {
      result.current.handleMarketAmountChange({
        target: { value: "5000" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.marketTransactionFee).toBeCloseTo(0.5, 1);
  });

  it("handleLimitSubmit does nothing when amount is 0", async () => {
    const { result } = renderHook(() =>
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
    // Set portfolio so getAvailableBalance works
    localStorage.setItem("centuari_portfolio", JSON.stringify({ usdc: 50000 }));

    const { result } = renderHook(() =>
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
    localStorage.setItem("centuari_portfolio", JSON.stringify({ usdc: 50000 }));

    const { result } = renderHook(() =>
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
    localStorage.setItem("centuari_portfolio", JSON.stringify({ usdc: 50000 }));

    const { result } = renderHook(() =>
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
    localStorage.setItem("centuari_portfolio", JSON.stringify({ usdc: 10000 }));

    const { result } = renderHook(() =>
      useLendForm({ tokenList }),
    );

    act(() => {
      result.current.setLimitMax();
    });

    // USDC price is $1, so 10000 USD = 10000 tokens
    expect(parseFloat(result.current.limitAmount)).toBeGreaterThan(0);
  });

  it("autoRollover defaults to true", () => {
    const { result } = renderHook(() =>
      useLendForm({ tokenList }),
    );
    expect(result.current.autoRollover).toBe(true);
  });
});
