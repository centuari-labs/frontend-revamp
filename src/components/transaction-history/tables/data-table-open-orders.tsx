"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
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
import { Edit2, Trash2 } from "lucide-react";

// TODO: Replace with real API type once open orders endpoint is available
export type OpenOrderItem = {
  id: string;
  side: "LEND" | "BORROW";
  orderType: string;
  rate: number;
  amount: string;
  status: string;
  asset: {
    symbol: string;
    imageUrl: string | null;
  };
  createdAt: string;
};

const statusDotColors: Record<string, string> = {
  OPEN: "bg-blue-500",
  PARTIALLY_FILLED: "bg-yellow-500",
};

const columns: ColumnDef<OpenOrderItem>[] = [
  {
    id: "token",
    header: "Loan Token",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.asset.imageUrl && (
          <Image
            src={row.original.asset.imageUrl}
            alt={row.original.asset.symbol}
            width={24}
            height={24}
            className="rounded-full"
          />
        )}
        <span>{row.original.asset.symbol}</span>
      </div>
    ),
  },
  {
    accessorKey: "side",
    header: "Order Type",
    cell: ({ row }) => (
      <CentuariBadge
        variant={row.original.side === "LEND" ? "primary" : "warning"}
        className="capitalize"
      >
        {row.original.side === "LEND" ? "Lend" : "Borrow"}
      </CentuariBadge>
    ),
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => (
      <span>
        {new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(
          Number(row.original.amount)
        )}{" "}
        {row.original.asset.symbol}
      </span>
    ),
  },
  {
    accessorKey: "rate",
    header: "Target APR %",
    cell: ({ row }) => {
      const aprPercent = row.original.rate.toFixed(1);
      return aprPercent.replace(".", ",") + "%";
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created at",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 ${statusDotColors[status] ?? "bg-gray-500"} rounded-full`} />
          <span className="capitalize">{status.toLowerCase().replace("_", " ")}</span>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: () => (
      <div className="flex items-center gap-2">
        <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
          <Edit2 size={14} className="text-white" />
        </button>
        <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
          <Trash2 size={14} className="text-red-400" />
        </button>
      </div>
    ),
  },
];

// TODO: Integrate with real open orders API endpoint when available
const EMPTY_DATA: OpenOrderItem[] = [];

export function DataTableOpenOrders() {
  const table = useReactTable({
    data: EMPTY_DATA,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-md">
        <Table className="min-w-[800px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-white/5">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={`text-sm text-muted-foreground font-normal ${
                      headerGroup.headers[0].id === header.id
                        ? "rounded-l-sm"
                        : ""
                    } ${
                      headerGroup.headers[headerGroup.headers.length - 1].id ===
                      header.id
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
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center"
              >
                No open orders.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
