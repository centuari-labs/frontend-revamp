"use client";

import * as React from "react";
import {
	ColumnDef,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import { CentuariBadge } from "@/components/centuari-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrderHistory } from "@/hooks/use-order-history";
import type { OrderHistoryItem } from "@/lib/api";
import { format } from "date-fns";

const statusDotColors: Record<OrderHistoryItem["status"], string> = {
	OPEN: "bg-blue-500",
	CANCELLED: "bg-red-500",
	PARTIALLY_FILLED: "bg-yellow-500",
	FILLED: "bg-green-500",
};

const statusLabels: Record<OrderHistoryItem["status"], string> = {
	OPEN: "Open",
	CANCELLED: "Cancelled",
	PARTIALLY_FILLED: "Partially Filled",
	FILLED: "Filled",
};

const columns: ColumnDef<OrderHistoryItem>[] = [
	{
		accessorKey: "createdAt",
		header: "Date",
		cell: ({ row }) => {
			const date = new Date(row.original.createdAt);
			return format(date, "MMM d, yyyy HH:mm:ss");
		},
	},
	{
		id: "token",
		header: "Loan Token",
		cell: ({ row }) => (
			<div className="flex items-center gap-2">
				{row.original.asset.imageUrl && (
					<Image
						src={row.original.asset.imageUrl}
						alt={row.original.asset.symbol}
						width={24}
						height={24}
						className="rounded-full"
					/>
				)}
				<span>{row.original.asset.symbol}</span>
			</div>
		),
	},
	{
		accessorKey: "side",
		header: "Side",
		cell: ({ row }) => (
			<CentuariBadge
				variant={row.original.side === "LEND" ? "primary" : "warning"}
				className="capitalize"
			>
				{row.original.side === "LEND" ? "Lend" : "Borrow"}
			</CentuariBadge>
		),
	},
	{
		accessorKey: "orderType",
		header: "Order Type",
		cell: ({ row }) => (
			<span className="capitalize">
				{row.original.orderType?.toLowerCase() ?? "-"}
			</span>
		),
	},
	{
		accessorKey: "amount",
		header: "Amount",
		cell: ({ row }) => (
			<span>
				{new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(
					Number(row.original.amount),
				)}{" "}
				{row.original.asset.symbol}
			</span>
		),
	},
	{
		accessorKey: "filledQuantity",
		header: "Filled Amount",
		cell: ({ row }) => {
			if (!row.original.filledQuantity) return "-";
			return (
				<span>
					{new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(
						Number(row.original.filledQuantity),
					)}{" "}
					{row.original.asset.symbol}
				</span>
			);
		},
	},
	{
		accessorKey: "fee",
		header: "Fee",
		cell: ({ row }) => {
			if (!row.original.fee) return "-";
			return (
				<span>
					{new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(
						Number(row.original.fee),
					)}{" "}
					{row.original.asset.symbol}
				</span>
			);
		},
	},
	{
		accessorKey: "rate",
		header: "Target APR %",
		cell: ({ row }) => {
			if (row.original.orderType === "MARKET") return "-";
			return `${row.original.rate}%`;
		},
	},
	{
		accessorKey: "createdAt",
		header: "Created At",
		cell: ({ row }) => {
			if (!row.original.createdAt) return "-";
			const date = new Date(row.original.createdAt);
			if (Number.isNaN(date.getTime())) return "-";
			return format(date, "MMM d, yyyy");
		},
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => {
			const status = row.original.status;
			return (
				<div className="flex items-center gap-2">
					<span
						className={`w-2 h-2 ${statusDotColors[status]} rounded-full`}
					/>
					<span className="capitalize">{statusLabels[status]}</span>
				</div>
			);
		},
	},
];

function TableSkeleton() {
	return (
		<div className="space-y-3 py-4">
			{Array.from({ length: 5 }).map((_, i) => (
				<div key={i} className="flex gap-4 px-2">
					{Array.from({ length: 7 }).map((_, j) => (
						<Skeleton key={j} className="h-4 flex-1" />
					))}
				</div>
			))}
		</div>
	);
}

export function DataTableOrderHistory({
	filters,
}: {
	filters?: {
		side?: string;
		status?: string;
		startDate?: string;
		endDate?: string;
	};
}) {
	const [page, setPage] = React.useState(1);
	const limit = 10;
	const { transactions, total, totalPages, isLoading } = useOrderHistory({
		page,
		limit,
		...filters,
	});

	const table = useReactTable({
		data: transactions,
		columns,
		getCoreRowModel: getCoreRowModel(),
		manualPagination: true,
		pageCount: totalPages,
	});

	if (isLoading && transactions.length === 0) {
		return <TableSkeleton />;
	}

	return (
		<div className="w-full">
			<div className="overflow-hidden rounded-md">
				<Table className="min-w-[800px]">
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id} className="bg-white/5">
								{headerGroup.headers.map((header) => (
									<TableHead
										key={header.id}
										className={`text-sm text-muted-foreground font-normal ${headerGroup.headers[0].id === header.id
											? "rounded-l-sm"
											: ""
											} ${headerGroup.headers[headerGroup.headers.length - 1]
												.id === header.id
												? "rounded-r-sm"
												: ""
											}`}
									>
										{header.isPlaceholder
											? null
											: flexRender(
												header.column.columnDef.header,
												header.getContext(),
											)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow key={row.id}>
									{row.getVisibleCells().map((cell) => (
										<TableCell
											key={cell.id}
											className="border border-transparent py-1"
										>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<div className="flex items-center justify-between py-4">
				<div className="text-muted-foreground text-sm">
					{total} total order{total !== 1 ? "s" : ""}
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setPage((p) => Math.max(1, p - 1))}
						disabled={page <= 1}
					>
						Previous
					</Button>
					<span className="text-sm text-muted-foreground">
						Page {page} of {totalPages || 1}
					</span>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
						disabled={page >= totalPages}
					>
						Next
					</Button>
				</div>
			</div>
		</div>
	);
}
