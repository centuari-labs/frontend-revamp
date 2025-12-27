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
import { ArrowLeft, ArrowRight, HandCoins, Plus } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

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

export type PositionProps = {
  id: string;
  assetImg: string;
  assetName: string;
  collateralImgs: string[];
  amount: number;
  apy: number;
};

const data: PositionProps[] = [
  {
    id: "1",
    assetImg: "/tokens/eth-icon.svg",
    assetName: "Ethereum",
    collateralImgs: [
      "/tokens/eth-icon.svg",
      "/tokens/btc-icon.svg",
      "/tokens/chainlink-icon.svg",
    ],
    amount: 4234.0,
    apy: 4.9,
  },
  {
    id: "2",
    assetImg: "/tokens/eth-icon.svg",
    assetName: "Ethereum",
    collateralImgs: [
      "/tokens/eth-icon.svg",
      "/tokens/btc-icon.svg",
      "/tokens/chainlink-icon.svg",
    ],
    amount: 4234.0,
    apy: 4.9,
  },
  {
    id: "3",
    assetImg: "/tokens/eth-icon.svg",
    assetName: "Ethereum",
    collateralImgs: [
      "/tokens/eth-icon.svg",
      "/tokens/btc-icon.svg",
      "/tokens/chainlink-icon.svg",
    ],
    amount: 4234.0,
    apy: 4.9,
  },
  {
    id: "4",
    assetImg: "/tokens/eth-icon.svg",
    assetName: "Ethereum",
    collateralImgs: [
      "/tokens/eth-icon.svg",
      "/tokens/btc-icon.svg",
      "/tokens/chainlink-icon.svg",
    ],
    amount: 4234.0,
    apy: 4.9,
  },
  {
    id: "5",
    assetImg: "/tokens/eth-icon.svg",
    assetName: "Ethereum",
    collateralImgs: [
      "/tokens/eth-icon.svg",
      "/tokens/btc-icon.svg",
      "/tokens/chainlink-icon.svg",
    ],
    amount: 4234.0,
    apy: 4.9,
  },
  {
    id: "6",
    assetImg: "/tokens/eth-icon.svg",
    assetName: "Ethereum",
    collateralImgs: [
      "/tokens/eth-icon.svg",
      "/tokens/btc-icon.svg",
      "/tokens/chainlink-icon.svg",
    ],
    amount: 4234.0,
    apy: 4.9,
  },
];

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
    accessorKey: "collateral",
    header: () => <span>Collateral</span>,
    cell: ({ row }) => {
      const imgs = row.original.collateralImgs;
      return (
        <div className="flex items-center">
          {imgs.map((img, i) => (
            <div
              key={i}
              className={cn(
                "w-6 h-6 rounded-full border border-slate-900 bg-slate-800 overflow-hidden",
                i !== 0 && "-ml-2"
              )}
            >
              <Image
                src={img}
                alt="collateral"
                width={24}
                height={24}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
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
    accessorKey: "apy",
    header: "APY %",
    cell: ({ row }) => {
      const apy = row.original.apy;
      return (
        <div className="text-white font-medium">
          {apy.toString().replace(".", ",")}%
        </div>
      );
    },
  },
  {
    id: "action",
    header: "Action",
    cell: () => {
      return (
        <div className="flex items-center gap-4">
          <button className="text-white/80 hover:text-white transition-colors">
            <HandCoins size={18} />
          </button>
          <button className="text-white/80 hover:text-white transition-colors">
            <Plus size={18} />
          </button>
        </div>
      );
    },
  },
];

export function DataTableAllPosition() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

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
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const PositionTable = () => (
    <>
      <div className="overflow-x-auto">
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
      <div className="flex flex-col sm:flex-row items-center justify-between py-4 px-6 border-t border-white/5 gap-4 sm:gap-0">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-white font-medium">Page 1 of 10</span>
          <span className="text-white/20">•</span>
          <span className="text-white/40">Showing 10 of 16 Data</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="w-8 h-8 rounded-lg bg-white/5 border-none hover:bg-white/10"
          >
            <ArrowLeft size={16} className="text-white" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="w-8 h-8 rounded-lg bg-white/5 border-none hover:bg-white/10"
          >
            <ArrowRight size={16} className="text-white" />
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div className="w-full overflow-hidden rounded-xl bg-white/5 border">
      <Tabs defaultValue="borrow" className="w-full !gap-0">
        <div className="flex items-center justify-between py-2 px-6">
          <h1 className="text-white text-lg font-normal">All My Positions</h1>
          <TabsList className="bg-white/5 h-10 border border-white/5">
            <TabsTrigger
              value="borrow"
              className="px-6 h-8 rounded-md data-[state=active]:bg-[#3B3F46] data-[state=active]:text-white !border-none text-white/40"
            >
              Borrow
            </TabsTrigger>
            <TabsTrigger
              value="lend"
              className="px-6 h-8 rounded-md data-[state=active]:bg-[#3B3F46] data-[state=active]:text-white !border-none text-white/40"
            >
              Lend
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="borrow" className="mt-0">
          <PositionTable />
        </TabsContent>

        <TabsContent value="lend" className="mt-0">
          <PositionTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
