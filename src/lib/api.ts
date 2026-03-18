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

export interface MarketDetailResponse {
	asset: {
		id: string;
		name: string;
		symbol: string;
		decimals: number | null;
		imageUrl: string | null;
	};
	collateral_factor: number;
	total_deposit: string;
	active_loans: string;
	upcoming_maturities: {
		market_id: string;
		maturity: number;
	}[];
}

export function getMarket(): Promise<MarketResponse> {
	return apiClient<MarketResponse>("/market");
}

export function getMarketDetail(assetId: string): Promise<MarketDetailResponse> {
	return apiClient<MarketDetailResponse>(`/market/${assetId}`);
}

// ─── Rate History ──────────────────────────────────────────────────

export interface RateHistoryItem {
	date: string;
	rate: number;
}

export interface RateHistoryResponse {
	assetId: string;
	rateHistory: RateHistoryItem[];
}

export function getRateHistory(assetId: string): Promise<RateHistoryResponse> {
	return apiClient<RateHistoryResponse>(`/market/${assetId}/rate-history`);
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

// ─── My Portfolio ───────────────────────────────────────────────────

export interface PortfolioAllocation {
	availableBalanceUsd: number;
	suppliedAssetsUsd: number;
	borrowedAssetsUsd: number;
	availableBalancePct: number;
	suppliedAssetsPct: number;
	borrowedAssetsPct: number;
}

export interface MyPortfolioResponse {
	totalDeposit: number;
	allTimeReturn: number;
	netAPY: number;
	allocation: PortfolioAllocation;
}

export function getMyPortfolio(token: string): Promise<MyPortfolioResponse> {
	return apiClient<MyPortfolioResponse>("/portfolio/my-portfolio", { token });
}

// ─── Lend & Borrow Assets ───────────────────────────────────────────

export interface LendBorrowChartPoint {
	date: string;
	lendAmount: number | string;
	borrowAmount: number | string;
}

export interface LendBorrowAssetsResponse {
	suppliedAssets: number;
	borrowedAssets: number;
	healthFactor: number;
	chartData: LendBorrowChartPoint[];
}

export function getLendBorrowAssets(
	token: string,
): Promise<LendBorrowAssetsResponse> {
	return apiClient<LendBorrowAssetsResponse>(
		"/portfolio/lend-borrow-assets",
		{ token },
	);
}

// ─── My Positions ───────────────────────────────────────────────────

export interface MyPositionItem {
	id: string;
	marketId?: string;
	symbol: string;
	name: string;
	walletBalance: number;
	amountInUsd: number;
	apr: number;
	isCollateral: boolean;
	imageUrl: string | null;
	side: "LEND" | "BORROW";
	maturity: number | null;
}

export interface MyPositionsResponse {
	data: MyPositionItem[];
	page: number;
	limit: number;
	totalData: number;
	totalPages: number;
}

export async function getMyPositions(
	token: string,
	params?: { type?: "LEND" | "BORROW"; page?: number; limit?: number; assetId?: string },
): Promise<MyPositionsResponse> {
	const page = params?.page ?? 1;
	const limit = params?.limit ?? 10;
	const searchParams = new URLSearchParams({
		page: String(page),
		limit: String(limit),
	});
	if (params?.type) searchParams.set("type", params.type);
	if (params?.assetId) searchParams.set("assetId", params.assetId);

	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		Authorization: `Bearer ${token}`,
	};

	const res = await fetch(
		`/api/portfolio/my-position?${searchParams.toString()}`,
		{ headers },
	);

	if (!res.ok) {
		throw new Error(`API error: ${res.status} ${res.statusText}`);
	}

	const json = await res.json();
	const meta = json.meta ?? {};
	return {
		data: json.data ?? [],
		page: meta.page ?? page,
		limit: meta.limit ?? limit,
		totalData: meta.totalData ?? 0,
		totalPages: meta.totalPages ?? 0,
	};
}

// ─── User Details (Assets + Debt) ───────────────────────────────────

export interface UserAssetDetail {
	assetId: string;
	totalBalance: number;
	lockedInOrders: number;
	availableBalance: number;
	availableBalanceUsd: number;
	isCollateral: boolean;
	ltv: number;
	liquidationThreshold: number;
}

export interface UserDebtDetail {
	assetId: string;
	debtAmount: number;
	debtAmountUsd: number;
}

export interface UserDetailsResponse {
	assets: UserAssetDetail[];
	totalDebtUsd: number;
	settledDebtUsd: number;
	pendingDebtUsd: number;
	debts: UserDebtDetail[];
}

export function getUserDetails(
	token: string,
): Promise<UserDetailsResponse> {
	return apiClient<UserDetailsResponse>("/portfolio/user-details", {
		token,
	});
}

// ─── Set Asset As Collateral ────────────────────────────────────────

export function setAssetAsCollateral(
	assetIds: string[],
	isCollateral: boolean,
	token: string,
): Promise<void> {
	return apiClient<void>("/portfolio/is-collateral", {
		method: "PUT",
		body: { assetIds, isCollateral },
		token,
	});
}

// ─── My Assets (Portfolio) ───────────────────────────────────────────

export interface MyAssetItem {
	assetId: string;
	symbol: string;
	name: string;
	walletBalance: number;
	amountInUsd: number;
	isCollateral: boolean;
	imageUrl: string | null;
	ltv: number;
	liquidationThreshold: number;
}

export interface MyAssetsResponse {
	data: MyAssetItem[];
	page: number;
	limit: number;
	totalData: number;
	totalPages: number;
}

export async function getMyAssets(
	token: string,
	params?: { page?: number; limit?: number },
): Promise<MyAssetsResponse> {
	const page = params?.page ?? 1;
	const limit = params?.limit ?? 10;

	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		Authorization: `Bearer ${token}`,
	};

	const res = await fetch(
		`/api/portfolio/my-assets?page=${page}&limit=${limit}`,
		{ headers },
	);

	if (!res.ok) {
		throw new Error(`API error: ${res.status} ${res.statusText}`);
	}

	const json = await res.json();
	// API returns { statusCode, data: [...], meta: { page, limit, totalData, totalPages } }
	const meta = json.meta ?? {};
	return {
		data: json.data ?? [],
		page: meta.page ?? page,
		limit: meta.limit ?? limit,
		totalData: meta.totalData ?? 0,
		totalPages: meta.totalPages ?? 0,
	};
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

// ─── Open Order Locked Amounts ───────────────────────────────────────

export interface OpenLendAmount {
	assetId: string;
	lockedAmount: string;
}

export function getOpenLendAmounts(
	token: string,
): Promise<OpenLendAmount[]> {
	return apiClient<OpenLendAmount[]>("/orders/open-amounts", { token });
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

// ─── Deposit ──────────────────────────────────────────────────────────

export interface DepositToken {
	id: string;
	symbol: string;
	name: string;
	tokenAddress: string;
	decimals: number | null;
	imageUrl: string | null;
	chainId: number | null;
}

export interface DepositResponse {
	transactionHash: string;
	status: string;
}

export interface BalanceResponse {
	balance: string;
	formattedBalance: string;
	decimals: number | null;
	symbol: string;
}

export function getDepositTokens(token?: string): Promise<DepositToken[]> {
	return apiClient<DepositToken[]>("/deposit/tokens", { token });
}

export function getDepositBalance(
	assetId: string,
	token: string,
): Promise<BalanceResponse> {
	return apiClient<BalanceResponse>(`/deposit/balance/${assetId}`, { token });
}

export function submitDeposit(
	assetId: string,
	amount: string,
	token: string,
): Promise<DepositResponse> {
	return apiClient<DepositResponse>("/deposit", {
		method: "POST",
		body: { assetId, amount },
		token,
	});
}

export function confirmDeposit(
	txHash: string,
	token: string,
): Promise<DepositResponse> {
	return apiClient<DepositResponse>("/deposit/confirm", {
		method: "POST",
		body: { txHash },
		token,
	});
}

// ─── Withdraw ─────────────────────────────────────────────────────────

export interface WithdrawResponse {
	txHash: string;
	status: string;
}

export function submitWithdraw(
	assetId: string,
	amount: string,
	token: string,
): Promise<WithdrawResponse> {
	return apiClient<WithdrawResponse>("/withdraw", {
		method: "POST",
		body: { assetId, amount },
		token,
	});
}

// ─── Order Management ─────────────────────────────────────────────────

export function cancelOrder(
	orderId: string,
	token: string,
): Promise<{ success: boolean }> {
	return apiClient<{ success: boolean }>(`/orders/${orderId}/cancel`, {
		method: "POST",
		token,
	});
}

export function updateOrder(
	orderId: string,
	data: { amount?: string; rate?: number },
	token: string,
): Promise<OrderResponseData> {
	return apiClient<OrderResponseData>(`/orders/${orderId}`, {
		method: "PATCH",
		body: data,
		token,
	});
}

// ─── Repay ────────────────────────────────────────────────────────────

export interface RepayResponse {
	txHash: string;
}

export function submitRepay(
	positionId: string,
	amount: string,
	token: string,
): Promise<RepayResponse> {
	return apiClient<RepayResponse>("/repay", {
		method: "POST",
		body: { positionId, amount },
		token,
	});
}

// ─── Transaction History ──────────────────────────────────────────────

export interface TransactionHistoryAsset {
	id: string;
	name: string;
	symbol: string;
	decimals: number;
	imageUrl: string | null;
	tokenAddress: string;
}

export interface TransactionHistoryItem {
	id: string;
	side: "LEND" | "BORROW";
	orderType: "LIMIT" | "MARKET";
	rate: number;
	amount: string;
	filledQuantity: string | null;
	status: "OPEN" | "PARTIALLY_FILLED" | "FILLED" | "CANCELLED";
	asset: TransactionHistoryAsset;
	fee: string | null;
	createdAt: string;
}

export interface TransactionHistoryResponse {
	statusCode: number;
	data: TransactionHistoryItem[];
	meta: {
		page: number;
		limit: number;
		total: number;
	};
}

export async function getTransactionHistory(
	token: string,
	params?: { page?: number; limit?: number; assetId?: string },
): Promise<TransactionHistoryResponse> {
	const page = params?.page ?? 1;
	const limit = params?.limit ?? 10;
	const searchParams = new URLSearchParams({
		page: String(page),
		limit: String(limit),
	});
	if (params?.assetId) searchParams.set("assetId", params.assetId);

	return apiClient<TransactionHistoryResponse>(
		`/portfolio/transaction-history?${searchParams.toString()}`,
		{ token },
	);
}

// ─── Open Orders ─────────────────────────────────────────────────────

export interface OpenOrderItem {
	id: string;
	side: "LEND" | "BORROW";
	orderType: "LIMIT" | "MARKET";
	rate: number;
	amount: string;
	filledQuantity: string | null;
	status: "OPEN" | "PARTIALLY_FILLED";
	maturity: string;
	asset: TransactionHistoryAsset;
	createdAt: string;
}

export interface OpenOrdersResponse {
	statusCode: number;
	data: OpenOrderItem[];
	meta: {
		page: number;
		limit: number;
		totalData: number;
		totalPages: number;
	};
}

export async function getOpenOrders(
	token: string,
	params?: { page?: number; limit?: number; assetId?: string },
): Promise<OpenOrdersResponse> {
	const page = params?.page ?? 1;
	const limit = params?.limit ?? 10;
	const searchParams = new URLSearchParams({
		page: String(page),
		limit: String(limit),
	});
	if (params?.assetId) searchParams.set("assetId", params.assetId);

	return apiClient<OpenOrdersResponse>(
		`/portfolio/open-orders?${searchParams.toString()}`,
		{ token },
	);
}

// ─── Withdraw Lend Position ──────────────────────────────────────────

export interface WithdrawLendPositionResponse {
	txHash: string;
	status: string;
}

export function withdrawLendPosition(
	marketId: string,
	token: string,
): Promise<WithdrawLendPositionResponse> {
	return apiClient<WithdrawLendPositionResponse>(
		"/portfolio/withdraw-lend-position",
		{
			method: "POST",
			body: { marketId },
			token,
		},
	);
}

