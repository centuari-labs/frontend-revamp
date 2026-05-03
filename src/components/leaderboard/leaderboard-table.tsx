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
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trophy } from "lucide-react";
import { IcPolygonCentuari } from "../icons/ic-polygon-centuari";
import { CentuariGlassSurface } from "@/components/centuari-glass-surface";
import Image from "next/image";

const data: LeaderboardProps[] = [
  {
    id: "a1b2c3d4",
    rank: 1,
    username: "UserOne",
    totalTransactions: "$10,000",
    points: 1500,
  },
  {
    id: "b2c3d4e5",
    rank: 2,
    username: "UserTwo",
    totalTransactions: "$9,500",
    points: 1400,
  },
  {
    id: "c3d4e5f6",
    rank: 3,
    username: "UserThree",
    totalTransactions: "$8,000",
    points: 1300,
  },
  {
    id: "d4e5f6g7",
    rank: 4,
    username: "UserFour",
    totalTransactions: "$7,500",
    points: 1200,
  },
  {
    id: "e5f6g7h8",
    rank: 5,
    username: "UserFive",
    totalTransactions: "$6,000",
    points: 1100,
  },
  {
    id: "3u1reuv4asdas",
    rank: 240,
    username: "Charles",
    totalTransactions: "$55,000,000",
    points: 2600,
  },
];

const HIGHLIGHTED_USER_ID = "3u1reuv4asdas";

export type LeaderboardProps = {
  id: string;
  username: string;
  totalTransactions: string;
  points: number;
  rank: number;
};

export const columns: ColumnDef<LeaderboardProps>[] = [
  {
    accessorKey: "rank",
    header: "Rank",
    cell: ({ row }) => {
      const rank = row.original.rank;
      return (
        <div className="flex items-center gap-2 text-xs sm:text-sm md:text-base 2xl:text-lg">
          <IcPolygonCentuari fillColor="#10C16E" />
          <span>{rank}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "username",
    header: "Username",
    cell: ({ row }) => {
      const username = row.original.username;
      const isHighlighted = row.original.id === HIGHLIGHTED_USER_ID;
      return (
        <div className="flex items-center gap-2 text-xs sm:text-sm md:text-base 2xl:text-lg">
          <Image src="/assets/tier-3.png" alt="tier1" width={24} height={24} />
          <div className="flex items-center gap-2">
            <Image
              src="/assets/metamask.webp"
              alt="verified"
              width={20}
              height={20}
            />
            <span>{username}</span>
            {isHighlighted && (
              <span className="px-2 py-0.5 text-[10px] sm:text-xs bg-white/20 text-white rounded-full border">
                You
              </span>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "totalTransactions",
    header: "Total Transactions",
    cell: ({ row }) => {
      const totalTransactions = row.original.totalTransactions;
      return (
        <span className="text-xs sm:text-sm md:text-base 2xl:text-lg">
          {totalTransactions}
        </span>
      );
    },
  },
  {
    accessorKey: "points",
    header: "Points",
    cell: ({ row }) => {
      const points = row.original.points;
      return (
        <span className="text-xs sm:text-sm md:text-base 2xl:text-lg">
          {points}
        </span>
      );
    },
  },
];

export function LeaderboardTable() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const highlightedUser = React.useMemo(
    () => data.find((user) => user.id === HIGHLIGHTED_USER_ID),
    []
  );
  const otherUsers = React.useMemo(
    () => data.filter((user) => user.id !== HIGHLIGHTED_USER_ID),
    []
  );

  const table = useReactTable({
    data: otherUsers,
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

  return (
    <div className="w-full h-full flex flex-col">
      <div className="overflow-hidden rounded-md flex-1 min-h-0">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="bg-white/5 text-xs sm:text-sm md:text-base 2xl:text-lg"
              >
                {headerGroup.headers.map((header) => {
                  const isFirst = headerGroup.headers[0].id === header.id;
                  const isLast =
                    headerGroup.headers[headerGroup.headers.length - 1].id ===
                    header.id;

                  return (
                    <TableHead
                      key={header.id}
                      className={`font-normal text-muted-foreground px-2 py-2 sm:px-3 sm:py-2 md:px-4 md:py-2.5 2xl:px-5 2xl:py-3 ${
                        isFirst ? "rounded-l-sm" : ""
                      } ${isLast ? "rounded-r-sm" : ""}`}
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
              <>
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="text-xs sm:text-sm md:text-base 2xl:text-lg"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="border border-transparent px-2 py-2 sm:px-3 sm:py-2 md:px-4 md:py-2.5 2xl:px-5 2xl:py-3"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

                {/* Highlighted User Row */}
                {highlightedUser && (
                  <TableRow className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-y-2 border-green-500/50 hover:from-green-500/15 hover:to-emerald-500/15 text-xs sm:text-sm md:text-base 2xl:text-lg">
                    <TableCell className="border-transparent px-2 py-2 sm:px-3 md:px-4 2xl:px-5 2xl:py-3">
                      <div className="flex items-center gap-2">
                        <IcPolygonCentuari fillColor="#10C16E" />
                        <span className="font-semibold">
                          {highlightedUser.rank}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="border-transparent px-2 py-2 sm:px-3 md:px-4 2xl:px-5 2xl:py-3">
                      <div className="flex items-center gap-2">
                        <Image
                          src="/assets/tier-3.png"
                          alt="tier1"
                          width={24}
                          height={24}
                        />
                        <div className="flex items-center gap-2">
                          <Image
                            src="/assets/metamask.webp"
                            alt="verified"
                            width={20}
                            height={20}
                          />
                          <span className="font-semibold">
                            {highlightedUser.username}
                          </span>
                          <span className="px-2 py-0.5 text-[10px] sm:text-xs bg-green-500/20 text-green-400 rounded-full border border-green-500/50">
                            You
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="border-transparent px-2 py-2 sm:px-3 md:px-4 2xl:px-5 2xl:py-3">
                      <span className="font-semibold">
                        {highlightedUser.totalTransactions}
                      </span>
                    </TableCell>
                    <TableCell className="border-transparent px-2 py-2 sm:px-3 md:px-4 2xl:px-5 2xl:py-3">
                      <span className="font-semibold">
                        {highlightedUser.points}
                      </span>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-48"
                >
                  <div className="flex flex-col items-center justify-center gap-3">
                    <CentuariGlassSurface intensity="soft" className="rounded-xl p-3">
                      <Trophy size={22} className="text-white/40" />
                    </CentuariGlassSurface>
                    <span className="text-sm text-white/40">
                      No leaderboard data yet
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-[10px] sm:text-xs md:text-sm 2xl:text-base text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="text-[10px] sm:text-xs md:text-sm 2xl:text-base 2xl:h-9 2xl:px-4"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-[10px] sm:text-xs md:text-sm 2xl:text-base 2xl:h-9 2xl:px-4"
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
