"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
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
import { Edit2, Trash2 } from "lucide-react";

export type OpenOrderItemProps = {
  id: string;
  tokenSymbol: string;
  tokenImg: string;
  orderType: "Lend" | "Borrow";
  amount: number;
  apr: number;
  maturity: string;
  createdAt: string;
  status: "pending" | "processing" | "success" | "failed";
};

const statusStyles: Record<OpenOrderItemProps["status"], { color: string; bg: string }> = {
  pending: { color: "text-yellow-500", bg: "bg-yellow-500" },
  processing: { color: "text-blue-500", bg: "bg-blue-500" },
  success: { color: "text-green-500", bg: "bg-green-500" },
  failed: { color: "text-red-500", bg: "bg-red-500" },
};

const data: OpenOrderItemProps[] = [
  {
    id: "1",
    tokenSymbol: "USDT",
    tokenImg: "/tokens/usdt-icon.webp",
    orderType: "Borrow",
    amount: 12000,
    apr: 0.12,
    maturity: "Dec 31, 2025",
    createdAt: "Oct 7, 2025 14:32:15",
    status: "pending",
  },
  {
    id: "2",
    tokenSymbol: "USDT",
    tokenImg: "/tokens/usdt-icon.webp",
    orderType: "Lend",
    amount: 12000,
    apr: 0.22,
    maturity: "Jan 15, 2026",
    createdAt: "Oct 7, 2025 09:15:42",
    status: "success",
  },
  {
    id: "3",
    tokenSymbol: "USDT",
    tokenImg: "/tokens/usdt-icon.webp",
    orderType: "Borrow",
    amount: 12000,
    apr: 0.22,
    maturity: "Mar 1, 2026",
    createdAt: "Oct 7, 2025 11:05:30",
    status: "processing",
  },
  {
    id: "4",
    tokenSymbol: "USDT",
    tokenImg: "/tokens/usdt-icon.webp",
    orderType: "Lend",
    amount: 12000,
    apr: 0.22,
    maturity: "Feb 28, 2026",
    createdAt: "Oct 7, 2025 16:45:10",
    status: "failed",
  },
  {
    id: "5",
    tokenSymbol: "USDT",
    tokenImg: "/tokens/usdt-icon.webp",
    orderType: "Borrow",
    amount: 12000,
    apr: 0.22,
    maturity: "Apr 15, 2026",
    createdAt: "Oct 7, 2025 08:20:55",
    status: "pending",
  },
];

export const columns: ColumnDef<OpenOrderItemProps>[] = [
  {
    accessorKey: "tokenSymbol",
    header: "Loan Token",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Image
          src={row.original.tokenImg}
          alt={row.original.tokenSymbol}
          width={24}
          height={24}
          className="rounded-full"
        />
        <span>{row.original.tokenSymbol}</span>
      </div>
    ),
  },
  {
    accessorKey: "orderType",
    header: "Order Type",
    cell: ({ row }) => (
      <CentuariBadge
        variant={row.original.orderType === "Lend" ? "primary" : "warning"}
        className="capitalize"
      >
        {row.original.orderType}
      </CentuariBadge>
    ),
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => (
      <span>
        {new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(
          row.original.amount
        )}{" "}
        {row.original.tokenSymbol}
      </span>
    ),
  },
  {
    accessorKey: "apr",
    header: "Target APR %",
    cell: ({ row }) => {
      const aprPercent = (row.original.apr * 100).toFixed(1);
      return aprPercent.replace(".", ",") + "%";
    },
  },
  {
    accessorKey: "maturity",
    header: "Maturity",
  },
  {
    accessorKey: "createdAt",
    header: "Created at",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const styles = statusStyles[status];
      return (
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 ${styles.bg} rounded-full`} />
          <span className="capitalize">{status}</span>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: () => (
      <div className="flex items-center gap-2">
        <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
          <Edit2 size={14} className="text-white" />
        </button>
        <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
          <Trash2 size={14} className="text-red-400" />
        </button>
      </div>
    ),
  },
];

export function DataTableOpenOrders() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-md">
        <Table className="min-w-[800px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-white/5">
                {headerGroup.headers.map((header) => {
                  return (
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
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="border border-transparent py-1"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
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
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
