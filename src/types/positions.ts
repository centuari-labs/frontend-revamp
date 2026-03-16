/**
 * Shared types for positions and orders.
 * Used by hooks and adapter for lend/borrow operations.
 */

export type PositionStatus = "pending" | "processing" | "success" | "failed";
export type OrderType = "limit" | "market";

export interface LendPosition {
  id: string;
  assetImg: string;
  assetName: string;
  amount: number;
  apr: number;
  type: "lend";
  tokenValue: string;
  tokenSymbol: string;
  maturity: number;
  status: PositionStatus;
  createdAt: string;
  timestamp: number;
  orderType?: OrderType;
}

export interface BorrowPosition {
  id: string;
  assetImg: string;
  assetName: string;
  amount: number;
  apr: number;
  type: "borrow";
  tokenValue: string;
  tokenSymbol: string;
  maturity: number;
  status: PositionStatus;
  createdAt: string;
  timestamp: number;
  collateralTokens: string[];
  orderType?: OrderType;
}

export type Position = LendPosition | BorrowPosition;

export function isLendPosition(pos: Position): pos is LendPosition {
  return pos.type === "lend";
}

export function isBorrowPosition(pos: Position): pos is BorrowPosition {
  return pos.type === "borrow";
}

// Params for submit actions
export interface SubmitLendLimitParams {
  tokenValue: string;
  tokenLogo: string;
  tokenLabel: string;
  amount: number;
  amountInUsd: number;
  targetApr: number;
  maturity: number;
  autoRollover: boolean;
  editingPosition?: LendPosition;
}

export interface SubmitLendMarketParams {
  tokenValue: string;
  tokenLogo: string;
  tokenLabel: string;
  amount: number;
  amountInUsd: number;
  maturity: number;
  autoRollover?: boolean;
  editingPosition?: LendPosition;
}

export interface SubmitBorrowLimitParams {
  tokenValue: string;
  tokenLogo: string;
  tokenLabel: string;
  amount: number;
  maturity: number;
  targetApr: number;
  collateralTokens: string[];
  autoRollover: boolean;
  editingPosition?: BorrowPosition;
}

export interface SubmitBorrowMarketParams {
  tokenValue: string;
  tokenLogo: string;
  tokenLabel: string;
  amount: number;
  maturity: number;
  collateralTokens: string[];
  autoRollover?: boolean;
  editingPosition?: BorrowPosition;
}

export interface WithdrawLendParams {
  positionId: string;
  amount: number;
  tokenValue: string;
}

export interface RepayBorrowParams {
  positionId: string;
  amount: number;
  futureAmount: number;
  tokenValue: string;
}
