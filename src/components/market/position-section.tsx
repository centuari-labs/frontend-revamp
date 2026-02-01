"use client";

import { useState, useMemo } from "react";
import { CentuariTable } from "@/components/centuari-table";
import { usePositions } from "@/hooks/use-positions";
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
import { formatCurrency } from "@/lib/utils";
import { normalizeMaturity, formatMaturityTimestamp } from "@/lib/maturity";
import { AmendDialog } from "@/components/amend-dialog";
import { Badge } from "../ui/badge";
import { CentuariBadge } from "../centuari-badge";

const tokenList = [
  { logo: "/tokens/usdc-icon.svg", value: "usdc", label: "USDC" },
  { logo: "/tokens/xsgd-icon.png", value: "xsgd", label: "XSGD" },
  { logo: "/tokens/idrx-icon.png", value: "idrx", label: "IDRX" },
];

// Helper function to get correct token logo path
const getTokenLogo = (tokenValue: string, assetImg?: string): string => {
  const tokenLogoMap: Record<string, string> = {
    usdc: "/tokens/usdc-icon.svg",
    xsgd: "/tokens/xsgd-icon.png",
    idrx: "/tokens/idrx-icon.png",
    usdt: "/tokens/centuari-usdt.png",
    btc: "/tokens/btc-icon.svg",
    eth: "/tokens/eth-icon.svg",
    sol: "/tokens/sol-icon.svg",
    link: "/tokens/chainlink-icon.svg",
    xaut: "/tokens/xaut-icon.png",
    arb: "/tokens/centuari-arbitrum.png",
    dai: "/tokens/centuari-dai.png",
    centuari: "/tokens/centuari-centuari.png",
  };

  const mappedLogo = tokenLogoMap[tokenValue.toLowerCase()];
  if (mappedLogo) {
    return mappedLogo;
  }

  if (assetImg && assetImg.startsWith("/")) {
    return assetImg;
  }

  return "/tokens/usdc-icon.svg";
};

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
          tokenList={tokenList}
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
              tokenList={tokenList}
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
              tokenList={tokenList}
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
              tokenList={tokenList}
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

export function PositionSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("open_orders");
  const { openOrders, allTransactions } = usePositions();
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

  const tabPositions = useMemo(() => {
    if (activeTab === "open_orders") return openOrders;
    if (activeTab === "active_position") return allTransactions;
    return [...openOrders, ...allTransactions];
  }, [activeTab, openOrders, allTransactions]);

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


          <TabsContent value="open_orders">
            {filteredPositions.length > 0 ? (
              <UnifiedPositionTable positions={filteredPositions} onDelete={handleDelete} onUpdate={handleUpdate} />
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No open orders found
              </div>
            )}
          </TabsContent>

          <TabsContent value="active_position">
            {filteredPositions.length > 0 ? (
              <UnifiedPositionTable positions={filteredPositions} onDelete={handleDelete} onUpdate={handleUpdate} />
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No active positions found
              </div>
            )}
          </TabsContent>
          <TabsContent value="all_transactions">
            {filteredPositions.length > 0 ? (
              <UnifiedPositionTable positions={filteredPositions} onDelete={handleDelete} onUpdate={handleUpdate} />
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No transactions found
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}