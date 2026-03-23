"use client";

import {
	flexRender,
	getCoreRowModel,
	useReactTable,
	type ColumnDef,
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
import { Skeleton } from "@/components/ui/skeleton";

interface PaginationProps {
	page: number;
	totalPages: number;
	totalData: number;
	onPageChange: (page: number) => void;
	label?: string;
}

interface CentuariDataTableProps<T> {
	data: T[];
	columns: ColumnDef<T>[];
	isLoading?: boolean;
	emptyMessage?: string;
	pagination?: PaginationProps;
	minWidth?: string;
	skeletonColumns?: number;
}

function TableSkeleton({ columns = 7 }: { columns?: number }) {
	return (
		<div className="space-y-3 py-4">
			{Array.from({ length: 5 }).map((_, i) => (
				<div key={i} className="flex gap-4 px-2">
					{Array.from({ length: columns }).map((_, j) => (
						<Skeleton key={j} className="h-4 flex-1" />
					))}
				</div>
			))}
		</div>
	);
}

export function CentuariDataTable<T>({
	data,
	columns,
	isLoading,
	emptyMessage = "No results.",
	pagination,
	minWidth = "800px",
	skeletonColumns,
}: CentuariDataTableProps<T>) {
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		...(pagination
			? { manualPagination: true, pageCount: pagination.totalPages }
			: {}),
	});

	if (isLoading && data.length === 0) {
		return <TableSkeleton columns={skeletonColumns ?? columns.length} />;
	}

	return (
		<div className="w-full">
			<div className="overflow-hidden rounded-md">
				<Table className={`min-w-[${minWidth}]`}>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id} className="bg-white/5">
								{headerGroup.headers.map((header) => (
									<TableHead
										key={header.id}
										className={`text-sm text-muted-foreground font-normal ${
											headerGroup.headers[0].id === header.id
												? "rounded-l-sm"
												: ""
										} ${
											headerGroup.headers[headerGroup.headers.length - 1]
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
									{emptyMessage}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			{pagination && (
				<div className="flex items-center justify-between py-4">
					<div className="text-muted-foreground text-sm">
						{pagination.totalData} {pagination.label ?? "result"}
						{pagination.totalData !== 1 ? "s" : ""}
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() =>
								pagination.onPageChange(Math.max(1, pagination.page - 1))
							}
							disabled={pagination.page <= 1}
						>
							Previous
						</Button>
						<span className="text-sm text-muted-foreground">
							Page {pagination.page} of {pagination.totalPages || 1}
						</span>
						<Button
							variant="outline"
							size="sm"
							onClick={() =>
								pagination.onPageChange(
									Math.min(pagination.totalPages, pagination.page + 1),
								)
							}
							disabled={pagination.page >= pagination.totalPages}
						>
							Next
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
