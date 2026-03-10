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
import { tokenList, defaultPortfolio } from "@/lib/portfolio-data";
import {
  UseAssetAsCollateralDialog,
  type UseAssetAsCollateralDialogAsset,
} from "@/components/use-asset-as-collateral-dialog";
import { UseAllAssetsAsCollateralDialog } from "@/components/use-all-assets-as-collateral-dialog";
import { CentuariTooltip } from "@/components/centuari-tooltip";

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

interface DataTableAssetsProps {
  assets?: AssetProps[];
  onToggleCollateral?: (assetId: string, isCollateral: boolean) => void;
}

export function DataTableAssets({ assets: externalAssets, onToggleCollateral }: DataTableAssetsProps = {}) {
  // Portfolio state - sync with borrow dialog (mock mode only)
  const [portfolio, setPortfolio] = React.useState<Record<string, number>>(() => {
    if (externalAssets) return {};
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
          // Migrate old nvda key to nvdaon (NVIDIA token)
          if (parsed.nvda !== undefined && parsed.nvdaon === undefined) {
            parsed.nvdaon = parsed.nvda;
            delete parsed.nvda;
          }
          // Add NVDA (nvdaon) if it doesn't exist
          if (parsed.nvdaon === undefined && defaultPortfolio.nvdaon !== undefined) {
            parsed.nvdaon = defaultPortfolio.nvdaon;
          }
          // Add AAPLon (Apple Ondo Tokenized) if it doesn't exist
          if (!parsed.aaplon && defaultPortfolio.aaplon !== undefined) {
            parsed.aaplon = defaultPortfolio.aaplon;
          }
          // Add TLTon (iShares) if it doesn't exist
          if (!parsed.tlton && defaultPortfolio.tlton !== undefined) {
            parsed.tlton = defaultPortfolio.tlton;
          }
          // Add SLVOn (iShares Silver Trust) if missing or zero
          if ((parsed.slvon === undefined || parsed.slvon === 0) && defaultPortfolio.slvon !== undefined) {
            parsed.slvon = defaultPortfolio.slvon;
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

  // Pending asset for collateral confirmation dialog
  const [pendingCollateralAsset, setPendingCollateralAsset] =
    React.useState<UseAssetAsCollateralDialogAsset | null>(null);

  // Dialog for "use all assets as collateral" confirmation
  const [showUseAllCollateralDialog, setShowUseAllCollateralDialog] =
    React.useState(false);

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

  // Refs to avoid unnecessary state updates (which reset table pagination)
  const lastPortfolioRef = React.useRef<string>("");
  const lastCollateralRef = React.useRef<string>("");

  // Sync portfolio from localStorage on mount and when it changes (mock mode only)
  React.useEffect(() => {
    if (externalAssets) return;

    const handleStorageChange = () => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("centuari_portfolio");
        if (stored && stored !== lastPortfolioRef.current) {
          lastPortfolioRef.current = stored;
          try {
            setPortfolio(JSON.parse(stored));
          } catch { }
        }
        const storedCollateral = localStorage.getItem("centuari_collateral");
        if (storedCollateral && storedCollateral !== lastCollateralRef.current) {
          lastCollateralRef.current = storedCollateral;
          try {
            setCollateralStatus(JSON.parse(storedCollateral));
          } catch { }
        }
      }
    };

    // Set initial refs so we don't trigger update on first interval tick
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("centuari_portfolio");
      if (stored) lastPortfolioRef.current = stored;
      const storedCollateral = localStorage.getItem("centuari_collateral");
      if (storedCollateral) lastCollateralRef.current = storedCollateral;
    }

    // Listen for storage changes (from other tabs/components)
    window.addEventListener("storage", handleStorageChange);

    // Also check periodically (for same-tab updates)
    const interval = setInterval(handleStorageChange, 500);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [externalAssets]);

  // Handle collateral toggle
  const handleToggleCollateral = React.useCallback((tokenValue: string) => {
    if (onToggleCollateral) {
      // API mode: find the current collateral state and toggle
      const current = externalAssets?.find((a) => a.id === tokenValue || a.tokenValue === tokenValue);
      onToggleCollateral(tokenValue, !current?.isCollateral);
      return;
    }
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
  }, [onToggleCollateral, externalAssets]);

  // Transform portfolio data to AssetProps format (before columns so header can use it)
  const data: AssetProps[] = React.useMemo(() => {
    if (externalAssets) return externalAssets;

    const marketAPR = 0.06; // Fixed market APR of 6.0%
    return tokenList
      .filter(token => portfolio[token.value] && portfolio[token.value] > 0)
      .map((token, index) => {
        const amountInUsd = portfolio[token.value] || 0;
        const walletBalance = token.price > 0 ? amountInUsd / token.price : 0;
        const isCollateral = collateralStatus[token.value] || false;
        const idleAssetYield = amountInUsd * marketAPR; // Annual yield amount

        return {
          id: `${token.value}-${index}`,
          assetImg: token.logo,
          assetName: token.label,
          assetSymbol: token.value,
          walletBalance,
          amountInUsd,
          idleAssetYield,
          isCollateral,
          tokenValue: token.value,
        };
      });
  }, [externalAssets, portfolio, collateralStatus]);

  // Handle collateral cell click: show confirmation when enabling, direct toggle when disabling
  const handleCollateralCellClick = React.useCallback(
    (asset: AssetProps) => {
      if (asset.isCollateral) {
        handleToggleCollateral(asset.tokenValue);
      } else {
        setPendingCollateralAsset({
          logo: asset.assetImg,
          label: asset.assetName,
          tokenValue: asset.tokenValue,
        });
      }
    },
    [handleToggleCollateral]
  );

  // Select all / deselect all collateral (toggle)
  const handleSelectAllCollateral = React.useCallback(() => {
    if (data.length === 0) return;
    const allSelected = data.every((d) => d.isCollateral);
    setCollateralStatus((prev) => {
      const next = { ...prev };
      for (const d of data) {
        next[d.tokenValue] = !allSelected;
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("centuari_collateral", JSON.stringify(next));
      }
      return next;
    });
  }, [data]);

  // Collateral header click: open confirmation when enabling all, direct toggle when disabling all
  const handleCollateralHeaderClick = React.useCallback(() => {
    if (data.length === 0) return;
    const allSelected = data.every((d) => d.isCollateral);
    if (allSelected) {
      handleSelectAllCollateral();
    } else {
      setShowUseAllCollateralDialog(true);
    }
  }, [data, handleSelectAllCollateral]);

  // Columns definition with toggle handler
  const columns: ColumnDef<AssetProps>[] = React.useMemo(() => [
    {
      accessorKey: "assetName",
      header: "Assets",
      cell: ({ row }) => {
        const asset = row.original;
        return (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
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
            <CentuariTooltip message={asset.assetName}>
              <span className="font-medium text-white">
                {asset.assetName.length > 8
                  ? `${asset.assetName.slice(0, 8)}...`
                  : asset.assetName}
              </span>
            </CentuariTooltip>
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
            <span className="text-white/40">{asset.assetSymbol.toUpperCase()}</span>
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
    // {
    //   accessorKey: "idleAssetYield",
    //   header: () => <p className="text-center">Idle Asset Yield</p>,
    //   cell: ({ row }) => {
    //     const yieldAmount = row.original.idleAssetYield;
    //     const formatted = new Intl.NumberFormat("en-US", {
    //       style: "currency",
    //       currency: "USD",
    //       minimumFractionDigits: 2,
    //     }).format(yieldAmount);

    //     const [main, cents] = formatted.split(".");

    //     return (
    //       <div className="font-medium text-center text-success-base">
    //         {main}
    //         <span className="text-white/40">.{cents}</span>
    //       </div>
    //     );
    //   },
    // },
    {
      accessorKey: "isCollateral",
      header: () => {
        const allSelected = data.length > 0 && data.every((d) => d.isCollateral);
        return (
          <div className="flex items-center justify-end gap-2">
            <span>Collateral</span>
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                handleCollateralHeaderClick();
              }}
              className={cn(
                "w-5 h-5 rounded-full border flex items-center justify-center transition-colors cursor-pointer hover:opacity-80",
                allSelected
                  ? "bg-blue-600 border-blue-600"
                  : "bg-transparent border-white/20"
              )}
            >
              {allSelected && (
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
      cell: ({ row }) => {
        const asset = row.original;
        const isCollateral = asset.isCollateral;
        return (
          <div className="flex items-center gap-2 justify-end">
            <span className="text-white/40 text-sm">As Collateral</span>
            <div
              onClick={() => handleCollateralCellClick(asset)}
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
  ], [handleCollateralCellClick, handleCollateralHeaderClick, data]);

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
    <>
      <UseAssetAsCollateralDialog
        open={!!pendingCollateralAsset}
        onOpenChange={(open) => !open && setPendingCollateralAsset(null)}
        asset={pendingCollateralAsset}
        onConfirm={() => {
          if (pendingCollateralAsset) {
            handleToggleCollateral(pendingCollateralAsset.tokenValue);
            setPendingCollateralAsset(null);
          }
        }}
      />
      <UseAllAssetsAsCollateralDialog
        open={showUseAllCollateralDialog}
        onOpenChange={setShowUseAllCollateralDialog}
        assets={data.map((d) => ({ logo: d.assetImg, label: d.assetName }))}
        onConfirm={() => {
          handleSelectAllCollateral();
          setShowUseAllCollateralDialog(false);
        }}
      />
      <div className="w-full overflow-hidden flex flex-col h-full rounded-xl bg-white/5 border">
      <h1 className="text-white text-lg font-normal py-3.5 px-6 flex-shrink-0">My Assets</h1>
      <div className="flex-1 overflow-y-auto overflow-x-auto max-h-[300px]">
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
          <TableBody className="h-[400px]">
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
                  className="h-[400px] text-center"
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
    </>
  );
}
