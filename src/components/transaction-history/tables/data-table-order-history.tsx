"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useOrderHistory } from "@/hooks/use-order-history";
import type { OrderHistoryItem } from "@/lib/api";
import { CentuariDataTable } from "@/components/tables/centuari-data-table";
import {
	createDateColumn,
	createLoanTokenColumn,
	createSideColumn,
	createOrderTypeColumn,
	createAmountColumn,
	createFilledAmountColumn,
	createFeeColumn,
	createTargetAprColumn,
	createMaturityColumn,
	createStatusColumn,
} from "@/components/tables/shared-columns";

const columns: ColumnDef<OrderHistoryItem>[] = [
	createDateColumn(),
	createLoanTokenColumn(),
	createSideColumn(),
	createOrderTypeColumn(),
	createAmountColumn(),
	createFilledAmountColumn(),
	createFeeColumn(),
	createTargetAprColumn(),
	createMaturityColumn(),
	createStatusColumn(),
];

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

	return (
		<CentuariDataTable
			data={transactions}
			columns={columns}
			isLoading={isLoading}
			skeletonColumns={7}
			pagination={{
				page,
				totalPages,
				totalData: total,
				onPageChange: setPage,
				label: "total order",
			}}
		/>
	);
}
