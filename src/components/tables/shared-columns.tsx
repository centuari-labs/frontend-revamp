"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import { CentuariBadge } from "@/components/centuari-badge";
import { parseMaturity } from "@/lib/utils";
import { normalizeMaturity, formatMaturityTimestamp } from "@/lib/maturity";

/**
 * Common interface for order/position table rows.
 * Superset of OpenOrderItem, OrderHistoryItem, TransactionHistoryItem, and Position.
 * Each column factory only accesses the fields it needs.
 */
export interface OrderTableRow {
	id: string;
	createdAt: string;
	// API shape uses `side`, Position shape uses `type`
	side?: "LEND" | "BORROW" | "lend" | "borrow";
	type?: "lend" | "borrow";
	orderType?: "LIMIT" | "MARKET" | "limit" | "market";
	amount: string | number;
	rate?: number;
	apr?: number;
	fee?: string | number | null;
	filledQuantity?: string | number | null;
	maturity?: string | number | null;
	status?: string;
	cancelReason?: "USER_CANCELLED" | "IOC" | "MARKET_MATURED" | null;
	// API shape (OpenOrderItem, OrderHistoryItem, TransactionHistoryItem)
	asset?: { symbol: string; imageUrl?: string | null };
	// Position shape (mapped from API)
	tokenSymbol?: string;
	tokenValue?: string;
	assetImg?: string;
}

const STATUS_DOT_COLORS: Record<string, string> = {
	OPEN: "bg-blue-500",
	FILLED: "bg-green-500",
	CANCELLED: "bg-red-500",
	PARTIALLY_FILLED: "bg-yellow-500",
};

const STATUS_LABELS: Record<string, string> = {
	OPEN: "Open",
	FILLED: "Filled",
	CANCELLED: "Cancelled",
	PARTIALLY_FILLED: "Partially Filled",
};

function getSymbol(row: OrderTableRow): string {
	return row.asset?.symbol ?? row.tokenSymbol ?? "";
}

function getImageUrl(row: OrderTableRow): string | null {
	return row.asset?.imageUrl ?? row.assetImg ?? null;
}

function formatAmount(value: string | number): string {
	return new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(
		Number(value),
	);
}

function getSideNormalized(row: OrderTableRow): "LEND" | "BORROW" {
	const side = row.side ?? row.type ?? "";
	return side.toUpperCase() as "LEND" | "BORROW";
}

function getOrderTypeNormalized(
	orderType?: string,
): "LIMIT" | "MARKET" | undefined {
	if (!orderType) return undefined;
	return orderType.toUpperCase() as "LIMIT" | "MARKET";
}

export function createDateColumn<T extends OrderTableRow>(): ColumnDef<T> {
	return {
		accessorKey: "createdAt",
		header: "Date",
		cell: ({ row }) => {
			return new Date(row.original.createdAt).toLocaleString("en-US", {
				month: "short",
				day: "numeric",
				year: "numeric",
				hour: "2-digit",
				minute: "2-digit",
				hour12: true,
			});
		},
	};
}

export function createLoanTokenColumn<T extends OrderTableRow>(): ColumnDef<T> {
	return {
		id: "token",
		header: "Loan Token",
		cell: ({ row }) => {
			const symbol = getSymbol(row.original);
			const imageUrl = getImageUrl(row.original);
			return (
				<div className="flex items-center gap-2">
					{imageUrl && (
						<Image
							src={imageUrl}
							alt={symbol}
							width={24}
							height={24}
							className="rounded-full"
						/>
					)}
					<span>{symbol}</span>
				</div>
			);
		},
	};
}

export function createSideColumn<T extends OrderTableRow>(): ColumnDef<T> {
	return {
		id: "side",
		header: "Side",
		cell: ({ row }) => {
			const side = getSideNormalized(row.original);
			return (
				<CentuariBadge
					variant={side === "LEND" ? "primary" : "warning"}
					className="capitalize"
				>
					{side === "LEND" ? "Lend" : "Borrow"}
				</CentuariBadge>
			);
		},
	};
}

export function createOrderTypeColumn<T extends OrderTableRow>(): ColumnDef<T> {
	return {
		accessorKey: "orderType",
		header: "Order Type",
		cell: ({ row }) => (
			<span className="capitalize">
				{row.original.orderType?.toLowerCase() ?? "-"}
			</span>
		),
	};
}

export function createAmountColumn<T extends OrderTableRow>(): ColumnDef<T> {
	return {
		accessorKey: "amount",
		header: "Amount",
		cell: ({ row }) => (
			<span>
				{formatAmount(row.original.amount)} {getSymbol(row.original)}
			</span>
		),
	};
}

export function createFilledAmountColumn<
	T extends OrderTableRow,
>(): ColumnDef<T> {
	return {
		accessorKey: "filledQuantity",
		header: "Filled Amount",
		cell: ({ row }) => {
			if (!row.original.filledQuantity) return "-";
			return (
				<span>
					{formatAmount(row.original.filledQuantity)} {getSymbol(row.original)}
				</span>
			);
		},
	};
}

export function createFeeColumn<T extends OrderTableRow>(): ColumnDef<T> {
	return {
		accessorKey: "fee",
		header: "Fee",
		cell: ({ row }) => {
			if (!row.original.fee) return "-";
			return (
				<span>
					{formatAmount(row.original.fee)} {getSymbol(row.original)}
				</span>
			);
		},
	};
}

export function createTargetAprColumn<T extends OrderTableRow>(): ColumnDef<T> {
	return {
		accessorKey: "rate",
		header: "Target APR %",
		cell: ({ row }) => {
			const orderType = getOrderTypeNormalized(row.original.orderType);
			if (orderType === "MARKET") return "-";
			// Use rate (API shape) or apr (Position shape, needs *100)
			const rate = row.original.rate;
			if (rate != null) return `${rate}%`;
			const apr = row.original.apr;
			if (apr != null) {
				const aprPercent = (apr * 100).toFixed(1);
				return `${aprPercent.replace(".", ",")}%`;
			}
			return "-";
		},
	};
}

export function createAprColumn<T extends OrderTableRow>(): ColumnDef<T> {
	return {
		id: "aprPercent",
		header: "APR %",
		cell: ({ row }) => {
			// Use rate directly (API shape) or apr*100 (Position shape)
			const rate = row.original.rate;
			if (rate != null) return `${rate}%`;
			const apr = row.original.apr;
			if (apr != null) {
				const aprPercent = (apr * 100).toFixed(1);
				return `${aprPercent.replace(".", ",")}%`;
			}
			return "-";
		},
	};
}

export function createMaturityColumn<T extends OrderTableRow>(): ColumnDef<T> {
	return {
		accessorKey: "maturity",
		header: "Maturity",
		cell: ({ row }) => {
			const maturity = row.original.maturity;
			if (!maturity) return "-";
			// Try Position shape first (numeric timestamp)
			if (typeof maturity === "number") {
				return formatMaturityTimestamp(normalizeMaturity(maturity));
			}
			// API shape (string)
			const ms = parseMaturity(maturity);
			if (Number.isNaN(ms)) return "-";
			return new Date(ms).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				year: "numeric",
			});
		},
	};
}

function getStatusLabel(row: OrderTableRow): string {
	const status = row.status;
	if (!status) return "-";
	if (status === "CANCELLED" && row.cancelReason === "MARKET_MATURED") {
		// Auto-cancelled because the market passed maturity — surfaced as
		// "Expired" so users can tell it apart from a manual cancellation.
		return "Expired";
	}
	if (status === "CANCELLED" && row.cancelReason === "IOC") {
		return "Cancelled (IOC)";
	}
	return STATUS_LABELS[status] ?? status.toLowerCase().replace("_", " ");
}

export function createStatusColumn<T extends OrderTableRow>(): ColumnDef<T> {
	return {
		id: "status",
		header: "Status",
		cell: ({ row }) => {
			const status = row.original.status;
			if (!status) return "-";
			return (
				<div className="flex items-center gap-2">
					<span
						className={`w-2 h-2 ${STATUS_DOT_COLORS[status] ?? "bg-gray-500"} rounded-full`}
					/>
					<span>{getStatusLabel(row.original)}</span>
				</div>
			);
		},
	};
}
