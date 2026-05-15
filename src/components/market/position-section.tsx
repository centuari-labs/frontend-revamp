"use client";

import { useState, useMemo } from "react";
import { useOpenOrders } from "@/hooks/use-open-orders";
import { useMyPositions } from "@/hooks/use-my-positions";
import { useTransactionHistory } from "@/hooks/use-transaction-history";
import { useUpdateOpenOrder } from "@/hooks/use-update-open-order";
import { useDeleteOpenOrder } from "@/hooks/use-delete-open-order";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CentuariGlassLayers, CentuariGlassSurface } from "@/components/centuari-glass-surface";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowLeftRight, ClipboardList, Edit2, Layers, Loader2, Search, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CentuariButton } from "@/components/centuari-button";
import Image from "next/image";
import { MARKET_TOKEN_LIST, getTokenLogo } from "@/lib/tokens";
import { useTokens, getTokenById } from "@/hooks/use-tokens";
import { formatNumber, parseMaturity } from "@/lib/utils";
import { normalizeMaturity, formatMaturityTimestamp } from "@/lib/maturity";
import { AmendDialog } from "@/components/amend-dialog";
import { CentuariTypography } from "../centuari-typography";
import type { Position, OrderType, PositionStatus } from "@/types/positions";
import {
  createDateColumn,
  createLoanTokenColumn,
  createSideColumn,
  createOrderTypeColumn,
  createAmountColumn,
  createFeeColumn,
  createTargetAprColumn,
  createAprColumn,
  createMaturityColumn,
  createStatusColumn,
} from "@/components/tables/shared-columns";

function PositionCard({
  position,
  onDelete,
  onUpdate,
}: {
  position: Position;
  onDelete: (id: string) => void;
  onUpdate?: (updatedPosition: Position) => void;
}) {
  const statusColors = {
    OPEN: "bg-blue-500",
    FILLED: "bg-green-500",
    CANCELLED: "bg-red-500",
    PARTIALLY_FILLED: "bg-yellow-500",
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this position?")) {
      onDelete(position.id);
    }
  };

  return (
    <div className="px-4 py-4 border-b border-white/10 last:border-b-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Image
            src={getTokenLogo(position.tokenValue, position.assetImg)}
            alt={position.tokenSymbol}
            width={32}
            height={32}
            className="rounded-full"
          />
          <div>
            <p className="font-semibold text-white">{position.tokenSymbol}</p>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 ${statusColors[position.status]} rounded-full`}></span>
              <span className="text-sm text-muted-foreground capitalize">
                {position.status}
              </span>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Created at {position.createdAt}
        </p>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Amount</span>
          <span className="text-white font-semibold">{formatNumber(position.amount, 2)} {position.tokenSymbol}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Target APR %</span>
          <span className="text-white font-semibold">{((position.apr ?? 0) * 100).toFixed(1).replace(".", ",")}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Maturity</span>
          <span className="text-white font-semibold">{formatMaturityTimestamp(normalizeMaturity(position.maturity))}</span>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <AmendDialog
          position={position}
          tokenList={MARKET_TOKEN_LIST}
          onUpdate={onUpdate}
          trigger={
            <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
              <Edit2 size={16} className="text-white" />
            </button>
          }
        />
        <button
          onClick={handleDelete}
          className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <Trash2 size={16} className="text-red-400" />
        </button>
      </div>
    </div>
  );
}

function CancelOrderDialog({
  onConfirm,
  trigger,
}: {
  onConfirm: () => void | Promise<void>;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleConfirm = async () => {
    setIsPending(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !isPending && setOpen(v)}>
      <button type="button" onClick={() => setOpen(true)}>
        {trigger}
      </button>
      <DialogContent className="flex max-h-[min(400px,80vh)] flex-col gap-0 p-0 sm:max-w-md data-[state=open]:!zoom-in-0 data-[state=open]:duration-600">
        <DialogHeader className="contents space-y-0 text-left">
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
            <div className="absolute w-[568px] h-[450px] -top-72 left-0 bg-primary-blue-base/50 blur-[264px] opacity-100 transition-opacity duration-500" />
            <div className="absolute w-[150px] h-[216px] -top-60 left-1/3 bg-white blur-3xl opacity-100 transition-opacity duration-500" />
          </div>
          <div className="mt-8 px-6 flex items-center justify-center flex-col gap-3">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <Trash2 size={28} className="text-red-400" />
            </div>
            <CentuariTypography className="text-xl font-semibold">
              Cancel Order
            </CentuariTypography>
            <CentuariTypography className="text-center text-muted-foreground text-sm">
              Are you sure you want to cancel this order? This action cannot be undone.
            </CentuariTypography>
          </div>
        </DialogHeader>
        <DialogFooter className="flex-row items-center justify-end px-6 py-5">
          <DialogClose asChild>
            <CentuariButton variant="secondary" className="flex-1" disabled={isPending}>
              No, keep it
            </CentuariButton>
          </DialogClose>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Cancelling...
              </>
            ) : (
              "Yes, cancel order"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Unified Position Table Component
function UnifiedPositionTable({
  positions,
  onDelete,
  onUpdate,
  hideActions = false,
  emptyMessage = "No results.",
  activeTab = "open_orders",
}: {
  positions: Position[];
  onDelete: (id: string) => void;
  onUpdate?: (updatedPosition: Position) => void;
  hideActions?: boolean;
  emptyMessage?: string;
  activeTab?: string;
}) {
  // Shared column definitions from shared-columns.tsx
  const colDate = createDateColumn<Position>();
  const colToken = createLoanTokenColumn<Position>();
  const colSide = createSideColumn<Position>();
  const colOrderType = createOrderTypeColumn<Position>();
  const colAmount = createAmountColumn<Position>();
  const colTargetApr = createTargetAprColumn<Position>();
  const colApr = createAprColumn<Position>();
  const colMaturity = createMaturityColumn<Position>();
  const colStatus = createStatusColumn<Position>();
  const colFee = createFeeColumn<Position>();
  const colActions = {
    id: "actions" as const,
    header: "Actions",
    cell: ({ row }: { row: { original: Position } }) => {
      return (
        <div className="flex items-center gap-2">
          <AmendDialog
            position={row.original}
            tokenList={MARKET_TOKEN_LIST}
            onUpdate={onUpdate ? (pos) => onUpdate(pos) : undefined}
            trigger={
              <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                <Edit2 size={14} className="text-white" />
              </button>
            }
          />
          <CancelOrderDialog
            onConfirm={() => onDelete(row.original.id)}
            trigger={
              <div className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                <Trash2 size={14} className="text-red-400" />
              </div>
            }
          />
        </div>
      );
    },
  };

  const columns: ColumnDef<Position>[] = useMemo(() => {
    // Open Orders: Date, Loan Token, Side, Order Type, Amount, Target APR (market="-"), Maturity, Status
    if (activeTab === "open_orders") {
      return [colDate, colToken, colSide, colOrderType, colAmount, colTargetApr, colMaturity, colStatus, ...(!hideActions ? [colActions] : [])];
    }
    // Active Position: Loan Token, Side, Amount, APR, Maturity
    if (activeTab === "active_position") {
      return [colToken, colSide, colAmount, colApr, colMaturity];
    }
    // Transaction History: Date, Loan Token, Side, Amount, Fee, APR%, Maturity
    return [colDate, colToken, colSide, colAmount, colFee, colApr, colMaturity];
  }, [activeTab, hideActions, onDelete, onUpdate]);

  const table = useReactTable({
    data: positions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="overflow-hidden rounded-md">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-white/5">
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    key={header.id}
                    className="text-sm text-muted-foreground font-normal"
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
                className="h-48"
              >
                <div className="flex flex-col items-center justify-center gap-3">
                  <CentuariGlassSurface intensity="soft" className="rounded-xl p-3">
                    {activeTab === "open_orders" ? (
                      <ClipboardList size={22} className="text-white/40" />
                    ) : activeTab === "active_position" ? (
                      <Layers size={22} className="text-white/40" />
                    ) : (
                      <ArrowLeftRight size={22} className="text-white/40" />
                    )}
                  </CentuariGlassSurface>
                  <span className="text-sm text-white/40">{emptyMessage}</span>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function PositionSection({ assetId }: { assetId?: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("open_orders");
  const { tokens } = useTokens();
  const [openOrdersPage, setOpenOrdersPage] = useState(1);
  const [positionsPage, setPositionsPage] = useState(1);
  const [txHistoryPage, setTxHistoryPage] = useState(1);

  const { orders: openOrders, totalPages: openOrdersTotalPages, totalData: openOrdersTotal, isLoading: openOrdersLoading } = useOpenOrders({ page: openOrdersPage, limit: 10, assetId, enabled: activeTab === "open_orders" });
  const { positions: activePositions, totalPages: positionsTotalPages, totalData: positionsTotal, isLoading: positionsLoading } = useMyPositions({ page: positionsPage, limit: 10, assetId, enabled: activeTab === "active_position" });
  const { transactions, totalPages: txTotalPages, total: txTotal, isLoading: txLoading } = useTransactionHistory({ page: txHistoryPage, limit: 10, assetId, enabled: activeTab === "all_transactions" });

  const { update } = useUpdateOpenOrder();
  const { deleteOrder } = useDeleteOpenOrder();

  const tabConfig = {
    open_orders: { label: "Open Orders", placeholder: "Search Open Orders" },
    active_position: { label: "Active Position", placeholder: "Search Active Position" },
    all_transactions: { label: "All Transaction", placeholder: "Search Transactions" },
  } as const;

  const currentTabConfig = tabConfig[activeTab as keyof typeof tabConfig] ?? { label: "Position", placeholder: "Search Position..." };

  const handleDelete = async (id: string) => {
    await deleteOrder(id);
  };

  const handleUpdate = async (updatedPosition: Position) => {
    await update(updatedPosition);
  };

  // Map open orders API data to Position type
  const openOrderPositions: Position[] = useMemo(() =>
    openOrders.map((o) => {
      const token = getTokenById(tokens, o.assetId);
      return {
        id: o.id,
        assetImg: token?.imageUrl ?? "",
        assetName: token?.name ?? "",
        amount: Number(o.amount),
        apr: o.rate / 100,
        type: o.side.toLowerCase() as "lend" | "borrow",
        tokenValue: (token?.symbol ?? "").toLowerCase(),
        tokenSymbol: token?.symbol ?? "",
        maturity: o.maturity ? parseMaturity(o.maturity) : 0,
        status: o.status as PositionStatus,
        createdAt: new Date(o.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }),
        timestamp: Date.now(),
        orderType: o.orderType?.toLowerCase() as OrderType | undefined,
        filledQuantity: o.filledQuantity ? Number(o.filledQuantity) : undefined,
        ...(o.side === "BORROW" ? { collateralTokens: [] } : {}),
      };
    }) as Position[], [openOrders, tokens]);

  // Map active positions API data to Position type
  const activePositionsMapped: Position[] = useMemo(() =>
    activePositions.map((p) => {
      const token = getTokenById(tokens, p.assetId);
      return {
        id: p.id,
        assetImg: token?.imageUrl ?? "",
        assetName: token?.name ?? "",
        amount: p.amountInUsd,
        apr: (Number(p.apr) || 0) / 100,
        type: p.side.toLowerCase() as "lend" | "borrow",
        tokenValue: (token?.symbol ?? "").toLowerCase(),
        tokenSymbol: token?.symbol ?? "",
        maturity: (p.maturity ?? 0) * 1000,
        status: "FILLED" as const,
        createdAt: "",
        timestamp: Date.now(),
        ...(p.side === "BORROW" ? { collateralTokens: [] } : {}),
      };
    }) as Position[], [activePositions, tokens]);

  // Map transaction history API data to Position type (from matches table — always settled)
  const txPositions: Position[] = useMemo(() =>
    transactions.map((t) => {
      const token = getTokenById(tokens, t.assetId);
      return {
        id: t.id,
        assetImg: token?.imageUrl ?? "",
        assetName: token?.name ?? "",
        amount: Number(t.amount),
        apr: t.rate / 100,
        type: t.side.toLowerCase() as "lend" | "borrow",
        tokenValue: (token?.symbol ?? "").toLowerCase(),
        tokenSymbol: token?.symbol ?? "",
        maturity: t.maturity ? parseMaturity(t.maturity) : 0,
        status: "FILLED" as const,
        createdAt: new Date(t.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }),
        timestamp: Date.now(),
        fee: t.fee ? Number(t.fee) : undefined,
        ...(t.side === "BORROW" ? { collateralTokens: [] } : {}),
      };
    }) as Position[], [transactions, tokens]);

  const tabPositions = useMemo(() => {
    if (activeTab === "open_orders") return openOrderPositions;
    if (activeTab === "active_position") return activePositionsMapped;
    return txPositions;
  }, [activeTab, openOrderPositions, activePositionsMapped, txPositions]);

  const filteredPositions = useMemo(() => {
    if (!searchQuery) return tabPositions;
    const query = searchQuery.toLowerCase();
    return tabPositions.filter(
      (pos) =>
        pos.tokenSymbol?.toLowerCase().includes(query) ||
        pos.assetName?.toLowerCase().includes(query) ||
        formatNumber(pos.amount).toLowerCase().includes(query)
    );
  }, [tabPositions, searchQuery]);

  const currentPage = activeTab === "open_orders" ? openOrdersPage : activeTab === "active_position" ? positionsPage : txHistoryPage;
  const currentTotalPages = activeTab === "open_orders" ? openOrdersTotalPages : activeTab === "active_position" ? positionsTotalPages : txTotalPages;
  const currentTotal = activeTab === "open_orders" ? openOrdersTotal : activeTab === "active_position" ? positionsTotal : txTotal;
  const currentLoading = activeTab === "open_orders" ? openOrdersLoading : activeTab === "active_position" ? positionsLoading : txLoading;
  const setCurrentPage = activeTab === "open_orders" ? setOpenOrdersPage : activeTab === "active_position" ? setPositionsPage : setTxHistoryPage;

  return (
    <div className="group/glass relative mt-2 bg-transparent border-0 rounded-xl md:p-4 overflow-hidden isolate">
      <CentuariGlassLayers intensity="soft" />
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="md:hidden">
          <div className="group/glass sticky top-0 z-10 relative isolate overflow-hidden bg-black/20 backdrop-blur-xl border-b border-white/10">
            <CentuariGlassLayers intensity="soft" />
            <div className="relative z-20 px-3 pt-3 pb-2">
              <h1 className="text-base font-medium mb-3">{currentTabConfig.label}</h1>

              <div className="relative mb-3">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={18}
              />
              <Input
                placeholder={currentTabConfig.placeholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10"
              />
            </div>

            <TabsList className="bg-white/5 w-full grid grid-cols-3 mb-3">
              {[
                { value: "open_orders", label: "Open Orders" },
                { value: "active_position", label: "Positions" },
                { value: "all_transactions", label: "All Transaction" },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="group/glass relative overflow-hidden isolate data-[state=active]:text-white data-[state=active]:border-none! bg-transparent! shadow-none! text-xs"
                >
                  <span className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity [[data-state=active]>&]:opacity-100">
                    <CentuariGlassLayers intensity="soft" />
                  </span>
                  <span className="relative z-20">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            </div>
          </div>

          {[
            { value: "open_orders", message: "You don't have any open orders yet", icon: ClipboardList },
            { value: "active_position", message: "You don't have any active positions yet", icon: Layers },
            { value: "all_transactions", message: "You don't have any transactions yet", icon: ArrowLeftRight },
          ].map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-0">
              {filteredPositions.length > 0 ? (
                filteredPositions.map((position) => (
                  <PositionCard key={position.id} position={position} onDelete={handleDelete} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-12">
                  <CentuariGlassSurface intensity="soft" className="rounded-xl p-3">
                    <tab.icon size={22} className="text-white/40" />
                  </CentuariGlassSurface>
                  <span className="text-sm text-white/40">{tab.message}</span>
                </div>
              )}
            </TabsContent>
          ))}
        </div>

        <div className="hidden md:block p-2 sm:p-3">
          <div className="mb-4 w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <h1 className="text-sm sm:text-base font-medium">{currentTabConfig.label}</h1>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={16}
                />
                <Input
                  placeholder={currentTabConfig.placeholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-[240px] text-sm bg-white/5 border-white/10 h-9"
                />
              </div>
              <TabsList className="bg-white/5 h-9 p-1">
                {[
                  { value: "open_orders", label: "Open Orders" },
                  { value: "active_position", label: "Active Position" },
                  { value: "all_transactions", label: "All Transaction" },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="group/glass relative overflow-hidden isolate data-[state=active]:text-white data-[state=active]:border-none! bg-transparent! shadow-none! text-xs sm:text-sm px-4 h-full"
                  >
                    <span className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity [[data-state=active]>&]:opacity-100">
                      <CentuariGlassLayers intensity="soft" />
                    </span>
                    <span className="relative z-20">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>


          {["open_orders", "active_position", "all_transactions"].map((tab) => (
            <TabsContent key={tab} value={tab}>
              {currentLoading && filteredPositions.length === 0 ? (
                <div className="space-y-3 py-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-4 px-2">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <div key={j} className="h-4 flex-1 bg-white/5 rounded animate-pulse" />
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <UnifiedPositionTable
                  positions={filteredPositions}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                  hideActions={tab === "active_position" || tab === "all_transactions"}
                  activeTab={tab}
                  emptyMessage={tab === "open_orders" ? "You don't have any open orders yet" : tab === "active_position" ? "You don't have any active positions yet" : "You don't have any transactions yet"}
                />
              )}
            </TabsContent>
          ))}

          {/* Pagination */}
          {currentTotalPages > 0 && (
            <div className="flex items-center justify-between py-3 px-1">
              <div className="text-muted-foreground text-sm">
                {currentTotal} result{currentTotal !== 1 ? "s" : ""}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="px-3 py-1.5 text-sm rounded-md border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {currentTotalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p: number) => Math.min(currentTotalPages, p + 1))}
                  disabled={currentPage >= currentTotalPages}
                  className="px-3 py-1.5 text-sm rounded-md border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
}