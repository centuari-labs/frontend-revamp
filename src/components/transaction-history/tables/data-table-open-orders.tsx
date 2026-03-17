"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Edit2, Trash2 } from "lucide-react";
import { useOpenOrders } from "@/hooks/use-open-orders";
import type { OpenOrderItem } from "@/lib/api";
import { format } from "date-fns";

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
    cell: ({ row }) => `${row.original.rate}%`,
  },
  {
    accessorKey: "maturity",
    header: "Maturity",
    cell: ({ row }) => {
      const date = new Date(row.original.maturity);
      return format(date, "MMM d, yyyy");
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created at",
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      return format(date, "MMM d, yyyy HH:mm:ss");
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 ${statusDotColors[status] ?? "bg-gray-500"} rounded-full`}
          />
          <span className="capitalize">
            {status.toLowerCase().replace("_", " ")}
          </span>
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

function TableSkeleton() {
  return (
    <div className="space-y-3 py-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 px-2">
          {Array.from({ length: 8 }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function DataTableOpenOrders() {
  const [page, setPage] = React.useState(1);
  const limit = 10;
  const { orders, totalData, totalPages, isLoading } = useOpenOrders({
    page,
    limit,
  });

  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  if (isLoading && orders.length === 0) {
    return <TableSkeleton />;
  }

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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
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
                  No open orders.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between py-4">
        <div className="text-muted-foreground text-sm">
          {totalData} open order{totalData !== 1 ? "s" : ""}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
