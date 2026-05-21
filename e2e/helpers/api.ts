import type { APIRequestContext } from "@playwright/test";
import { TEST_WALLET } from "./test-wallet";

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

const LENDER_WALLET = process.env.LENDER_WALLET || TEST_WALLET;
const BORROWER_WALLET = process.env.BORROWER_WALLET || TEST_WALLET;

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
	marketId: string,
) {
	const res = await request.post("/portfolio/withdraw-lend-position", {
		headers: { Authorization: authHeader },
		data: { marketId },
	});
	return { status: res.status(), body: await res.json() };
}

// ---------------------------------------------------------------------------
// Market detail helpers
// ---------------------------------------------------------------------------

export async function getMarketDetail(
	request: APIRequestContext,
	assetId: string,
) {
	const res = await request.get(`/market/${assetId}`);
	return { status: res.status(), body: await res.json() };
}

export async function getRateHistory(
	request: APIRequestContext,
	assetId: string,
) {
	const res = await request.get(`/market/${assetId}/rate-history`);
	return { status: res.status(), body: await res.json() };
}

// ---------------------------------------------------------------------------
// Market order helpers
// ---------------------------------------------------------------------------

interface CreateMarketOrderParams {
	assetId: string;
	marketId: string;
	amount: string;
	autoRollover?: boolean;
}

export async function createLendMarketOrder(
	request: APIRequestContext,
	authHeader: string,
	params: CreateMarketOrderParams,
) {
	const res = await request.post("/orders/lend/market", {
		headers: { Authorization: authHeader },
		data: {
			assetId: params.assetId,
			amount: params.amount,
			marketIds: [params.marketId],
			autoRollover: params.autoRollover ?? true,
		},
	});
	return { status: res.status(), body: await res.json() };
}

export async function createBorrowMarketOrder(
	request: APIRequestContext,
	authHeader: string,
	params: CreateMarketOrderParams,
) {
	const res = await request.post("/orders/borrow/market", {
		headers: { Authorization: authHeader },
		data: {
			assetId: params.assetId,
			amount: params.amount,
			marketIds: [params.marketId],
			autoRollover: params.autoRollover ?? false,
		},
	});
	return { status: res.status(), body: await res.json() };
}

// ---------------------------------------------------------------------------
// Cancel order helper
// ---------------------------------------------------------------------------

export async function cancelOrder(
	request: APIRequestContext,
	authHeader: string,
	orderId: string,
) {
	const res = await request.post(`/orders/${orderId}/cancel`, {
		headers: { Authorization: authHeader },
	});
	return { status: res.status(), body: await res.json() };
}

// ---------------------------------------------------------------------------
// Portfolio read helpers
// ---------------------------------------------------------------------------

export async function getMyPortfolio(
	request: APIRequestContext,
	authHeader: string,
) {
	const res = await request.get("/portfolio/my-portfolio", {
		headers: { Authorization: authHeader },
	});
	return { status: res.status(), body: await res.json() };
}

export async function getMyAssets(
	request: APIRequestContext,
	authHeader: string,
	query?: { page?: number; limit?: number },
) {
	const params = new URLSearchParams();
	if (query?.page) params.set("page", String(query.page));
	if (query?.limit) params.set("limit", String(query.limit));
	const qs = params.toString();
	const url = qs ? `/portfolio/my-assets?${qs}` : "/portfolio/my-assets";
	const res = await request.get(url, {
		headers: { Authorization: authHeader },
	});
	return { status: res.status(), body: await res.json() };
}

export async function getLendBorrowAssets(
	request: APIRequestContext,
	authHeader: string,
	days?: number,
) {
	const url = days
		? `/portfolio/lend-borrow-assets?days=${days}`
		: "/portfolio/lend-borrow-assets";
	const res = await request.get(url, {
		headers: { Authorization: authHeader },
	});
	return { status: res.status(), body: await res.json() };
}

export async function getHealthFactor(
	request: APIRequestContext,
	authHeader: string,
) {
	const res = await request.get("/portfolio/my-health-factor", {
		headers: { Authorization: authHeader },
	});
	return { status: res.status(), body: await res.json() };
}

export async function getUserDetails(
	request: APIRequestContext,
	authHeader: string,
) {
	const res = await request.get("/portfolio/user-details", {
		headers: { Authorization: authHeader },
	});
	return { status: res.status(), body: await res.json() };
}

export async function setCollateral(
	request: APIRequestContext,
	authHeader: string,
	params: { assetIds: string[]; isCollateral: boolean },
) {
	const res = await request.put("/portfolio/is-collateral", {
		headers: { Authorization: authHeader },
		data: params,
	});
	return { status: res.status(), body: await res.json() };
}

export async function getOpenOrders(
	request: APIRequestContext,
	authHeader: string,
	query?: {
		page?: number;
		limit?: number;
		side?: string;
		status?: string;
		assetId?: string;
	},
) {
	const params = new URLSearchParams();
	if (query?.page) params.set("page", String(query.page));
	if (query?.limit) params.set("limit", String(query.limit));
	if (query?.side) params.set("side", query.side);
	if (query?.status) params.set("status", query.status);
	if (query?.assetId) params.set("assetId", query.assetId);
	const qs = params.toString();
	const url = qs
		? `/portfolio/open-orders?${qs}`
		: "/portfolio/open-orders";
	const res = await request.get(url, {
		headers: { Authorization: authHeader },
	});
	return { status: res.status(), body: await res.json() };
}

export async function getOrderHistory(
	request: APIRequestContext,
	authHeader: string,
	query?: {
		page?: number;
		limit?: number;
		side?: string;
		status?: string;
	},
) {
	const params = new URLSearchParams();
	if (query?.page) params.set("page", String(query.page));
	if (query?.limit) params.set("limit", String(query.limit));
	if (query?.side) params.set("side", query.side);
	if (query?.status) params.set("status", query.status);
	const qs = params.toString();
	const url = qs
		? `/portfolio/order-history?${qs}`
		: "/portfolio/order-history";
	const res = await request.get(url, {
		headers: { Authorization: authHeader },
	});
	return { status: res.status(), body: await res.json() };
}

export async function getTransactionHistory(
	request: APIRequestContext,
	authHeader: string,
	query?: { page?: number; limit?: number; side?: string },
) {
	const params = new URLSearchParams();
	if (query?.page) params.set("page", String(query.page));
	if (query?.limit) params.set("limit", String(query.limit));
	if (query?.side) params.set("side", query.side);
	const qs = params.toString();
	const url = qs
		? `/portfolio/transaction-history?${qs}`
		: "/portfolio/transaction-history";
	const res = await request.get(url, {
		headers: { Authorization: authHeader },
	});
	return { status: res.status(), body: await res.json() };
}

// ---------------------------------------------------------------------------
// Deposit helpers
// ---------------------------------------------------------------------------

export async function getDepositTokens(request: APIRequestContext) {
	const res = await request.get("/deposit/tokens");
	return { status: res.status(), body: await res.json() };
}

export async function getDepositBalance(
	request: APIRequestContext,
	authHeader: string,
	assetId: string,
) {
	const res = await request.get(`/deposit/balance/${assetId}`, {
		headers: { Authorization: authHeader },
	});
	return { status: res.status(), body: await res.json() };
}

export async function confirmDeposit(
	request: APIRequestContext,
	authHeader: string,
	txHash: string,
) {
	const res = await request.post("/deposit/confirm", {
		headers: { Authorization: authHeader },
		data: { txHash },
	});
	return { status: res.status(), body: await res.json() };
}

// ---------------------------------------------------------------------------
// Withdraw helpers
// ---------------------------------------------------------------------------

export async function submitWithdraw(
	request: APIRequestContext,
	authHeader: string,
	params: { assetId: string; amount: string },
) {
	const res = await request.post("/withdraw", {
		headers: { Authorization: authHeader },
		data: params,
	});
	return { status: res.status(), body: await res.json() };
}

// ---------------------------------------------------------------------------
// Faucet helpers
// ---------------------------------------------------------------------------

export async function getFaucetTokens(
	request: APIRequestContext,
	chainId: number,
) {
	const res = await request.get(`/faucet/all-tokens/${chainId}`);
	return { status: res.status(), body: await res.json() };
}

export async function requestFaucetTokens(
	request: APIRequestContext,
	params: {
		chainId: number;
		recipientAddress: string;
		token: string | string[];
	},
) {
	const res = await request.post("/faucet/request-tokens", {
		data: params,
	});
	return { status: res.status(), body: await res.json() };
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

export async function validateWallet(
	request: APIRequestContext,
	walletAddress: string,
) {
	const res = await request.post("/auth/validate", {
		data: { wallet_address: walletAddress },
	});
	return { status: res.status(), body: await res.json() };
}

export async function login(
	request: APIRequestContext,
	authHeader: string,
) {
	const res = await request.post("/auth/login", {
		headers: { Authorization: authHeader },
	});
	return { status: res.status(), body: await res.json() };
}

export async function updateName(
	request: APIRequestContext,
	authHeader: string,
	name: string,
) {
	const res = await request.patch("/auth/name", {
		headers: { Authorization: authHeader },
		data: { name },
	});
	return { status: res.status(), body: await res.json() };
}
