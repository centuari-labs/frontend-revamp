import { apiRequest, authHeaders } from "./api-client";
import type {
	CreateLendMarketOrderRequest,
	CreateLendLimitOrderRequest,
	CreateBorrowMarketOrderRequest,
	CreateBorrowLimitOrderRequest,
	SetAssetAsCollateralRequest,
	OrderResponseData,
	MarketResponse,
	DepositWalletResponse,
	MyPortfolioResponse,
	MyAssetsResponse,
	LendBorrowAssetsResponse,
	MyPositionsResponse,
} from "@/types/api";

// ── Auth ───────────────────────────────────────────────

export function validateWallet(walletAddress: string) {
	return apiRequest<DepositWalletResponse>("/auth/validate", {
		method: "POST",
		body: JSON.stringify({ wallet_address: walletAddress }),
	});
}

// ── Orders ─────────────────────────────────────────────

export function createLendMarketOrder(
	token: string,
	data: CreateLendMarketOrderRequest,
) {
	return apiRequest<OrderResponseData>("/orders/lend/market", {
		method: "POST",
		headers: authHeaders(token),
		body: JSON.stringify(data),
	});
}

export function createLendLimitOrder(
	token: string,
	data: CreateLendLimitOrderRequest,
) {
	return apiRequest<OrderResponseData>("/orders/lend/limit", {
		method: "POST",
		headers: authHeaders(token),
		body: JSON.stringify(data),
	});
}

export function createBorrowMarketOrder(
	token: string,
	data: CreateBorrowMarketOrderRequest,
) {
	return apiRequest<OrderResponseData>("/orders/borrow/market", {
		method: "POST",
		headers: authHeaders(token),
		body: JSON.stringify(data),
	});
}

export function createBorrowLimitOrder(
	token: string,
	data: CreateBorrowLimitOrderRequest,
) {
	return apiRequest<OrderResponseData>("/orders/borrow/limit", {
		method: "POST",
		headers: authHeaders(token),
		body: JSON.stringify(data),
	});
}

export function cancelOrder(token: string, orderId: string) {
	return apiRequest<void>(`/orders/${orderId}/cancel`, {
		method: "PATCH",
		headers: authHeaders(token),
	});
}

// ── Market ─────────────────────────────────────────────

export function getMarketData() {
	return apiRequest<MarketResponse>("/market");
}

// ── Portfolio ──────────────────────────────────────────

export function getMyPortfolio(token: string) {
	return apiRequest<MyPortfolioResponse>("/portfolio/my-portfolio", {
		headers: authHeaders(token),
	});
}

export function getMyAssets(
	token: string,
	page = 1,
	limit = 10,
) {
	return apiRequest<MyAssetsResponse>(
		`/portfolio/my-assets?page=${page}&limit=${limit}`,
		{ headers: authHeaders(token) },
	);
}

export function getLendBorrowAssets(token: string) {
	return apiRequest<LendBorrowAssetsResponse>(
		"/portfolio/lend-borrow-assets",
		{ headers: authHeaders(token) },
	);
}

export function getMyPositions(
	token: string,
	opts: { page?: number; limit?: number; type?: "LEND" | "BORROW" } = {},
) {
	const params = new URLSearchParams();
	if (opts.page) params.set("page", String(opts.page));
	if (opts.limit) params.set("limit", String(opts.limit));
	if (opts.type) params.set("type", opts.type);
	const qs = params.toString();
	return apiRequest<MyPositionsResponse>(
		`/portfolio/my-position${qs ? `?${qs}` : ""}`,
		{ headers: authHeaders(token) },
	);
}

export function setAssetAsCollateral(
	token: string,
	data: SetAssetAsCollateralRequest,
) {
	return apiRequest<void>("/portfolio/is-collateral", {
		method: "PUT",
		headers: authHeaders(token),
		body: JSON.stringify(data),
	});
}
