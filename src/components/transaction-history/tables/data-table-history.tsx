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
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Pencil,
  Trash,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export type HistoryItemProps = {
  id: string;
  date: string;
  type: "Borrow" | "Lend";
  tokenSymbol: string;
  tokenImg: string;
  collateralSymbol?: string;
  collateralImg?: string;
  amount: number;
  rateType: "APY" | "APR";
  rateValue: number;
  healthFactor?: string;
};

const data: HistoryItemProps[] = [
  {
    id: "1",
    date: "Oct 7, 2025",
    type: "Borrow",
    tokenSymbol: "USDT",
    tokenImg: "/tokens/usdt-icon.svg",
    collateralSymbol: "ETH",
    collateralImg: "/tokens/eth-icon.svg",
    amount: 12000,
    rateType: "APY",
    rateValue: 12,
    healthFactor: "0.0 - Safe",
  },
  {
    id: "2",
    date: "Oct 7, 2025",
    type: "Lend",
    tokenSymbol: "USDT",
    tokenImg: "/tokens/usdt-icon.svg",
    amount: 12000,
    rateType: "APR",
    rateValue: 22,
  },
  {
    id: "3",
    date: "Oct 7, 2025",
    type: "Borrow",
    tokenSymbol: "USDT",
    tokenImg: "/tokens/usdt-icon.svg",
    collateralSymbol: "XAUT",
    collateralImg: "/tokens/xaut-icon.png",
    amount: 12000,
    rateType: "APR",
    rateValue: 22,
    healthFactor: "0.0 - Safe",
  },
  {
    id: "4",
    date: "Oct 7, 2025",
    type: "Lend",
    tokenSymbol: "USDT",
    tokenImg: "/tokens/usdt-icon.svg",
    amount: 12000,
    rateType: "APR",
    rateValue: 22,
  },
  {
    id: "5",
    date: "Oct 7, 2025",
    type: "Borrow",
    tokenSymbol: "USDT",
    tokenImg: "/tokens/usdt-icon.svg",
    collateralSymbol: "XAUT",
    collateralImg: "/tokens/xaut-icon.png",
    amount: 12000,
    rateType: "APR",
    rateValue: 22,
    healthFactor: "0.0 - Safe",
  },
  {
    id: "6",
    date: "Oct 7, 2025",
    type: "Borrow",
    tokenSymbol: "USDT",
    tokenImg: "/tokens/usdt-icon.svg",
    collateralSymbol: "ETH",
    collateralImg: "/tokens/eth-icon.svg",
    amount: 12000,
    rateType: "APY",
    rateValue: 12,
    healthFactor: "0.0 - Safe",
  },
  {
    id: "7",
    date: "Oct 7, 2025",
    type: "Lend",
    tokenSymbol: "USDT",
    tokenImg: "/tokens/usdt-icon.svg",
    amount: 12000,
    rateType: "APR",
    rateValue: 22,
  },
  {
    id: "8",
    date: "Oct 7, 2025",
    type: "Borrow",
    tokenSymbol: "USDT",
    tokenImg: "/tokens/usdt-icon.svg",
    collateralSymbol: "XAUT",
    collateralImg: "/tokens/xaut-icon.png",
    amount: 12000,
    rateType: "APR",
    rateValue: 22,
    healthFactor: "0.0 - Safe",
  },
  {
    id: "9",
    date: "Oct 7, 2025",
    type: "Lend",
    tokenSymbol: "USDT",
    tokenImg: "/tokens/usdt-icon.svg",
    amount: 12000,
    rateType: "APR",
    rateValue: 22,
  },
  {
    id: "10",
    date: "Oct 7, 2025",
    type: "Borrow",
    tokenSymbol: "USDT",
    tokenImg: "/tokens/usdt-icon.svg",
    collateralSymbol: "XAUT",
    collateralImg: "/tokens/xaut-icon.png",
    amount: 12000,
    rateType: "APR",
    rateValue: 22,
    healthFactor: "0.0 - Safe",
  },
];

export const columns: ColumnDef<HistoryItemProps>[] = [
  {
    accessorKey: "date",
    header: "Date",
  },
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    accessorKey: "tokenSymbol",
    header: "Token",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Image
          src={row.original.tokenImg}
          alt={row.original.tokenSymbol}
          width={24}
          height={24}
        />
        <span>{row.original.tokenSymbol}</span>
      </div>
    ),
  },
  {
    accessorKey: "collateralSymbol",
    header: "Collateral",
    cell: ({ row }) => {
      if (!row.original.collateralSymbol) return "-";
      return (
        <div className="flex items-center gap-2">
          <Image
            src={row.original.collateralImg || ""}
            alt={row.original.collateralSymbol}
            width={24}
            height={24}
          />
          <span>{row.original.collateralSymbol}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(row.original.amount),
  },
  {
    id: "rate",
    header: "APY/APR",
    cell: ({ row }) => `${row.original.rateType} ${row.original.rateValue}%`,
  },
  {
    accessorKey: "healthFactor",
    header: "Health Factor",
    cell: ({ row }) => {
      if (!row.original.healthFactor) return "-";
      return (
        <CentuariBadge
          variant="secondary"
          className="text-[#00FF85] bg-[#00FF85]/10 border-none"
        >
          {row.original.healthFactor}
        </CentuariBadge>
      );
    },
  },
];

export function DataTableHistory() {
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
