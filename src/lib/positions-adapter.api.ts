/**
 * Real API positions adapter — calls backend REST endpoints.
 * Used when USE_MOCK=false. Converts frontend types to backend DTO format.
 */

import {
	createLendLimitOrder,
	createLendMarketOrder,
	createBorrowLimitOrder,
	createBorrowMarketOrder,
	type OrderResponseData,
} from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { getTokenLogo } from "@/lib/tokens";
import type {
	BorrowPosition,
	LendPosition,
	OrderType,
	PositionStatus,
	SubmitBorrowLimitParams,
	SubmitBorrowMarketParams,
	SubmitLendLimitParams,
	SubmitLendMarketParams,
} from "@/types/positions";

// ─── Types ───────────────────────────────────────────────────────────

export interface MarketIds {
	assetId: string;
	marketId: string;
	tokenSymbol: string;
}

// ─── Conversions ──────────────────────────────────────────────────────

export function aprToBasisPoints(aprDecimal: number): number {
	return Math.round(aprDecimal * 10000);
}

// ─── Status Mapping ───────────────────────────────────────────────────

const STATUS_MAP: Record<string, PositionStatus> = {
	OPEN: "pending",
	PARTIALLY_FILLED: "processing",
	FILLED: "success",
	CANCELLED: "failed",
};

function mapStatus(backendStatus: string): PositionStatus {
	return STATUS_MAP[backendStatus] ?? "pending";
}

// ─── Response Normalization ───────────────────────────────────────────

export function normalizeOrderToLendPosition(
	order: OrderResponseData,
	tokenSymbol: string,
	orderType: OrderType = "limit",
): LendPosition {
	const tokenValue = tokenSymbol.toLowerCase();
	const tokenLabel = tokenSymbol.toUpperCase();

	const maturitySec = order.markets[0]?.maturity ?? 0;

	return {
		id: order.orderId,
		assetImg: getTokenLogo(tokenValue),
		assetName: tokenLabel,
		amount: Number.parseFloat(order.originalAmount),
		apr: order.rate / 100,
		type: "lend",
		tokenValue,
		tokenSymbol: tokenLabel,
		assetId: order.assetId,
		maturity: maturitySec * 1000,
		status: mapStatus(order.status),
		createdAt: formatDate(new Date(order.createdAt)),
		timestamp: Date.now(),
		orderType,
	};
}

export function normalizeOrderToBorrowPosition(
	order: OrderResponseData,
	tokenSymbol: string,
	orderType: OrderType = "limit",
): BorrowPosition {
	const tokenValue = tokenSymbol.toLowerCase();
	const tokenLabel = tokenSymbol.toUpperCase();

	const maturitySec = order.markets[0]?.maturity ?? 0;

	return {
		id: order.orderId,
		assetImg: getTokenLogo(tokenValue),
		assetName: tokenLabel,
		amount: Number.parseFloat(order.originalAmount),
		apr: order.rate / 100,
		type: "borrow",
		tokenValue,
		tokenSymbol: tokenLabel,
		assetId: order.assetId,
		maturity: maturitySec * 1000,
		status: mapStatus(order.status),
		createdAt: formatDate(new Date(order.createdAt)),
		timestamp: Date.now(),
		collateralTokens: [],
		orderType,
	};
}

// ─── Submit ───────────────────────────────────────────────────────────

export async function submitLendLimitOrder(
	params: SubmitLendLimitParams,
	ids: MarketIds,
	token: string,
): Promise<LendPosition> {
	const dto = {
		assetId: ids.assetId,
		amount: String(params.amount),
		marketIds: [ids.marketId],
		rate: aprToBasisPoints(params.targetApr),
		autoRollover: params.autoRollover,
	};

	const response = await createLendLimitOrder(dto, token);
	return normalizeOrderToLendPosition(response, ids.tokenSymbol, "limit");
}

export async function submitLendMarketOrder(
	params: SubmitLendMarketParams,
	ids: MarketIds,
	token: string,
): Promise<LendPosition> {
	const dto = {
		assetId: ids.assetId,
		amount: String(params.amount),
		marketIds: [ids.marketId],
		autoRollover: params.autoRollover ?? true,
	};

	const response = await createLendMarketOrder(dto, token);
	return normalizeOrderToLendPosition(response, ids.tokenSymbol, "market");
}

export async function submitBorrowLimitOrder(
	params: SubmitBorrowLimitParams,
	ids: MarketIds,
	token: string,
): Promise<BorrowPosition> {
	const dto = {
		assetId: ids.assetId,
		amount: String(params.amount),
		marketIds: [ids.marketId],
		rate: aprToBasisPoints(params.targetApr),
		autoRollover: params.autoRollover ?? false,
	};

	const response = await createBorrowLimitOrder(dto, token);
	return normalizeOrderToBorrowPosition(response, ids.tokenSymbol, "limit");
}

export async function submitBorrowMarketOrder(
	params: SubmitBorrowMarketParams,
	ids: MarketIds,
	token: string,
): Promise<BorrowPosition> {
	const dto = {
		assetId: ids.assetId,
		amount: String(params.amount),
		marketIds: [ids.marketId],
		autoRollover: params.autoRollover ?? false,
	};

	const response = await createBorrowMarketOrder(dto, token);
	return normalizeOrderToBorrowPosition(response, ids.tokenSymbol, "market");
}
