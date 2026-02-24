import { apiClient } from "./api-client";

export interface MarketAsset {
	id: string;
	name: string;
	symbol: string;
	decimals?: number | null;
	image_url?: string | null;
	token_address: string;
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
	status: string;
	originalAmount: string;
	settlementFeeAmount: string;
	rate: number;
	autoRollover: boolean;
	createdAt: string;
	updatedAt: string;
}

export function createLendLimitOrder(
	dto: CreateLendLimitOrderDto,
	token: string,
): Promise<OrderResponseData> {
	return apiClient<OrderResponseData>("/orders/lend/limit", {
		method: "POST",
		body: dto,
		token,
	});
}
