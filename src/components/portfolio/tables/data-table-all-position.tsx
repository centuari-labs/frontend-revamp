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
import Link from "next/link";
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
import {
  CentuariSellPositionDialog,
  type WithdrawSuccessMessage,
} from "@/components/centuari-sell-position-dialog";
import { CentuariRepayDialog } from "@/components/centuari-repay-dialog";
import { TransactionSuccessDialog } from "@/components/transaction-success-dialog";
import { useRouter } from "next/navigation";

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
  assetId?: string;
  marketId?: string;
};

interface DataTableAllPositionProps {
  positions?: PositionProps[];
  // Server-side pagination
  page?: number;
  totalData?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  onTabChange?: (tab: "lend" | "borrow") => void;
}

export function DataTableAllPosition({
  positions: externalPositions,
  page: serverPage,
  totalData,
  totalPages,
  onPageChange,
  pageSize = 10,
  onTabChange,
}: DataTableAllPositionProps = {}) {
  const router = useRouter();
  const [withdrawSuccess, setWithdrawSuccess] =
    React.useState<WithdrawSuccessMessage | null>(null);
  const [activeTab, setActiveTab] = React.useState<"borrow" | "lend">("lend");
  const { allTransactions } = usePositions();

  const isServerPagination = !!onPageChange;

  // Always filter by active tab — safety net even if API doesn't filter
  const currentData = React.useMemo(() => {
    const allData = externalPositions ?? allTransactions;
    return (allData as PositionProps[]).filter((pos) => pos.type === activeTab);
  }, [externalPositions, allTransactions, activeTab]);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize,
  });

  const columns = React.useMemo<ColumnDef<PositionProps>[]>(
    () => [
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
          console.log("posiiton", position)
          const isBorrow = position.type === "borrow";
          const marketLink = position.id
            ? `/market?token=${position.id}`
            : `/market?token=${(position.tokenValue ?? position.assetName).toLowerCase()}`;

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
                  availableFunds={calculateFutureAmount(
                    position.amount,
                    (position.apr ?? 0) * 100,
                    normalizeMaturity(position.maturity)
                  )}
                  moneyDeposited={position.amount * 0.9}
                  profitReturn={position.amount * 0.1}
                  apr={(position.apr ?? 0) * 100}
                  onWithdrawComplete={(message) => setWithdrawSuccess(message)}
                  onSuccess={() => {
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(new Event("storage"));
                    }
                  }}
                />
              )}
              <Link
                href={marketLink}
                className="text-white/80 hover:text-white transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Plus size={18} />
              </Link>
            </div>
          );
        },
      },
    ],
    [setWithdrawSuccess]
  );

  // Reset pagination to first page when tab changes
  const handleTabChange = React.useCallback((value: string) => {
    const tab = value as "borrow" | "lend";
    setActiveTab(tab);
    if (isServerPagination) {
      onPageChange(1);
      onTabChange?.(tab);
    } else {
      setPagination({ pageIndex: 0, pageSize });
    }
  }, [isServerPagination, onPageChange, onTabChange, pageSize]);

  const table = useReactTable({
    data: currentData,
    columns,
    getRowId: (row) => row.id,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    ...(isServerPagination
      ? { manualPagination: true, pageCount: totalPages ?? -1 }
      : { getPaginationRowModel: getPaginationRowModel() }),
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
      pagination: isServerPagination
        ? { pageIndex: (serverPage ?? 1) - 1, pageSize }
        : pagination,
    },
  });

  const PositionTable = React.useMemo(() => (
    <>
      <div className="flex-1 overflow-y-auto overflow-x-hidden max-h-[300px] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/40">
        <Table className="w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-white/5 border-none">
                {headerGroup.headers.map((header, index) => (
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
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-none hover:bg-white/5 transition-colors h-8"
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
                  className="h-[300px] text-center"
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

  // Pagination values
  const displayPage = isServerPagination ? (serverPage ?? 1) : (currentData.length > 0 ? table.getState().pagination.pageIndex + 1 : 0);
  const displayTotalPages = isServerPagination ? (totalPages ?? 1) : Math.max(1, table.getPageCount() || 1);
  const displayShowing = table.getRowModel().rows.length;
  const displayTotal = isServerPagination ? (totalData ?? 0) : currentData.length;
  const canPrev = isServerPagination ? (serverPage ?? 1) > 1 : table.getCanPreviousPage();
  const canNext = isServerPagination ? (serverPage ?? 1) < (totalPages ?? 1) : table.getCanNextPage();

  return (
    <div className="w-full overflow-hidden flex flex-col h-full rounded-xl bg-white/5 border">
      <Tabs defaultValue="lend" className="w-full !gap-0 flex flex-col h-full" onValueChange={handleTabChange}>
        <div className="flex items-center justify-between py-2 px-6 shrink-0">
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
      <div className="flex flex-col sm:flex-row shrink-0 w-full items-center justify-between py-4 px-6 border-t border-white/5 gap-4 sm:gap-0">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-white font-medium">
            Page {displayPage} of {displayTotalPages}
          </span>
          <span className="text-white/20">&bull;</span>
          <span className="text-white/40">
            Showing {displayShowing} of {displayTotal} Data
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="w-8 h-8 rounded-lg bg-white/5 border-none hover:bg-white/10"
            onClick={() => {
              if (isServerPagination) {
                onPageChange(Math.max(1, (serverPage ?? 1) - 1));
              } else {
                table.previousPage();
              }
            }}
            disabled={!canPrev}
          >
            <ArrowLeft size={16} className="text-white" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="w-8 h-8 rounded-lg bg-white/5 border-none hover:bg-white/10"
            onClick={() => {
              if (isServerPagination) {
                onPageChange(Math.min((totalPages ?? 1), (serverPage ?? 1) + 1));
              } else {
                table.nextPage();
              }
            }}
            disabled={!canNext}
          >
            <ArrowRight size={16} className="text-white" />
          </Button>
        </div>
      </div>
      <TransactionSuccessDialog
        open={!!withdrawSuccess}
        onOpenChange={(open) => {
          if (!open) {
            setWithdrawSuccess(null);
          }
        }}
        title={withdrawSuccess?.title ?? "Withdrawal Complete"}
        description={
          withdrawSuccess?.description ??
          "Your lend position have been successfully withdrawn"
        }
        primaryActionLabel="Start Earning"
        onPrimaryAction={() => router.push("/")}
        secondaryActionLabel="Done"
      />
    </div>
  );
}
