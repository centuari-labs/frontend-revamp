/**
 * Shared fixtures: realistic BE response shapes for all endpoints.
 * Single source of truth for expected wire format in FE tests.
 */

// ─── Market Response ─────────────────────────────────────────────────

export const MARKET_RESPONSE = {
	total_deposit: "1500000.00",
	active_loans: "750000.00",
	markets: [
		{
			asset: {
				id: "b0000000-0000-0000-0000-000000000001",
				name: "USD Coin",
				symbol: "USDC",
				decimals: 6,
				image_url: null,
			},
			market: {
				market_id: "c0000000-0000-0000-0000-000000000001",
				maturity: 1748736000,
			},
			borrow_rate: 10.1,
			lend_rate: 6.5,
			collateral_factor: 75,
		},
		{
			asset: {
				id: "b0000000-0000-0000-0000-000000000002",
				name: "Ethereum",
				symbol: "ETH",
				decimals: 18,
				image_url: "https://example.com/eth.png",
			},
			market: {
				market_id: "c0000000-0000-0000-0000-000000000002",
				maturity: 1751328000,
			},
			borrow_rate: 8.5,
			lend_rate: 5.2,
			collateral_factor: 80,
		},
	],
};

// ─── Order Response (inner envelope from controller) ─────────────────

export const ORDER_RESPONSE_DATA = {
	orderId: "d0000000-0000-0000-0000-000000000001",
	walletAddress: "0xTestWallet123",
	assetId: "b0000000-0000-0000-0000-000000000001",
	markets: [
		{
			marketId: "c0000000-0000-0000-0000-000000000001",
			maturity: 1748736000,
		},
	],
	timestamp: 1709280000000,
	side: "LEND",
	type: "LIMIT",
	status: "OPEN",
	originalAmount: "1000",
	settlementFeeAmount: "50000",
	autoRollover: false,
	rate: 6.5,
	createdAt: "2026-03-01T00:00:00.000Z",
	updatedAt: "2026-03-01T00:00:00.000Z",
};

/** The inner envelope returned by OrdersController */
export const ORDER_INNER_ENVELOPE = {
	statusCode: 201,
	data: ORDER_RESPONSE_DATA,
};

/**
 * Full wire response after ResponseInterceptor wraps the OrderResponse.
 * This is what fetch() actually returns as JSON.
 */
export const ORDER_WIRE_RESPONSE = {
	statusCode: 201,
	data: ORDER_INNER_ENVELOPE,
};

// ─── My Assets Response (paginated) ─────────────────────────────────

export const MY_ASSETS_ITEMS = [
	{
		symbol: "USDC",
		name: "USD Coin",
		walletBalance: 5000,
		amountInUsd: 5000,
		isCollateral: false,
		imageUrl: null,
	},
	{
		symbol: "ETH",
		name: "Ethereum",
		walletBalance: 2.5,
		amountInUsd: 7500,
		isCollateral: true,
		imageUrl: null,
	},
];

/**
 * Full wire response for GET /portfolio/my-assets after interceptor transform.
 * ResponseInterceptor detects { data, page } and restructures into { data, meta }.
 */
export const MY_ASSETS_WIRE_RESPONSE = {
	statusCode: 200,
	data: MY_ASSETS_ITEMS,
	meta: {
		page: 1,
		limit: 100,
		totalData: 2,
		totalPages: 1,
	},
};

// ─── Market Wire Response ────────────────────────────────────────────

export const MARKET_WIRE_RESPONSE = {
	statusCode: 200,
	data: MARKET_RESPONSE,
};
