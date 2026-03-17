"use client";

import { useState, useMemo } from "react";
import { CentuariTable } from "@/components/centuari-table";
import { useOpenOrders } from "@/hooks/use-open-orders";
import { useMyPositions } from "@/hooks/use-my-positions";
import { useTransactionHistory } from "@/hooks/use-transaction-history";
import { useUpdateOpenOrder } from "@/hooks/use-update-open-order";
import { useDeleteOpenOrder } from "@/hooks/use-delete-open-order";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Edit2, Search, Trash2 } from "lucide-react";
import Image from "next/image";
import { MARKET_TOKEN_LIST, getTokenLogo } from "@/lib/tokens";
import { formatCurrency } from "@/lib/utils";
import { normalizeMaturity, formatMaturityTimestamp } from "@/lib/maturity";
import { AmendDialog } from "@/components/amend-dialog";
import { Badge } from "../ui/badge";
import { CentuariBadge } from "../centuari-badge";
import type { LendPosition, BorrowPosition, Position } from "@/types/positions";

function PositionCard({
  position,
  onDelete,
  onUpdate
}: {
  position: Position;
  onDelete: (id: string) => void;
  onUpdate?: (updatedPosition: Position) => void;
}) {
  const statusColors = {
    pending: "bg-yellow-500",
    processing: "bg-blue-500",
    success: "bg-green-500",
    failed: "bg-red-500",
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
          <span className="text-white font-semibold">{formatCurrency(position.amount)}</span>
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

// Lend Position Table Component
function LendPositionTable({
  positions,
  onDelete,
  onUpdate
}: {
  positions: LendPosition[];
  onDelete: (id: string) => void;
  onUpdate?: (updatedPosition: LendPosition) => void;
}) {
  const columns: ColumnDef<LendPosition>[] = useMemo(() => [
    {
      accessorKey: "tokenSymbol",
      header: "Token",
      cell: ({ row }) => {
        const logoPath = getTokenLogo(row.original.tokenValue, row.original.assetImg);
        return (
          <div className="flex items-center gap-2">
            <Image
              src={logoPath}
              alt={row.original.tokenSymbol}
              width={24}
              height={24}
              className="rounded-full"
            />
            <span>{row.original.tokenSymbol}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => formatCurrency(row.original.amount),
    },
    {
      accessorKey: "apr",
      header: "Target APR %",
      cell: ({ row }) => {
        const aprValue = row.original.apr ?? 0;
        const aprPercent = (aprValue * 100).toFixed(1);
        return aprPercent.replace(".", ",") + "%";
      },
    },
    {
      accessorKey: "maturity",
      header: "Maturity",
      cell: ({ row }) => formatMaturityTimestamp(normalizeMaturity(row.original.maturity)),
    },
    {
      accessorKey: "createdAt",
      header: "Created at",
      cell: ({ row }) => row.original.createdAt,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const statusColors = {
          pending: "bg-yellow-500",
          processing: "bg-blue-500",
          success: "bg-green-500",
          failed: "bg-red-500",
        };
        return (
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 ${statusColors[status]} rounded-full`}></span>
            <span className="capitalize">{status}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">
            <AmendDialog
              position={row.original}
              tokenList={MARKET_TOKEN_LIST}
              onUpdate={onUpdate ? (pos) => onUpdate(pos as LendPosition) : undefined}
              trigger={
                <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                  <Edit2 size={14} className="text-white" />
                </button>
              }
            />
            <button
              onClick={() => onDelete(row.original.id)}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Trash2 size={14} className="text-red-400" />
            </button>
          </div>
        );
      },
    },
  ], [onDelete, onUpdate]);

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
                className="h-24 text-center"
              >
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// Unified Position Table Component for Open Orders
function UnifiedPositionTable({
  positions,
  onDelete,
  onUpdate
}: {
  positions: Position[];
  onDelete: (id: string) => void;
  onUpdate?: (updatedPosition: Position) => void;
}) {
  const columns: ColumnDef<Position>[] = useMemo(() => [
    {
      accessorKey: "tokenSymbol",
      header: "Loan Token",
      cell: ({ row }) => {
        const logoPath = getTokenLogo(row.original.tokenValue, row.original.assetImg);
        return (
          <div className="flex items-center gap-2">
            <Image
              src={logoPath}
              alt={row.original.tokenSymbol}
              width={24}
              height={24}
              className="rounded-full"
            />
            <span>{row.original.tokenSymbol}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Order Type",
      cell: ({ row }) => {
        const type = row.original.type;
        return <CentuariBadge variant={type === "lend" ? "primary" : "warning"} className="capitalize">{type === "lend" ? "Lend" : "Borrow"}</CentuariBadge>;
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => formatCurrency(row.original.amount),
    },
    {
      accessorKey: "apr",
      header: "Target APR %",
      cell: ({ row }) => {
        const aprValue = row.original.apr ?? 0;
        const aprPercent = (aprValue * 100).toFixed(1);
        return aprPercent.replace(".", ",") + "%";
      },
    },
    {
      accessorKey: "maturity",
      header: "Maturity",
      cell: ({ row }) => formatMaturityTimestamp(normalizeMaturity(row.original.maturity)),
    },
    {
      accessorKey: "createdAt",
      header: "Created at",
      cell: ({ row }) => row.original.createdAt,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const statusColors = {
          pending: "bg-yellow-500",
          processing: "bg-blue-500",
          success: "bg-green-500",
          failed: "bg-red-500",
        };
        return (
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 ${statusColors[status]} rounded-full`}></span>
            <span className="capitalize">{status}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
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
            <button
              onClick={() => onDelete(row.original.id)}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Trash2 size={14} className="text-red-400" />
            </button>
          </div>
        );
      },
    },
  ], [onDelete, onUpdate]);

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
                className="h-24 text-center"
              >
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// Borrow Position Table Component
function BorrowPositionTable({
  positions,
  onDelete,
  onUpdate
}: {
  positions: BorrowPosition[];
  onDelete: (id: string) => void;
  onUpdate?: (updatedPosition: BorrowPosition) => void;
}) {
  const columns: ColumnDef<BorrowPosition>[] = useMemo(() => [
    {
      accessorKey: "collateralToken",
      header: "Collateral Token",
      cell: ({ row }) => {
        const collateralTokens = row.original.collateralTokens || [];
        const firstCollateral = collateralTokens[0];
        if (!firstCollateral) return "-";

        const logoPath = getTokenLogo(firstCollateral);
        const tokenName = firstCollateral.toUpperCase().slice(0, 4);

        return (
          <div className="flex items-center gap-2">
            <Image
              src={logoPath}
              alt={tokenName}
              width={24}
              height={24}
              className="rounded-full"
            />
            <span>{tokenName}</span>
            {collateralTokens.length > 1 && (
              <span className="text-xs text-muted-foreground">+{collateralTokens.length - 1}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "tokenSymbol",
      header: "Loan Token",
      cell: ({ row }) => {
        const logoPath = getTokenLogo(row.original.tokenValue, row.original.assetImg);
        return (
          <div className="flex items-center gap-2">
            <Image
              src={logoPath}
              alt={row.original.tokenSymbol}
              width={24}
              height={24}
              className="rounded-full"
            />
            <span>{row.original.tokenSymbol}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "amount",
      header: "Amount Borrowed",
      cell: ({ row }) => formatCurrency(row.original.amount),
    },
    {
      accessorKey: "apr",
      header: "Target APR %",
      cell: ({ row }) => {
        const aprValue = row.original.apr ?? 0;
        const aprPercent = (aprValue * 100).toFixed(1);
        return aprPercent.replace(".", ",") + "%";
      },
    },
    {
      accessorKey: "maturity",
      header: "Maturity",
      cell: ({ row }) => formatMaturityTimestamp(normalizeMaturity(row.original.maturity)),
    },
    {
      accessorKey: "createdAt",
      header: "Created at",
      cell: ({ row }) => row.original.createdAt,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const statusColors = {
          pending: "bg-yellow-500",
          processing: "bg-blue-500",
          success: "bg-green-500",
          failed: "bg-red-500",
        };
        return (
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 ${statusColors[status]} rounded-full`}></span>
            <span className="capitalize">{status}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">
            <AmendDialog
              position={row.original}
              tokenList={MARKET_TOKEN_LIST}
              onUpdate={onUpdate ? (pos) => onUpdate(pos as BorrowPosition) : undefined}
              trigger={
                <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                  <Edit2 size={14} className="text-white" />
                </button>
              }
            />
            <button
              onClick={() => onDelete(row.original.id)}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Trash2 size={14} className="text-red-400" />
            </button>
          </div>
        );
      },
    },
  ], [onDelete, onUpdate]);

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
                className="h-24 text-center"
              >
                No results.
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
    openOrders.map((o) => ({
      id: o.id,
      assetImg: o.asset.imageUrl ?? "",
      assetName: o.asset.name,
      amount: Number(o.amount),
      apr: o.rate / 100,
      type: o.side.toLowerCase() as "lend" | "borrow",
      tokenValue: o.asset.symbol.toLowerCase(),
      tokenSymbol: o.asset.symbol,
      maturity: new Date(o.maturity).getTime(),
      status: o.status === "OPEN" ? "pending" as const : "processing" as const,
      createdAt: new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      timestamp: Date.now(),
      ...(o.side === "BORROW" ? { collateralTokens: [] } : {}),
    })) as Position[], [openOrders]);

  // Map active positions API data to Position type
  const activePositionsMapped: Position[] = useMemo(() =>
    activePositions.map((p) => ({
      id: p.id,
      assetImg: p.imageUrl ?? "",
      assetName: p.name,
      amount: p.amountInUsd,
      apr: 0,
      type: p.side.toLowerCase() as "lend" | "borrow",
      tokenValue: p.symbol.toLowerCase(),
      tokenSymbol: p.symbol,
      maturity: (p.maturity ?? 0) * 1000,
      status: "success" as const,
      createdAt: "",
      timestamp: Date.now(),
      ...(p.side === "BORROW" ? { collateralTokens: [] } : {}),
    })) as Position[], [activePositions]);

  // Map transaction history API data to Position type
  const txPositions: Position[] = useMemo(() =>
    transactions.map((t) => ({
      id: t.id,
      assetImg: t.asset.imageUrl ?? "",
      assetName: t.asset.name,
      amount: Number(t.amount),
      apr: t.rate / 100,
      type: t.side.toLowerCase() as "lend" | "borrow",
      tokenValue: t.asset.symbol.toLowerCase(),
      tokenSymbol: t.asset.symbol,
      maturity: 0,
      status: t.status === "FILLED" ? "success" as const : t.status === "CANCELLED" ? "failed" as const : t.status === "OPEN" ? "pending" as const : "processing" as const,
      createdAt: new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      timestamp: Date.now(),
      ...(t.side === "BORROW" ? { collateralTokens: [] } : {}),
    })) as Position[], [transactions]);

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
        formatCurrency(pos.amount).toLowerCase().includes(query)
    );
  }, [tabPositions, searchQuery]);

  const currentPage = activeTab === "open_orders" ? openOrdersPage : activeTab === "active_position" ? positionsPage : txHistoryPage;
  const currentTotalPages = activeTab === "open_orders" ? openOrdersTotalPages : activeTab === "active_position" ? positionsTotalPages : txTotalPages;
  const currentTotal = activeTab === "open_orders" ? openOrdersTotal : activeTab === "active_position" ? positionsTotal : txTotal;
  const currentLoading = activeTab === "open_orders" ? openOrdersLoading : activeTab === "active_position" ? positionsLoading : txLoading;
  const setCurrentPage = activeTab === "open_orders" ? setOpenOrdersPage : activeTab === "active_position" ? setPositionsPage : setTxHistoryPage;

  return (
    <div className="mt-2 bg-white/5 rounded-md md:p-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="md:hidden">
          <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 px-3 pt-3 pb-2 border-b border-white/10">
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
              <TabsTrigger
                value="open_orders"
                className="data-[state=active]:border-none! data-[state=active]:bg-white/10 text-xs"
              >
                Open Orders
              </TabsTrigger>
              <TabsTrigger
                value="active_position"
                className="data-[state=active]:border-none! data-[state=active]:bg-white/10 text-xs"
              >
                Positions
              </TabsTrigger>
              <TabsTrigger
                value="all_transactions"
                className="data-[state=active]:border-none! data-[state=active]:bg-white/10 text-xs"
              >
                All Transaction
              </TabsTrigger>
            </TabsList>

          </div>

          <TabsContent value="open_orders" className="mt-0">
            {filteredPositions.length > 0 ? (
              filteredPositions.map((position) => (
                <PositionCard key={position.id} position={position} onDelete={handleDelete} onUpdate={handleUpdate} />
              ))
            ) : (
              <div className="px-4 py-8 text-center text-muted-foreground">
                No open orders found
              </div>
            )}
          </TabsContent>

          <TabsContent value="active_position" className="mt-0">
            {filteredPositions.length > 0 ? (
              filteredPositions.map((position) => (
                <PositionCard key={position.id} position={position} onDelete={handleDelete} />
              ))
            ) : (
              <div className="px-4 py-8 text-center text-muted-foreground">
                No active positions found
              </div>
            )}
          </TabsContent>

          <TabsContent value="all_transactions" className="mt-0">
            {filteredPositions.length > 0 ? (
              filteredPositions.map((position) => (
                <PositionCard key={position.id} position={position} onDelete={handleDelete} />
              ))
            ) : (
              <div className="px-4 py-8 text-center text-muted-foreground">
                No transactions found
              </div>
            )}
          </TabsContent>
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
                <TabsTrigger
                  value="open_orders"
                  className="data-[state=active]:bg-white/10 text-xs sm:text-sm px-4 h-full"
                >
                  Open Orders
                </TabsTrigger>
                <TabsTrigger
                  value="active_position"
                  className="data-[state=active]:bg-white/10 text-xs sm:text-sm px-4 h-full"
                >
                  Active Position
                </TabsTrigger>
                <TabsTrigger
                  value="all_transactions"
                  className="data-[state=active]:bg-white/10 text-xs sm:text-sm px-4 h-full"
                >
                  All Transaction
                </TabsTrigger>
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
              ) : filteredPositions.length > 0 ? (
                <UnifiedPositionTable positions={filteredPositions} onDelete={handleDelete} onUpdate={handleUpdate} />
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  {tab === "open_orders" ? "No open orders found" : tab === "active_position" ? "No active positions found" : "No transactions found"}
                </div>
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