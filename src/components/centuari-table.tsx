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
import { CentuariBadge } from "./centuari-badge";
import { AmendDialog } from "./amend-dialog";
import { normalizeMaturity, formatMaturityTimestamp } from "@/lib/maturity";

const data: PositionProps[] = [
  {
    id: "a1b2c3d4",
    collateralTokenImg: "/tokens/usdt-icon.webp",
    collateralTokenSymbol: "USDT",
    loanTokenImg: "/tokens/usdc-icon.webp",
    loanTokenSymbol: "USDC",
    amount: 500,
    apr: 0.05,
    healthFactor: "0.0 ~ Safe",
    maturity: new Date(2024, 8, 22).getTime(),
    createdAt: "22 Jun 2024",
    status: "OPEN",
  },
  {
    id: "3u1reuv4",
    collateralTokenImg: "/tokens/usdt-icon.webp",
    collateralTokenSymbol: "USDT",
    loanTokenImg: "/tokens/usdc-icon.webp",
    loanTokenSymbol: "USDC",
    amount: 500,
    apr: 0.05,
    maturity: new Date(2024, 8, 22).getTime(),
    createdAt: "22 Jun 2024",
    healthFactor: "0.0 ~ Safe",
    status: "OPEN",
  },
  {
    id: "derv1ws0",
    collateralTokenImg: "/tokens/usdt-icon.webp",
    collateralTokenSymbol: "USDT",
    loanTokenImg: "/tokens/usdc-icon.webp",
    loanTokenSymbol: "USDC",
    amount: 500,
    apr: 0.05,
    maturity: new Date(2024, 8, 22).getTime(),
    createdAt: "22 Jun 2024",
    healthFactor: "0.0 ~ Safe",
    status: "OPEN",
  },
  {
    id: "5kma53ae",
    collateralTokenImg: "/tokens/usdt-icon.webp",
    collateralTokenSymbol: "USDT",
    loanTokenImg: "/tokens/usdc-icon.webp",
    loanTokenSymbol: "USDC",
    amount: 500,
    apr: 0.05,
    maturity: new Date(2024, 8, 22).getTime(),
    healthFactor: "0.0 ~ Safe",
    createdAt: "22 Jun 2024",
    status: "OPEN",
  },
  {
    id: "bhqecj4p",
    collateralTokenImg: "/tokens/usdt-icon.webp",
    collateralTokenSymbol: "USDT",
    loanTokenImg: "/tokens/usdc-icon.webp",
    loanTokenSymbol: "USDC",
    amount: 500,
    apr: 0.05,
    maturity: new Date(2024, 8, 22).getTime(),
    healthFactor: "0.0 ~ Safe",
    createdAt: "22 Jun 2024",
    status: "OPEN",
  },
];

export type PositionProps = {
  id: string;
  collateralTokenImg?: string;
  collateralTokenSymbol?: string;
  loanTokenImg?: string;
  loanTokenSymbol?: string;
  amount: number;
  apr?: number;
  maturity?: number;
  createdAt?: string;
  healthFactor?: string;
  status: "OPEN" | "FILLED" | "CANCELLED" | "PARTIALLY_FILLED";
};

const tokenList = [
  { logo: "/tokens/centuari-btc.png", value: "btc", label: "Bitcoin" },
  { logo: "/tokens/xaut-icon.webp", value: "xaut", label: "Tether Gold" },
  { logo: "/tokens/eth-icon.webp", value: "eth", label: "Ethereum" },
  { logo: "/tokens/centuari-arbitrum.png", value: "arb", label: "Arbitrum" },
  { logo: "/tokens/usdc-icon.webp", value: "usdc", label: "USDC" },
  { logo: "/tokens/centuari-usdt.png", value: "usdt", label: "USDT" },
  { logo: "/tokens/centuari-dai.png", value: "dai", label: "DAI" },
  { logo: "/tokens/centuari-centuari.png", value: "centuari", label: "Centuari" },
];

type PositionForDialog =
  | {
    id: string;
    assetImg: string;
    assetName: string;
    amount: number;
    apr: number;
    type: "lend";
    tokenValue: string;
    tokenSymbol: string;
    maturity: number;
    status: "OPEN" | "FILLED" | "CANCELLED" | "PARTIALLY_FILLED";
    createdAt: string;
    timestamp: number;
    orderType?: "limit" | "market";
  }
  | {
    id: string;
    assetImg: string;
    assetName: string;
    amount: number;
    apr: number;
    type: "borrow";
    tokenValue: string;
    tokenSymbol: string;
    maturity: number;
    status: "OPEN" | "FILLED" | "CANCELLED" | "PARTIALLY_FILLED";
    createdAt: string;
    timestamp: number;
    orderType?: "limit" | "market";
    collateralTokens: string[];
  };

const ActionCell: React.FC<{
  row: PositionProps;
  onUpdate?: (position: PositionForDialog) => void;
}> = ({ row, onUpdate }) => {
  // Convert PositionProps to PositionForDialog format for AmendDialog
  // Since PositionProps has loanTokenSymbol, it's a borrow position
  const positionForDialog: PositionForDialog | null = row.loanTokenSymbol ? {
    id: row.id,
    assetImg: row.loanTokenImg || "/tokens/usdc-icon.webp",
    assetName: row.loanTokenSymbol,
    amount: row.amount,
    apr: row.apr || 0.12,
    type: "borrow" as const,
    tokenValue: (row.loanTokenSymbol || "usdc").toLowerCase(),
    tokenSymbol: row.loanTokenSymbol || "USDC",
    maturity: normalizeMaturity(row.maturity),
    status: row.status,
    createdAt: row.createdAt || new Date().toLocaleDateString(),
    timestamp: Date.now(),
    orderType: "limit" as const,
    collateralTokens: row.collateralTokenSymbol ? [(row.collateralTokenSymbol || "usdt").toLowerCase()] : [],
  } : null;

  if (!positionForDialog) return null;

  return (
    <div className="flex gap-1 items-center">
      <AmendDialog
        position={positionForDialog}
        tokenList={tokenList}
        onUpdate={onUpdate}
      />
      <Button variant="secondary" size="icon">
        <Trash size={14} />
      </Button>
    </div>
  );
};

export const columns = (onUpdate?: (position: PositionForDialog) => void): ColumnDef<PositionProps>[] => [
  {
    accessorKey: "collateralTokenSymbol",
    header: "Collateral Token",
    cell: ({ row }) => {
      const collateralTokenImg = row.original.collateralTokenImg;
      const collateralTokenSymbol = row.original.collateralTokenSymbol;
      return (
        <div className="flex items-center gap-2">
          {collateralTokenImg && (
            <Image
              src={collateralTokenImg}
              alt={collateralTokenSymbol || ""}
              width={24}
              height={24}
            />
          )}
          <span>{collateralTokenSymbol}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "loanTokenSymbol",
    header: "Loan Token",
    cell: ({ row }) => {
      const loanTokenImg = row.original.loanTokenImg;
      const loanTokenSymbol = row.original.loanTokenSymbol;
      return (
        <div className="flex items-center gap-2">
          {loanTokenImg && (
            <Image
              src={loanTokenImg}
              alt={loanTokenSymbol || ""}
              width={24}
              height={24}
            />
          )}
          <span>{loanTokenSymbol}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "amount",
    header: "Amount Borrowed",
    cell: ({ row }) => `$${row.original.amount.toFixed(2)}`,
  },
  {
    accessorKey: "apr",
    header: "Target APR %",
    cell: ({ row }) => `${(row.original.apr! * 100).toFixed(2)}%`,
  },
  {
    accessorKey: "maturity",
    header: "Maturity",
    cell: ({ row }) => formatMaturityTimestamp(normalizeMaturity(row.original.maturity)),
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
  },
  {
    accessorKey: "healthFactor",
    header: "Health Factor",
    cell: ({ row }) => {
      const healthFactor = row.original.healthFactor;
      return (
        <CentuariBadge variant={"secondary"} className="uppercase text-white">
          {healthFactor}
        </CentuariBadge>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <CentuariBadge
          variant={"secondary"}
          isDot={true}
          className="uppercase text-white"
        >
          {status}
        </CentuariBadge>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      return <ActionCell row={row.original} onUpdate={onUpdate} />;
    },
  },
];

interface CentuariTableProps {
  onUpdate?: (position: PositionForDialog) => void;
}

export function CentuariTable({ onUpdate }: CentuariTableProps = {}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns: columns(onUpdate),
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
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-white/5">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className={`text-sm text-muted-foreground font-normal ${headerGroup.headers[0].id === header.id
                          ? "rounded-l-sm"
                          : ""
                        } ${headerGroup.headers[headerGroup.headers.length - 1]
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
