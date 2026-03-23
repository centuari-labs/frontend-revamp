"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useTransactionHistory } from "@/hooks/use-transaction-history";
import type { TransactionHistoryItem } from "@/lib/api";
import { CentuariDataTable } from "@/components/tables/centuari-data-table";
import {
	createDateColumn,
	createLoanTokenColumn,
	createSideColumn,
	createAmountColumn,
	createFeeColumn,
	createAprColumn,
	createMaturityColumn,
} from "@/components/tables/shared-columns";

const columns: ColumnDef<TransactionHistoryItem>[] = [
	createDateColumn(),
	createLoanTokenColumn(),
	createSideColumn(),
	createAmountColumn(),
	createFeeColumn(),
	createAprColumn(),
	createMaturityColumn(),
];

export function DataTableTransactionHistory({
	filters,
}: {
	filters?: {
		side?: string;
		startDate?: string;
		endDate?: string;
	};
}) {
	const [page, setPage] = React.useState(1);
	const limit = 10;
	const { transactions, total, totalPages, isLoading } = useTransactionHistory({
		page,
		limit,
		...filters,
	});

	return (
		<CentuariDataTable
			data={transactions}
			columns={columns}
			isLoading={isLoading}
			minWidth="700px"
			skeletonColumns={6}
			pagination={{
				page,
				totalPages,
				totalData: total,
				onPageChange: setPage,
				label: "total transaction",
			}}
		/>
	);
}
