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
import { tokenList, defaultPortfolio, getTokenSymbol } from "@/lib/portfolio-data";

export type AssetProps = {
  id: string;
  assetImg: string;
  assetName: string;
  assetSymbol: string;
  walletBalance: number;
  amountInUsd: number;
  idleAssetYield: number; // Annual yield amount for idle assets
  isCollateral: boolean;
  tokenValue: string; // Add token value to identify which token this is
};

export function DataTableAssets() {
  // Portfolio state - sync with borrow dialog
  const [portfolio, setPortfolio] = React.useState<Record<string, number>>(() => {
    // Try to get from localStorage, fallback to default
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("centuari_portfolio");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Migrate old AAVE data to XAUT if exists
          if (parsed.aave && !parsed.xaut) {
            parsed.xaut = parsed.aave;
            delete parsed.aave;
          }
          // Add NVDA if it doesn't exist (migration for new token)
          if (!parsed.nvda && defaultPortfolio.nvda) {
            parsed.nvda = defaultPortfolio.nvda;
          }
          // Save updated portfolio back to localStorage
          localStorage.setItem("centuari_portfolio", JSON.stringify(parsed));
          return parsed;
        } catch {
          return defaultPortfolio;
        }
      }
    }
    return defaultPortfolio;
  });

  // Collateral status - which assets are being used as collateral
  const [collateralStatus, setCollateralStatus] = React.useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("centuari_collateral");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Migrate old AAVE collateral status to XAUT if exists
          if (parsed.aave !== undefined && parsed.xaut === undefined) {
            parsed.xaut = parsed.aave;
            delete parsed.aave;
            localStorage.setItem("centuari_collateral", JSON.stringify(parsed));
          }
          return parsed;
        } catch {
          return {};
        }
      }
    }
    return {};
  });

  // Sync portfolio from localStorage on mount and when it changes
  React.useEffect(() => {
    const handleStorageChange = () => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("centuari_portfolio");
        if (stored) {
          try {
            setPortfolio(JSON.parse(stored));
          } catch { }
        }
        const storedCollateral = localStorage.getItem("centuari_collateral");
        if (storedCollateral) {
          try {
            setCollateralStatus(JSON.parse(storedCollateral));
          } catch { }
        }
      }
    };

    // Listen for storage changes (from other tabs/components)
    window.addEventListener("storage", handleStorageChange);

    // Also check periodically (for same-tab updates)
    const interval = setInterval(handleStorageChange, 500);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Handle collateral toggle
  const handleToggleCollateral = React.useCallback((tokenValue: string) => {
    setCollateralStatus((prev) => {
      const newStatus = {
        ...prev,
        [tokenValue]: !prev[tokenValue],
      };

      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("centuari_collateral", JSON.stringify(newStatus));
      }

      return newStatus;
    });
  }, []);

  // Columns definition with toggle handler
  const columns: ColumnDef<AssetProps>[] = React.useMemo(() => [
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
                unoptimized
                onError={(e) => {
                  console.error(`Failed to load image: ${asset.assetImg}`);
                }}
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
      accessorKey: "idleAssetYield",
      header: () => <p className="text-center">Idle Asset Yield</p>,
      cell: ({ row }) => {
        const yieldAmount = row.original.idleAssetYield;
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
        }).format(yieldAmount);

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
        const asset = row.original;
        const isCollateral = asset.isCollateral;
        return (
          <div className="flex items-center gap-2 justify-end">
            <span className="text-white/40 text-sm">As Collateral</span>
            <div
              onClick={() => handleToggleCollateral(asset.tokenValue)}
              className={cn(
                "w-5 h-5 rounded-full border flex items-center justify-center transition-colors cursor-pointer hover:opacity-80",
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
  ], [handleToggleCollateral]);

  // Transform portfolio data to AssetProps format
  const data: AssetProps[] = React.useMemo(() => {
    const marketAPY = 0.06; // Fixed market APY of 6.0%
    return tokenList
      .filter(token => portfolio[token.value] && portfolio[token.value] > 0)
      .map((token, index) => {
        const amountInUsd = portfolio[token.value] || 0;
        const walletBalance = token.price > 0 ? amountInUsd / token.price : 0;
        const isCollateral = collateralStatus[token.value] || false;
        const idleAssetYield = amountInUsd * marketAPY; // Annual yield amount

        return {
          id: `${token.value}-${index}`,
          assetImg: token.logo,
          assetName: token.label,
          assetSymbol: getTokenSymbol(token.label),
          walletBalance,
          amountInUsd,
          idleAssetYield,
          isCollateral,
          tokenValue: token.value, // Add token value
        };
      });
  }, [portfolio, collateralStatus]);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

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
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
  });

  return (
    <div className="w-full overflow-hidden flex flex-col h-full rounded-xl bg-white/5 border">
      <h1 className="text-white text-lg font-normal py-3.5 px-6 flex-shrink-0">My Assets</h1>
      <div className="flex-1 overflow-y-auto overflow-x-auto">
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
      <div className="flex flex-col sm:flex-row flex-shrink-0 w-full items-center justify-between py-4 px-6 border-t border-white/5 gap-4 sm:gap-0">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-white font-medium">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
          </span>
          <span className="text-white/20">•</span>
          <span className="text-white/40">
            Showing {table.getRowModel().rows.length} of {data.length} Data
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
