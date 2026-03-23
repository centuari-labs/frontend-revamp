"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { useOpenOrders } from "@/hooks/use-open-orders";
import type { OpenOrderItem } from "@/lib/api";
import { CentuariDataTable } from "@/components/tables/centuari-data-table";
import {
	createDateColumn,
	createLoanTokenColumn,
	createSideColumn,
	createOrderTypeColumn,
	createAmountColumn,
	createTargetAprColumn,
	createMaturityColumn,
	createStatusColumn,
} from "@/components/tables/shared-columns";

const columns: ColumnDef<OpenOrderItem>[] = [
	createDateColumn(),
	createLoanTokenColumn(),
	createSideColumn(),
	createOrderTypeColumn(),
	createAmountColumn(),
	createTargetAprColumn(),
	createMaturityColumn(),
	createStatusColumn(),
	{
		id: "actions",
		header: "Actions",
		cell: () => (
			<div className="flex items-center gap-2">
				<button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
					<Trash2 size={14} className="text-red-400" />
				</button>
			</div>
		),
	},
];

export function DataTableOpenOrders({
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
	const { orders, totalData, totalPages, isLoading } = useOpenOrders({
		page,
		limit,
		...filters,
	});

	return (
		<CentuariDataTable
			data={orders}
			columns={columns}
			isLoading={isLoading}
			emptyMessage="No open orders."
			skeletonColumns={8}
			pagination={{
				page,
				totalPages,
				totalData,
				onPageChange: setPage,
				label: "open order",
			}}
		/>
	);
}
