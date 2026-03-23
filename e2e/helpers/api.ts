import type { APIRequestContext } from "@playwright/test";

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

const LENDER_WALLET =
	process.env.LENDER_WALLET || "0x63f799163222e9CfC4afbddE7a632599AE0F1298";
const BORROWER_WALLET =
	process.env.BORROWER_WALLET ||
	"0x63f799163222e9CfC4afbddE7a632599AE0F1298";

export const LENDER_AUTH = `Bearer DEV_TOKEN_${LENDER_WALLET}`;
export const BORROWER_AUTH = `Bearer DEV_TOKEN_${BORROWER_WALLET}`;

export { LENDER_WALLET, BORROWER_WALLET };

// ---------------------------------------------------------------------------
// Market helpers
// ---------------------------------------------------------------------------

export interface MarketEntry {
	asset: { id: string; symbol: string; name: string };
	market: { market_id: string; maturity: number | string };
}

export async function getMarkets(
	request: APIRequestContext,
): Promise<MarketEntry[]> {
	const res = await request.get("/market");
	const body = await res.json();
	return body.data.markets as MarketEntry[];
}

/** Returns markets whose maturity timestamp is in the past. */
export function filterMaturedMarkets(markets: MarketEntry[]): MarketEntry[] {
	const nowSec = Math.floor(Date.now() / 1000);
	return markets.filter((m) => {
		// maturity is a Unix timestamp in seconds
		const maturitySec =
			typeof m.market.maturity === "number"
				? m.market.maturity
				: Math.floor(new Date(m.market.maturity).getTime() / 1000);
		return maturitySec < nowSec;
	});
}

/** Returns markets whose maturity timestamp is in the future. */
export function filterFutureMarkets(markets: MarketEntry[]): MarketEntry[] {
	const nowSec = Math.floor(Date.now() / 1000);
	return markets.filter((m) => {
		const maturitySec =
			typeof m.market.maturity === "number"
				? m.market.maturity
				: Math.floor(new Date(m.market.maturity).getTime() / 1000);
		return maturitySec > nowSec;
	});
}

// ---------------------------------------------------------------------------
// Order helpers
// ---------------------------------------------------------------------------

interface CreateOrderParams {
	assetId: string;
	marketId: string;
	amount: string;
	rate: number;
	autoRollover?: boolean;
}

export async function createLendLimitOrder(
	request: APIRequestContext,
	authHeader: string,
	params: CreateOrderParams,
) {
	const res = await request.post("/orders/lend/limit", {
		headers: { Authorization: authHeader },
		data: {
			assetId: params.assetId,
			amount: params.amount,
			marketIds: [params.marketId],
			rate: params.rate,
			autoRollover: params.autoRollover ?? true,
		},
	});
	return { status: res.status(), body: await res.json() };
}

export async function createBorrowLimitOrder(
	request: APIRequestContext,
	authHeader: string,
	params: CreateOrderParams,
) {
	const res = await request.post("/orders/borrow/limit", {
		headers: { Authorization: authHeader },
		data: {
			assetId: params.assetId,
			amount: params.amount,
			marketIds: [params.marketId],
			rate: params.rate,
			autoRollover: params.autoRollover ?? false,
		},
	});
	return { status: res.status(), body: await res.json() };
}

// ---------------------------------------------------------------------------
// Portfolio helpers
// ---------------------------------------------------------------------------

export interface PositionItem {
	id: string;
	symbol: string;
	name: string;
	shares: number;
	baseAmount: number;
	amountInUsd: number;
	side: "LEND" | "BORROW";
	maturity?: number | null;
	apr: number;
}

export async function getPositions(
	request: APIRequestContext,
	authHeader: string,
	type?: "LEND" | "BORROW",
): Promise<PositionItem[]> {
	const url = type
		? `/portfolio/my-position?type=${type}&limit=100`
		: "/portfolio/my-position?limit=100";
	const res = await request.get(url, {
		headers: { Authorization: authHeader },
	});
	const body = await res.json();
	// ResponseInterceptor wrapping: body.data may contain .data
	const data = body.data?.data ?? body.data ?? [];
	return Array.isArray(data) ? data : [];
}

/**
 * Poll the portfolio until a position matching the predicate appears.
 * Useful after creating orders — matching + settlement takes time.
 */
export async function waitForPosition(
	request: APIRequestContext,
	authHeader: string,
	predicate: (p: PositionItem) => boolean,
	{
		timeoutMs = 60_000,
		intervalMs = 3_000,
	}: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<PositionItem> {
	const deadline = Date.now() + timeoutMs;

	while (Date.now() < deadline) {
		const positions = await getPositions(request, authHeader);
		const match = positions.find(predicate);
		if (match) return match;

		await new Promise((r) => setTimeout(r, intervalMs));
	}

	throw new Error(
		`Timed out after ${timeoutMs}ms waiting for position to appear`,
	);
}

// ---------------------------------------------------------------------------
// Repay helpers
// ---------------------------------------------------------------------------

export async function submitRepay(
	request: APIRequestContext,
	authHeader: string,
	params: { positionId: string; amount: string },
) {
	const res = await request.post("/portfolio/repay", {
		headers: { Authorization: authHeader },
		data: params,
	});
	return { status: res.status(), body: await res.json() };
}

// ---------------------------------------------------------------------------
// Withdraw lend position helpers
// ---------------------------------------------------------------------------

export async function submitWithdrawLendPosition(
	request: APIRequestContext,
	authHeader: string,
	positionId: string,
) {
	const res = await request.post("/portfolio/withdraw-lend-position", {
		headers: { Authorization: authHeader },
		data: { positionId },
	});
	return { status: res.status(), body: await res.json() };
}
