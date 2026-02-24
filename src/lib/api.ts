import { apiClient } from "./api-client";

export interface MarketAsset {
	id: string;
	name: string;
	symbol: string;
	decimals?: number | null;
	image_url?: string | null;
	token_address: string;
}

export interface MarketItem {
	asset: MarketAsset;
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
