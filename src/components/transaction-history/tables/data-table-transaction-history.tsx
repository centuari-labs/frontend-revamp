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
import { useTokens, getTokenById } from "@/hooks/use-tokens";

type EnrichedTransactionHistory = TransactionHistoryItem & { tokenSymbol: string; assetImg: string };

const columns: ColumnDef<EnrichedTransactionHistory>[] = [
	createDateColumn<EnrichedTransactionHistory>(),
	createLoanTokenColumn<EnrichedTransactionHistory>(),
	createSideColumn<EnrichedTransactionHistory>(),
	createAmountColumn<EnrichedTransactionHistory>(),
	createFeeColumn<EnrichedTransactionHistory>(),
	createAprColumn<EnrichedTransactionHistory>(),
	createMaturityColumn<EnrichedTransactionHistory>(),
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
	const { tokens } = useTokens();

	const enrichedTransactions = React.useMemo<EnrichedTransactionHistory[]>(() =>
		transactions.map((t) => {
			const token = getTokenById(tokens, t.assetId);
			return {
				...t,
				tokenSymbol: token?.symbol ?? t.asset?.symbol ?? "",
				assetImg: token?.imageUrl ?? t.asset?.imageUrl ?? "",
			};
		}),
		[transactions, tokens],
	);

	return (
		<CentuariDataTable
			data={enrichedTransactions}
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
