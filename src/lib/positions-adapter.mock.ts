/**
 * Mock positions adapter - uses localStorage for demo.
 * Swap to positions-adapter.api.ts for real backend.
 *
 * Storage keys:
 * - centuari_positions: filled positions (All Transaction tab)
 * - centuari_open_orders: open orders (unfilled, Open Orders tab)
 */

import { formatDate } from "@/lib/utils";
import { defaultPortfolio } from "@/lib/portfolio-data";
import type {
	LendPosition,
	BorrowPosition,
	Position,
	SubmitLendLimitParams,
	SubmitLendMarketParams,
	SubmitBorrowLimitParams,
	SubmitBorrowMarketParams,
	WithdrawLendParams,
	RepayBorrowParams,
} from "@/types/positions";

// Per-token best APR (display strings and numeric percentage). Each token has different rates.
const TOKEN_APRS: Record<
	string,
	{
		lendDisplay: string;
		borrowDisplay: string;
		collateralFactor: string;
		lendPct: number;
		borrowPct: number;
	}
> = {
	usdc: {
		lendDisplay: "6,5%",
		borrowDisplay: "10,1%",
		collateralFactor: "75%",
		lendPct: 6.5,
		borrowPct: 10.1,
	},
	xsgd: {
		lendDisplay: "5,2%",
		borrowDisplay: "9,3%",
		collateralFactor: "75%",
		lendPct: 5.2,
		borrowPct: 9.3,
	},
	idrx: {
		lendDisplay: "7,1%",
		borrowDisplay: "11,2%",
		collateralFactor: "75%",
		lendPct: 7.1,
		borrowPct: 11.2,
	},
	usdt: {
		lendDisplay: "6,2%",
		borrowDisplay: "9,8%",
		collateralFactor: "75%",
		lendPct: 6.2,
		borrowPct: 9.8,
	},
};

function _parseAPRDisplay(s: string): number {
	return parseFloat(s.replace(",", ".").replace("%", "")) || 6;
}

function getTokenRates(tokenSymbolOrValue: string) {
	const key = tokenSymbolOrValue.toLowerCase();
	return (
		TOKEN_APRS[key] ?? {
			lendDisplay: "6,0%",
			borrowDisplay: "9,5%",
			collateralFactor: "75%",
			lendPct: 6,
			borrowPct: 9.5,
		}
	);
}

/** Per-token display string for Lend APR (e.g. "6,5%"). */
export function getBestLendAPRDisplay(tokenSymbolOrValue: string): string {
	return getTokenRates(tokenSymbolOrValue).lendDisplay;
}

/** Per-token display string for Borrow APR (e.g. "10,1%"). */
export function getBestBorrowAPRDisplay(tokenSymbolOrValue: string): string {
	return getTokenRates(tokenSymbolOrValue).borrowDisplay;
}

/** Per-token display string for Collateral Factor (e.g. "75%"). */
export function getCollateralFactorDisplay(tokenSymbolOrValue: string): string {
	return getTokenRates(tokenSymbolOrValue).collateralFactor;
}

/** Per-token numeric Lend APR as percentage (e.g. 6.5). Use / 100 for decimal in position.apr. */
export function getBestLendAPR(tokenValue: string): number {
	return getTokenRates(tokenValue).lendPct;
}

/** Per-token numeric Borrow APR as percentage (e.g. 10.1). Use / 100 for decimal in position.apr. */
export function getBestBorrowAPR(tokenValue: string): number {
	return getTokenRates(tokenValue).borrowPct;
}

// Legacy exports for consumers that don't have token context (e.g. lend-form market APR); use first token as default
export const bestLendAPRDisplay = getBestLendAPRDisplay("usdc");
export const bestBorrowAPRDisplay = getBestBorrowAPRDisplay("usdc");
export const bestLendAPR = getBestLendAPR("usdc");
export const bestBorrowAPR = getBestBorrowAPR("usdc");

const STORAGE_POSITIONS = "centuari_positions"; // Filled positions (All Transaction)
const STORAGE_OPEN_ORDERS = "centuari_open_orders"; // Open orders (unfilled, Open Orders tab)

function notifyUpdate() {
	if (typeof window !== "undefined") {
		window.dispatchEvent(new Event("storage"));
		window.dispatchEvent(new CustomEvent("centuari-positions-updated"));
	}
}

function getStored<T>(key: string): T[] {
	if (typeof window === "undefined") return [];
	try {
		const stored = localStorage.getItem(key);
		if (!stored) return [];
		return JSON.parse(stored) as T[];
	} catch {
		return [];
	}
}

function setStored(key: string, data: Position[]) {
	if (typeof window === "undefined") return;
	localStorage.setItem(key, JSON.stringify(data));
	notifyUpdate();
}

// Open orders (unfilled) -> centuari_open_orders
export function getOpenOrders(): Position[] {
	return getStored<Position>(STORAGE_OPEN_ORDERS);
}

// Filled positions (All Transaction) -> centuari_positions
export function getAllTransactions(): Position[] {
	return getStored<Position>(STORAGE_POSITIONS);
}

export function getAllPositions(): {
	openOrders: Position[];
	allTransactions: Position[];
} {
	return {
		openOrders: getOpenOrders(),
		allTransactions: getAllTransactions(),
	};
}

// Simulate processing delay
const MOCK_DELAY_MS = 1500;
export async function mockDelay(ms = MOCK_DELAY_MS) {
	await new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Submit open order (-> centuari_open_orders, no portfolio update) ---
export async function submitOpenOrder(
	position: LendPosition | BorrowPosition,
): Promise<LendPosition | BorrowPosition> {
	await mockDelay();
	const existing = getOpenOrders();
	const updated = [...existing, position];
	setStored(STORAGE_OPEN_ORDERS, updated);
	return position;
}

// --- Submit filled position (-> centuari_positions, with portfolio update) ---
export async function submitFilledLendPosition(
	position: LendPosition,
	options: { amountInUsd: number; tokenValue: string },
): Promise<LendPosition> {
	await mockDelay();
	const existing = getAllTransactions();
	const matchIdx = existing.findIndex(
		(p) =>
			p.type === "lend" &&
			p.tokenValue === position.tokenValue &&
			p.maturity === position.maturity,
	);

	let updated: Position[];
	let result: LendPosition;
	if (matchIdx >= 0) {
		const existingPos = existing[matchIdx] as LendPosition;
		const totalAmount = existingPos.amount + position.amount;
		const weightedApr =
			(existingPos.amount * existingPos.apr + position.amount * position.apr) /
			totalAmount;
		const merged: LendPosition = {
			...existingPos,
			amount: totalAmount,
			apr: weightedApr,
		};
		updated = existing.map((p, i) => (i === matchIdx ? merged : p));
		result = merged;
	} else {
		updated = [...existing, position];
		result = position;
	}
	setStored(STORAGE_POSITIONS, updated);

	// Update portfolio and total supply
	if (typeof window !== "undefined") {
		const stored = localStorage.getItem("centuari_portfolio");
		const portfolio = stored ? JSON.parse(stored) : defaultPortfolio;
		const current = portfolio[options.tokenValue] || 0;
		portfolio[options.tokenValue] = Math.max(0, current - options.amountInUsd);
		localStorage.setItem("centuari_portfolio", JSON.stringify(portfolio));

		const supplyStored = localStorage.getItem("centuari_total_supply");
		const totalSupply = supplyStored ? parseFloat(supplyStored) || 0 : 0;
		localStorage.setItem(
			"centuari_total_supply",
			(totalSupply + options.amountInUsd).toString(),
		);
	}
	notifyUpdate();
	return result;
}

export async function submitFilledBorrowPosition(
	position: BorrowPosition,
	options: { amount: number },
): Promise<BorrowPosition> {
	await mockDelay();
	const existing = getAllTransactions();
	const matchIdx = existing.findIndex(
		(p) =>
			p.type === "borrow" &&
			p.tokenValue === position.tokenValue &&
			p.maturity === position.maturity,
	);

	let updated: Position[];
	let result: BorrowPosition;
	if (matchIdx >= 0) {
		const existingPos = existing[matchIdx] as BorrowPosition;
		const totalAmount = existingPos.amount + position.amount;
		const weightedApr =
			(existingPos.amount * existingPos.apr + position.amount * position.apr) /
			totalAmount;
		const merged: BorrowPosition = {
			...existingPos,
			amount: totalAmount,
			apr: weightedApr,
			collateralTokens: [
				...new Set([
					...existingPos.collateralTokens,
					...position.collateralTokens,
				]),
			],
		};
		updated = existing.map((p, i) => (i === matchIdx ? merged : p));
		result = merged;
	} else {
		updated = [...existing, position];
		result = position;
	}
	setStored(STORAGE_POSITIONS, updated);

	if (typeof window !== "undefined") {
		const stored = localStorage.getItem("centuari_total_debt");
		const totalDebt = stored ? parseFloat(stored) || 0 : 0;
		localStorage.setItem(
			"centuari_total_debt",
			(totalDebt + options.amount).toString(),
		);
	}
	notifyUpdate();
	return result;
}

// --- Update open order (in centuari_open_orders) ---
export async function updateOpenOrder(
	position: LendPosition | BorrowPosition,
): Promise<void> {
	await mockDelay();
	const existing = getOpenOrders();
	const idx = existing.findIndex((p) => p.id === position.id);
	const updated =
		idx >= 0
			? existing.map((p) => (p.id === position.id ? position : p))
			: [...existing, position];
	setStored(STORAGE_OPEN_ORDERS, updated);
}

// --- Update filled position (in centuari_positions) ---
export async function updateFilledPosition(
	position: LendPosition | BorrowPosition,
): Promise<void> {
	await mockDelay();
	const existing = getAllTransactions();
	const updated = existing.map((p) => (p.id === position.id ? position : p));
	setStored(STORAGE_POSITIONS, updated);
	notifyUpdate();
}

// --- Delete open order (from centuari_open_orders) ---
export async function deleteOpenOrder(positionId: string): Promise<void> {
	await mockDelay();
	const existing = getOpenOrders();
	const updated = existing.filter((p) => p.id !== positionId);
	setStored(STORAGE_OPEN_ORDERS, updated);
}

// --- Delete filled position (from centuari_positions) ---
export async function deleteFilledPosition(positionId: string): Promise<void> {
	await mockDelay();
	const existing = getAllTransactions();
	const updated = existing.filter((p) => p.id !== positionId);
	setStored(STORAGE_POSITIONS, updated);
	notifyUpdate();
}

// --- Withdraw from lend position (in centuari_positions) ---
export async function withdrawLendPosition(
	params: WithdrawLendParams,
): Promise<void> {
	await mockDelay();
	const existing = getAllTransactions();
	const updated = existing
		.map((pos) => {
			if (pos.marketId !== params.marketId || pos.type !== "lend") return pos;
			const newAmount = Math.max(0, pos.amount - params.amount);
			if (newAmount < 0.01) return null;
			return { ...pos, amount: newAmount };
		})
		.filter((p): p is Position => p !== null);
	setStored(STORAGE_POSITIONS, updated);

	// Update portfolio and total supply
	if (typeof window !== "undefined") {
		const stored = localStorage.getItem("centuari_portfolio");
		const portfolio = stored ? JSON.parse(stored) : defaultPortfolio;
		const current = portfolio[params.tokenValue] || 0;
		portfolio[params.tokenValue] = current + params.amount;
		localStorage.setItem("centuari_portfolio", JSON.stringify(portfolio));

		const supplyStored = localStorage.getItem("centuari_total_supply");
		const totalSupply = supplyStored ? parseFloat(supplyStored) || 0 : 0;
		localStorage.setItem(
			"centuari_total_supply",
			Math.max(0, totalSupply - params.amount).toString(),
		);
	}
	notifyUpdate();
}

// --- Repay borrow position (in centuari_positions) ---
export async function repayBorrowPosition(
	params: RepayBorrowParams,
): Promise<void> {
	await mockDelay();
	const existing = getAllTransactions();
	const updated = existing
		.map((pos) => {
			if (pos.marketId !== params.marketId || pos.type !== "borrow") return pos;
			const newAmount = Math.max(0, pos.amount - params.amount);
			if (newAmount < 0.01) return null;
			return { ...pos, amount: newAmount };
		})
		.filter((p): p is Position => p !== null);
	setStored(STORAGE_POSITIONS, updated);

	if (typeof window !== "undefined") {
		const stored = localStorage.getItem("centuari_total_debt");
		const totalDebt = stored ? parseFloat(stored) || 0 : 0;
		localStorage.setItem(
			"centuari_total_debt",
			Math.max(0, totalDebt - params.amount).toString(),
		);

		const portfolioStored = localStorage.getItem("centuari_portfolio");
		const portfolio = portfolioStored
			? JSON.parse(portfolioStored)
			: defaultPortfolio;
		const current = portfolio[params.tokenValue] || 0;
		portfolio[params.tokenValue] = Math.max(0, current - params.futureAmount);
		localStorage.setItem("centuari_portfolio", JSON.stringify(portfolio));
	}
	notifyUpdate();
}

// --- Helpers to build position payloads ---
export function buildLendLimitPosition(
	params: SubmitLendLimitParams,
): LendPosition {
	const id =
		params.editingPosition?.id ?? `lend-${params.tokenValue}-${Date.now()}`;
	const apr = params.targetApr;
	return {
		id,
		assetImg: params.tokenLogo,
		assetName: params.tokenLabel,
		amount: params.amountInUsd,
		apr,
		type: "lend",
		tokenValue: params.tokenValue,
		tokenSymbol: params.tokenLabel.toUpperCase().slice(0, 4),
		maturity: params.maturity,
		status: "OPEN",
		createdAt: formatDate(new Date()),
		timestamp: Date.now(),
		orderType: "limit",
	};
}

export function buildLendMarketPosition(
	params: SubmitLendMarketParams,
): LendPosition {
	const id =
		params.editingPosition?.id ?? `lend-${params.tokenValue}-${Date.now()}`;
	const apr = getBestLendAPR(params.tokenValue) / 100;
	return {
		id,
		assetImg: params.tokenLogo,
		assetName: params.tokenLabel,
		amount: params.amountInUsd,
		apr,
		type: "lend",
		tokenValue: params.tokenValue,
		tokenSymbol: params.tokenLabel.toUpperCase().slice(0, 4),
		maturity: params.maturity,
		status: "FILLED",
		createdAt: formatDate(new Date()),
		timestamp: Date.now(),
		orderType: "market",
	};
}

export function buildBorrowLimitPosition(
	params: SubmitBorrowLimitParams,
): BorrowPosition {
	const id =
		params.editingPosition?.id ?? `borrow-${params.tokenValue}-${Date.now()}`;
	const apr = params.targetApr;
	return {
		id,
		assetImg: params.tokenLogo,
		assetName: params.tokenLabel,
		amount: params.amount,
		apr,
		type: "borrow",
		tokenValue: params.tokenValue,
		tokenSymbol: params.tokenLabel.toUpperCase().slice(0, 4),
		maturity: params.maturity,
		status: "OPEN",
		createdAt: formatDate(new Date()),
		timestamp: Date.now(),
		collateralTokens: params.collateralTokens,
		orderType: "limit",
	};
}

export function buildBorrowMarketPosition(
	params: SubmitBorrowMarketParams,
): BorrowPosition {
	const id =
		params.editingPosition?.id ?? `borrow-${params.tokenValue}-${Date.now()}`;
	const apr = getBestBorrowAPR(params.tokenValue) / 100;
	return {
		id,
		assetImg: params.tokenLogo,
		assetName: params.tokenLabel,
		amount: params.amount,
		apr,
		type: "borrow",
		tokenValue: params.tokenValue,
		tokenSymbol: params.tokenLabel.toUpperCase().slice(0, 4),
		maturity: params.maturity,
		status: "FILLED",
		createdAt: formatDate(new Date()),
		timestamp: Date.now(),
		collateralTokens: params.collateralTokens,
		orderType: "market",
	};
}
