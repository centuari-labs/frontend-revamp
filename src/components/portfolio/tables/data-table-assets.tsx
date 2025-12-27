"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

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

export type AssetProps = {
  id: string;
  assetImg: string;
  assetName: string;
  assetSymbol: string;
  walletBalance: number;
  amountInUsd: number;
  isCollateral: boolean;
};

const data: AssetProps[] = [
  {
    id: "1",
    assetImg: "/tokens/eth-icon.svg",
    assetName: "Ethereum",
    assetSymbol: "ETH",
    walletBalance: 1234.0,
    amountInUsd: 4234.0,
    isCollateral: true,
  },
  {
    id: "2",
    assetImg: "/tokens/chainlink-icon.svg",
    assetName: "Link",
    assetSymbol: "Link",
    walletBalance: 1234.0,
    amountInUsd: 4234.0,
    isCollateral: false,
  },
  {
    id: "3",
    assetImg: "/tokens/eth-icon.svg",
    assetName: "Ethereum",
    assetSymbol: "ETH",
    walletBalance: 1234.0,
    amountInUsd: 4234.0,
    isCollateral: false,
  },
  {
    id: "4",
    assetImg: "/tokens/eth-icon.svg",
    assetName: "Ethereum",
    assetSymbol: "ETH",
    walletBalance: 1234.0,
    amountInUsd: 4234.0,
    isCollateral: true,
  },
  {
    id: "5",
    assetImg: "/tokens/chainlink-icon.svg",
    assetName: "Link",
    assetSymbol: "Link",
    walletBalance: 1234.0,
    amountInUsd: 4234.0,
    isCollateral: false,
  },
  {
    id: "6",
    assetImg: "/tokens/chainlink-icon.svg",
    assetName: "Link",
    assetSymbol: "Link",
    walletBalance: 1234.0,
    amountInUsd: 4234.0,
    isCollateral: true,
  },
];

export const columns: ColumnDef<AssetProps>[] = [
  {
    accessorKey: "assetName",
    header: "Assets",
    cell: ({ row }) => {
      const asset = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
            <Image
              src={asset.assetImg}
              alt={asset.assetName}
              width={24}
              height={24}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-medium text-white">{asset.assetName}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "walletBalance",
    header: "Wallet Balance",
    cell: ({ row }) => {
      const asset = row.original;
      return (
        <div className="flex items-center gap-1.5">
          <span className="text-white font-medium">
            {asset.walletBalance.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="text-white/40">{asset.assetSymbol}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "amountInUsd",
    // header: "Amount in USD",
    header: () => <p className="text-center">Amount in USD</p>,
    cell: ({ row }) => {
      const amount = row.original.amountInUsd;
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }).format(amount);

      const [main, cents] = formatted.split(".");

      return (
        <div className="font-medium text-center text-white">
          {main}
          <span className="text-white/40">.{cents}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "isCollateral",
    header: () => (
      <div className="flex items-center justify-end gap-2">
        <span>Collateral</span>
        <div className="w-4 h-4 rounded-full border border-white/20" />
      </div>
    ),
    cell: ({ row }) => {
      const isCollateral = row.original.isCollateral;
      return (
        <div className="flex items-center gap-2 justify-end">
          <span className="text-white/40 text-sm">As Collateral</span>
          <div
            className={cn(
              "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
              isCollateral
                ? "bg-blue-600 border-blue-600"
                : "bg-transparent border-white/20"
            )}
          >
            {isCollateral && (
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
        </div>
      );
    },
  },
];

export function DataTableAssets() {
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
    <div className="w-full overflow-hidden rounded-xl bg-white/5 border">
      <h1 className="text-white text-lg font-normal py-3.5 px-6">My Assets</h1>
      <div className="overflow-x-auto">
        <Table className="min-w-[600px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-white/5 border-none">
                {headerGroup.headers.map((header, index) => {
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "text-white/60 font-normal h-12",
                        index === 0 && "pl-6",
                        index === headerGroup.headers.length - 1 && "pr-6"
                      )}
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
                  className="border-none hover:bg-white/5 transition-colors"
                >
                  {row.getVisibleCells().map((cell, index) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "py-2",
                        index === 0 && "pl-6",
                        index === row.getVisibleCells().length - 1 && "pr-6"
                      )}
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
      <div className="flex flex-col sm:flex-row items-center justify-between py-4 px-6 border-t border-white/5 gap-4 sm:gap-0">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-white font-medium">Page 1 of 10</span>
          <span className="text-white/20">•</span>
          <span className="text-white/40">Showing 10 of 16 Data</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="w-8 h-8 rounded-lg bg-white/5 border-none hover:bg-white/10"
          >
            <ArrowLeft size={16} className="text-white" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="w-8 h-8 rounded-lg bg-white/5 border-none hover:bg-white/10"
          >
            <ArrowRight size={16} className="text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
}
