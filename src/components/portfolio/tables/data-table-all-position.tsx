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
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";
import Image from "next/image";
import { calculateFutureAmount, cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { normalizeMaturity, formatMaturityTimestamp } from "@/lib/maturity";
import { usePositions } from "@/hooks/use-positions";
import { CentuariSellPositionDialog } from "@/components/centuari-sell-position-dialog";
import { CentuariRepayDialog } from "@/components/centuari-repay-dialog";

export type PositionProps = {
  id: string;
  assetImg: string;
  assetName: string;
  amount: number;
  apr: number;
  type?: "lend" | "borrow";
  tokenValue?: string;
  timestamp?: number;
  collateralTokens?: string[];
  maturity?: number;
};

export const columns: ColumnDef<PositionProps>[] = [
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
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = row.original.amount;
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }).format(amount);

      const [main, cents] = formatted.split(".");

      return (
        <div className="font-medium text-white">
          {main}
          <span className="text-white/40">.{cents}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "apr",
    header: "APR %",
    cell: ({ row }) => {
      const apr = row.original.apr ?? 0;
      return (
        <div className="text-white font-medium">
          {((apr ?? 0) * 100).toFixed(2).replace(".", ",")}%
        </div>
      );
    },
  },
  {
    accessorKey: "maturity",
    header: "Maturity",
    cell: ({ row }) => (
      <div className="text-white font-medium">
        {formatMaturityTimestamp(normalizeMaturity(row.original.maturity))}
      </div>
    ),
  },
  {
    id: "action",
    header: "Action",
    cell: ({ row }) => {
      const position = row.original;
      const isBorrow = position.type === "borrow";

      return (
        <div className="flex items-center gap-4">
          {isBorrow ? (
            <CentuariRepayDialog
              positionId={position.id}
              token_image={position.assetImg}
              token_name={position.assetName}
              token_symbol={position.assetName}
              amountBorrowed={position.amount}
              apr={(position.apr ?? 0) * 100}
              maturityDate={normalizeMaturity(position.maturity)}
              onSuccess={() => {
                // Trigger re-render to update positions
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new Event("storage"));
                }
              }}
            />
          ) : (
            <CentuariSellPositionDialog
              positionId={position.id}
              token_image={position.assetImg}
              token_name={position.assetName}
              token_symbol={position.assetName}
              maturityDate={normalizeMaturity(position.maturity)}
              startDate={position.timestamp}
              availableFunds={calculateFutureAmount(position.amount, (position.apr ?? 0) * 100, normalizeMaturity(position.maturity))}
              moneyDeposited={position.amount * 0.9}
              profitReturn={position.amount * 0.1}
              apr={(position.apr ?? 0) * 100}
              onSuccess={() => {
                // Trigger re-render to update positions
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new Event("storage"));
                }
              }}
            />
          )}
          <button
            className="text-white/80 hover:text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
            }}
            type="button"
          >
            <Plus size={18} />
          </button>
        </div>
      );
    },
  },
];

export function DataTableAllPosition() {
  const [activeTab, setActiveTab] = React.useState<"borrow" | "lend">("lend");
  const { allTransactions } = usePositions();

  const borrowData: PositionProps[] = React.useMemo(
    () => allTransactions.filter((pos) => pos.type === "borrow") as PositionProps[],
    [allTransactions]
  );

  const lendData: PositionProps[] = React.useMemo(
    () => allTransactions.filter((pos) => pos.type === "lend") as PositionProps[],
    [allTransactions]
  );

  // Memoize currentData to prevent unnecessary re-renders
  const currentData = React.useMemo(() => {
    return activeTab === "borrow" ? borrowData : lendData;
  }, [activeTab, borrowData, lendData]);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Reset pagination to first page when tab changes
  React.useEffect(() => {
    setPagination({ pageIndex: 0, pageSize: 10 });
  }, [activeTab]);

  const table = useReactTable({
    data: currentData,
    columns,
    getRowId: (row) => row.id,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
  });

  // PositionTable as memoized component to prevent recreation
  const PositionTable = React.useMemo(() => (
    <>
      <div className="flex-1 overflow-y-auto overflow-x-auto">
        <Table className="min-w-[700px]">
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
    </>
  ), [table, currentData.length]);

  return (
    <div className="w-full overflow-hidden flex flex-col h-full rounded-xl bg-white/5 border">
      <Tabs defaultValue="lend" className="w-full !gap-0 flex flex-col h-full" onValueChange={(value) => setActiveTab(value as "borrow" | "lend")}>
        <div className="flex items-center justify-between py-2 px-6 flex-shrink-0">
          <h1 className="text-white text-lg font-normal">All My Positions</h1>
          <TabsList className="bg-white/5 h-10 border border-white/5">
            <TabsTrigger
              value="lend"
              className="px-6 h-8 rounded-md data-[state=active]:bg-[#3B3F46] data-[state=active]:text-white !border-none text-white/40"
            >
              Lend
            </TabsTrigger>
            <TabsTrigger
              value="borrow"
              className="px-6 h-8 rounded-md data-[state=active]:bg-[#3B3F46] data-[state=active]:text-white !border-none text-white/40"
            >
              Borrow
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="borrow" className="mt-0 flex-1 flex flex-col min-h-0">
          {PositionTable}
        </TabsContent>

        <TabsContent value="lend" className="mt-0 flex-1 flex flex-col min-h-0">
          {PositionTable}
        </TabsContent>
      </Tabs>
      <div className="flex flex-col sm:flex-row flex-shrink-0 w-full items-center justify-between py-4 px-6 border-t border-white/5 gap-4 sm:gap-0">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-white font-medium">
            Page {currentData.length > 0 ? table.getState().pagination.pageIndex + 1 : 0} of {Math.max(1, table.getPageCount() || 1)}
          </span>
          <span className="text-white/20">•</span>
          <span className="text-white/40">
            Showing {table.getRowModel().rows.length} of {currentData.length} Data
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="w-8 h-8 rounded-lg bg-white/5 border-none hover:bg-white/10"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ArrowLeft size={16} className="text-white" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="w-8 h-8 rounded-lg bg-white/5 border-none hover:bg-white/10"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ArrowRight size={16} className="text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
}