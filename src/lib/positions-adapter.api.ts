/**
 * Real API positions adapter — calls backend REST endpoints.
 * Used when USE_MOCK=false. Converts frontend types to backend DTO format.
 */

import {
	createLendLimitOrder,
	type MarketItem,
	type OrderResponseData,
} from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { getTokenLogo } from "@/lib/tokens";
import type {
	LendPosition,
	PositionStatus,
	SubmitLendLimitParams,
} from "@/types/positions";

// ─── ID Resolution ────────────────────────────────────────────────────

export function resolveMarketForAsset(
	tokenValue: string,
	markets: MarketItem[],
): { assetId: string; marketId: string } {
	const match = markets.find(
		(m) => m.asset.symbol.toLowerCase() === tokenValue.toLowerCase(),
	);
	if (!match) {
		throw new Error(`No asset found for token "${tokenValue}"`);
	}
	if (!match.market.market_id) {
		throw new Error(`No market available for token "${tokenValue}"`);
	}
	return { assetId: match.asset.id, marketId: match.market.market_id };
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
	markets: MarketItem[],
): LendPosition {
	// Reverse-lookup token symbol from assetId
	const marketItem = markets.find(
		(m) => m.asset.id.toLowerCase() === order.assetId.toLowerCase(),
	);
	const tokenValue = marketItem?.asset.symbol.toLowerCase() ?? "unknown";
	const tokenLabel = marketItem?.asset.symbol ?? "UNKNOWN";

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
		maturity: maturitySec * 1000,
		status: mapStatus(order.status),
		createdAt: formatDate(new Date(order.createdAt)),
		timestamp: Date.now(),
		orderType: "limit",
	};
}

// ─── Submit ───────────────────────────────────────────────────────────

export async function submitLendLimitOrder(
	params: SubmitLendLimitParams,
	markets: MarketItem[],
	token: string,
): Promise<LendPosition> {
	const { assetId, marketId } = resolveMarketForAsset(params.tokenValue, markets);

	const dto = {
		assetId,
		amount: String(params.amount),
		marketIds: [marketId],
		rate: aprToBasisPoints(params.targetApr),
		autoRollover: params.autoRollover,
	};

	const response = await createLendLimitOrder(dto, token);
	return normalizeOrderToLendPosition(response, markets);
}
