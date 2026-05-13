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
import { useTokens, getTokenById } from "@/hooks/use-tokens";

type EnrichedOrderHistory = OrderHistoryItem & { tokenSymbol: string; assetImg: string };

const columns: ColumnDef<EnrichedOrderHistory>[] = [
	createDateColumn<EnrichedOrderHistory>(),
	createLoanTokenColumn<EnrichedOrderHistory>(),
	createSideColumn<EnrichedOrderHistory>(),
	createOrderTypeColumn<EnrichedOrderHistory>(),
	createAmountColumn<EnrichedOrderHistory>(),
	createFilledAmountColumn<EnrichedOrderHistory>(),
	createFeeColumn<EnrichedOrderHistory>(),
	createTargetAprColumn<EnrichedOrderHistory>(),
	createMaturityColumn<EnrichedOrderHistory>(),
	createStatusColumn<EnrichedOrderHistory>(),
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
	const { tokens } = useTokens();

	const enrichedTransactions = React.useMemo<EnrichedOrderHistory[]>(() =>
		transactions.map((t) => {
			const token = getTokenById(tokens, t.assetId);
			return {
				...t,
				tokenSymbol: token?.symbol ?? "",
				assetImg: token?.imageUrl ?? "",
			};
		}),
		[transactions, tokens],
	);

	return (
		<CentuariDataTable
			data={enrichedTransactions}
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
