// Backend DTO types mirroring backend-v2 API contracts

// ── Enums ──────────────────────────────────────────────

export type OrderSide = "LEND" | "BORROW";
export type OrderType = "MARKET" | "LIMIT";
export type OrderStatus = "OPEN" | "FILLED" | "CANCELLED" | "PARTIALLY_FILLED";

// ── Request types ──────────────────────────────────────

export interface CreateLendMarketOrderRequest {
	assetId: string;
	amount: string;
	marketIds: string[];
	autoRollover?: boolean;
}

export interface CreateLendLimitOrderRequest {
	assetId: string;
	amount: string;
	marketIds: string[];
	rate: number; // basis points (1–10000)
	autoRollover?: boolean;
}

export interface CreateBorrowMarketOrderRequest {
	assetId: string;
	amount: string;
	marketIds: string[];
	autoRollover?: boolean;
}

export interface CreateBorrowLimitOrderRequest {
	assetId: string;
	amount: string;
	marketIds: string[];
	rate: number; // basis points (1–10000)
	autoRollover?: boolean;
}

export interface ValidateWalletRequest {
	wallet_address: string;
}

export interface SetAssetAsCollateralRequest {
	assetIds: string[];
	isCollateral: boolean;
}

// ── Response types ─────────────────────────────────────

export interface ApiEnvelope<T> {
	statusCode: number;
	data: T;
}

export interface OrderMarketItem {
	marketId: string;
	maturity: number; // unix seconds
}

export interface OrderResponseData {
	orderId: string;
	walletAddress: string;
	assetId: string;
	markets: OrderMarketItem[];
	timestamp: number;
	side: OrderSide;
	type: OrderType;
	status: OrderStatus;
	originalAmount: string;
	settlementFeeAmount: string;
	autoRollover: boolean;
	rate: number; // percentage (e.g. 5 = 5%)
	createdAt: string;
	updatedAt: string;
}

export interface MarketAsset {
	id: string;
	name: string;
	symbol: string;
	decimals?: number | null;
}

export interface MarketItem {
	asset: MarketAsset;
	borrow_rate: number; // percentage
	lend_rate: number; // percentage
	collateral_factor: number; // percentage
}

export interface MarketResponse {
	total_deposit: string;
	active_loans: string;
	markets: MarketItem[];
}

export interface DepositWalletResponse {
	id: number;
	wallet_address: string;
	paired_wallet_address: string;
	paired_wallet_primary_key: string;
}

export interface MyPortfolioResponse {
	totalDeposit: number;
	allTimeReturn: number;
	netAPY: number;
}

export interface MyAssetItem {
	symbol: string;
	name: string;
	walletBalance: number;
	amountInUsd: number;
	isCollateral: boolean;
}

export interface MyAssetsResponse {
	data: MyAssetItem[];
	page: number;
	limit: number;
	totalData: number;
	totalPages: number;
}

export interface LendBorrowAssetsResponse {
	suppliedAssets: number;
	borrowedAssets: number;
	healthFactor: number;
}

export interface MyPositionItem {
	symbol: string;
	name: string;
	walletBalance: number;
	amountInUsd: number;
	isCollateral: boolean;
}

export interface MyPositionsResponse {
	data: MyPositionItem[];
	page: number;
	limit: number;
	totalData: number;
	totalPages: number;
}

// ── WebSocket types ────────────────────────────────────

export interface SubscribeOrderbookParams {
	assetId: string;
	marketId: string;
}

export interface OrderbookSide {
	price: number;
	apr: string;
	amount: string;
}

export interface OrderbookUpdate {
	assetId: string;
	marketId: string;
	lend: OrderbookSide | null;
	borrow: OrderbookSide | null;
	timestamp: number;
}
