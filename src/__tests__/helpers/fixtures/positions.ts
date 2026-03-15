import type { LendPosition, BorrowPosition } from "@/types/positions";

let counter = 0;

export function makeLendPosition(
  overrides: Partial<LendPosition> = {},
): LendPosition {
  counter++;
  return {
    id: `lend-test-${counter}`,
    assetImg: "/tokens/usdc-icon.webp",
    assetName: "USDC",
    amount: 1000,
    apr: 0.065,
    type: "lend",
    tokenValue: "usdc",
    tokenSymbol: "USDC",
    maturity: Date.now() + 30 * 24 * 60 * 60 * 1000,
    status: "success",
    createdAt: "25 Feb 2026",
    timestamp: Date.now(),
    orderType: "market",
    ...overrides,
  };
}

export function makeBorrowPosition(
  overrides: Partial<BorrowPosition> = {},
): BorrowPosition {
  counter++;
  return {
    id: `borrow-test-${counter}`,
    assetImg: "/tokens/usdc-icon.webp",
    assetName: "USDC",
    amount: 500,
    apr: 0.101,
    type: "borrow",
    tokenValue: "usdc",
    tokenSymbol: "USDC",
    maturity: Date.now() + 30 * 24 * 60 * 60 * 1000,
    status: "success",
    createdAt: "25 Feb 2026",
    timestamp: Date.now(),
    collateralTokens: ["btc", "eth"],
    orderType: "market",
    ...overrides,
  };
}
