import { apiClient } from "./api-client";

export interface MarketAsset {
	id: string;
	name: string;
	symbol: string;
	decimals?: number | null;
	image_url?: string | null;
}

export interface MarketItemMarket {
	market_id: string | null;
	maturity: number | null; // Unix seconds
}

export interface MarketItem {
	asset: MarketAsset;
	market: MarketItemMarket;
	borrow_rate: number;
	lend_rate: number;
	collateral_factor: number;
}

export interface MarketResponse {
	total_deposit: string;
	active_loans: string;
	markets: MarketItem[];
}

export function getMarket(): Promise<MarketResponse> {
	return apiClient<MarketResponse>("/market");
}

export interface AccountResponse {
	id: string;
	privy_user_id: string;
	user_wallet: string;
	name: string | null;
	created_at: string;
}

export function updateAccountName(
	name: string,
	token: string,
): Promise<AccountResponse> {
	return apiClient<AccountResponse>("/auth/name", {
		method: "PATCH",
		body: { name },
		token,
	});
}

// ─── Lend Limit Order ─────────────────────────────────────────────────

export interface CreateLendLimitOrderDto {
	assetId: string;
	amount: string;
	marketIds: string[];
	rate: number;
	autoRollover?: boolean;
}

export interface OrderResponseData {
	orderId: string;
	walletAddress: string;
	assetId: string;
	markets: { marketId: string; maturity: number }[];
	timestamp: number;
	side: string;
	type: string;
	status: string;
	originalAmount: string;
	settlementFeeAmount: string;
	rate: number;
	autoRollover: boolean;
	createdAt: string;
	updatedAt: string;
}

interface OrderEnvelope {
	statusCode: number;
	data: OrderResponseData;
}

// ─── My Assets (Portfolio) ───────────────────────────────────────────

export interface MyAssetItem {
	symbol: string;
	name: string;
	walletBalance: number;
	amountInUsd: number;
	isCollateral: boolean;
	imageUrl: string | null;
}

export interface MyAssetsResponse {
	data: MyAssetItem[];
	page: number;
	limit: number;
	totalData: number;
	totalPages: number;
}

export function getMyAssets(token: string): Promise<MyAssetItem[]> {
	return apiClient<MyAssetItem[]>("/portfolio/my-assets?limit=100", {
		token,
	});
}

// ─── Lend Limit Order ─────────────────────────────────────────────────

export async function createLendLimitOrder(
	dto: CreateLendLimitOrderDto,
	token: string,
): Promise<OrderResponseData> {
	// The backend controller returns { statusCode, data } and the
	// ResponseInterceptor wraps it again, so apiClient unwraps the outer
	// envelope and we unwrap the inner one here.
	const envelope = await apiClient<OrderEnvelope>("/orders/lend/limit", {
		method: "POST",
		body: dto,
		token,
	});
	return envelope.data;
}

// ─── Lend Market Order ───────────────────────────────────────────────

export interface CreateLendMarketOrderDto {
	assetId: string;
	amount: string;
	marketIds: string[];
	autoRollover?: boolean;
}

export async function createLendMarketOrder(
	dto: CreateLendMarketOrderDto,
	token: string,
): Promise<OrderResponseData> {
	const envelope = await apiClient<OrderEnvelope>("/orders/lend/market", {
		method: "POST",
		body: dto,
		token,
	});
	return envelope.data;
}

// ─── Borrow Limit Order ──────────────────────────────────────────────

export interface CreateBorrowLimitOrderDto {
	assetId: string;
	amount: string;
	marketIds: string[];
	rate: number;
	autoRollover?: boolean;
}

export async function createBorrowLimitOrder(
	dto: CreateBorrowLimitOrderDto,
	token: string,
): Promise<OrderResponseData> {
	const envelope = await apiClient<OrderEnvelope>("/orders/borrow/limit", {
		method: "POST",
		body: dto,
		token,
	});
	return envelope.data;
}

// ─── Borrow Market Order ─────────────────────────────────────────────

export interface CreateBorrowMarketOrderDto {
	assetId: string;
	amount: string;
	marketIds: string[];
	autoRollover?: boolean;
}

export async function createBorrowMarketOrder(
	dto: CreateBorrowMarketOrderDto,
	token: string,
): Promise<OrderResponseData> {
	const envelope = await apiClient<OrderEnvelope>("/orders/borrow/market", {
		method: "POST",
		body: dto,
		token,
	});
	return envelope.data;
}

// ─── Faucet ─────────────────────────────────────────────────────────

export interface FaucetTokenResult {
	tokenAddress: string;
	amount: string;
}

export interface FaucetResponse {
	chainId: number;
	recipientAddress: string;
	transactionHash: string;
	blockNumber: string;
	status: string;
	results: FaucetTokenResult[];
}

export function requestFaucetTokens(
	chainId: number,
	recipientAddress: string,
	tokens: string[],
): Promise<FaucetResponse> {
	return apiClient<FaucetResponse>("/faucet/request-tokens", {
		method: "POST",
		body: { chainId, recipientAddress, token: tokens },
	});
}
