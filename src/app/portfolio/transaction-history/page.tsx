"use client";

import { CentuariCalender } from "@/components/centuari-calender";
import { DataTableOrderHistory } from "@/components/transaction-history/tables/data-table-order-history";
import { DataTableTransactionHistory } from "@/components/transaction-history/tables/data-table-transaction-history";
import { DataTableOpenOrders } from "@/components/transaction-history/tables/data-table-open-orders";
import { TransactionHistoryHeader } from "@/components/transaction-history/tables/transaction-history-header";
import { PageContainer } from "@/components/page-container";
import { Button } from "@/components/ui/button";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeftRight, Calendar, ChevronDown, Flag } from "lucide-react";
import { TransactionHistorySkeleton } from "@/components/transaction-history/transaction-history-skeleton";
import { useMyPortfolio } from "@/hooks/use-my-portfolio";
import { CentuariGlassLayers } from "@/components/centuari-glass-surface";

import * as React from "react";
import { type DateRange } from "react-day-picker";
import { format } from "date-fns";

export default function TransactionHistoryPage() {
  const { isLoading: isPortfolioLoading } = useMyPortfolio();
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
  const [tempDateRange, setTempDateRange] = React.useState<DateRange | undefined>();
  const [side, setSide] = React.useState<string>("all_transaction");
  const [status, setStatus] = React.useState<string>("all_status");
  const [activeTab, setActiveTab] = React.useState("open_orders");
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

  if (isPortfolioLoading) {
    return (
      <PageContainer innerClassName="2xl:min-h-0">
        <TransactionHistorySkeleton />
      </PageContainer>
    );
  }

  const startDate = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined;
  const endDate = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined;

  const filters = {
    side,
    status,
    startDate,
    endDate,
  };

  return (
    <PageContainer innerClassName="2xl:min-h-0">
      <TransactionHistoryHeader />
      {/* Transaction History Container */}
      <div className="group/glass relative bg-transparent border-0 rounded-xl p-4 md:p-6 isolate overflow-hidden">
        <CentuariGlassLayers intensity="soft" />
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <TabsList className="bg-white/5 w-full lg:w-auto justify-start">
              <TabsTrigger
                value="open_orders"
                className="group/glass relative overflow-hidden isolate flex-1 lg:flex-none data-[state=active]:border-none! data-[state=active]:text-white !bg-transparent !shadow-none text-white/40"
              >
                <span className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity [[data-state=active]>&]:opacity-100">
                  <CentuariGlassLayers intensity="soft" />
                </span>
                <span className="relative z-20">Open Orders</span>
              </TabsTrigger>
              <TabsTrigger
                value="order_history"
                className="group/glass relative overflow-hidden isolate flex-1 lg:flex-none data-[state=active]:border-none! data-[state=active]:text-white !bg-transparent !shadow-none text-white/40"
              >
                <span className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity [[data-state=active]>&]:opacity-100">
                  <CentuariGlassLayers intensity="soft" />
                </span>
                <span className="relative z-20">Order History</span>
              </TabsTrigger>
              <TabsTrigger
                value="transaction_history"
                className="group/glass relative overflow-hidden isolate flex-1 lg:flex-none data-[state=active]:border-none! data-[state=active]:text-white !bg-transparent !shadow-none text-white/40"
              >
                <span className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity [[data-state=active]>&]:opacity-100">
                  <CentuariGlassLayers intensity="soft" />
                </span>
                <span className="relative z-20">Transaction History</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex flex-wrap items-center gap-2">
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 md:flex-none flex items-center gap-2 bg-white/5 border-white/10 h-9 px-3 hover:bg-white/10 transition-colors"
                  >
                    <Calendar className="w-4 h-4 text-white" />
                    <span className="text-sm whitespace-nowrap">
                      <span className="text-muted-foreground">
                        Date Range :{" "}
                      </span>
                      <span className="text-white font-medium">
                        {dateRange?.from ? (
                          dateRange.to ? (
                            `${format(dateRange.from, "LLL dd, y")}- ${format(dateRange.to, "LLL dd, y")}`
                          ) : (
                            format(dateRange.from, "LLL dd, y")
                          )
                        ) : (
                          "All Time"
                        )}
                      </span>
                    </span>
                    <ChevronDown className="w-4 h-4 text-white/50 ml-1" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="group/glass relative w-auto bg-black/40 backdrop-blur-2xl border-0 p-0 isolate overflow-hidden rounded-xl" align="end">
                  <CentuariGlassLayers intensity="soft" />
                  <CentuariCalender
                    value={tempDateRange}
                    onChange={setTempDateRange}
                    onApply={() => {
                      setDateRange(tempDateRange);
                      setIsCalendarOpen(false);
                    }}
                    onCancel={() => {
                      setTempDateRange(dateRange);
                      setIsCalendarOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>

              <Select value={side} onValueChange={setSide}>
                <SelectTrigger className="flex-1 md:flex-none bg-white/5 border-white/10 h-9 px-3 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2">
                    <ArrowLeftRight className="w-4 h-4 text-white" />
                    <span className="text-sm whitespace-nowrap">
                      <span className="text-muted-foreground">Type : </span>
                      <SelectValue
                        placeholder="All"
                        className="text-white font-medium"
                      />
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all_transaction">All</SelectItem>
                    <SelectItem value="lend">Lend</SelectItem>
                    <SelectItem value="borrow">Borrow</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              {activeTab !== "transaction_history" && (
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="flex-1 md:flex-none bg-white/5 border-white/10 h-9 px-3 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-2">
                      <Flag className="w-4 h-4 text-white" />
                      <span className="text-sm whitespace-nowrap">
                        <span className="text-muted-foreground">Status : </span>
                        <SelectValue
                          placeholder="All"
                          className="text-white font-medium"
                        />
                      </span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all_status">All</SelectItem>
                      <SelectItem value="OPEN">Open</SelectItem>
                      <SelectItem value="FILLED">Filled</SelectItem>
                      <SelectItem value="PARTIALLY_FILLED">Partially Filled</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <TabsContent value="open_orders" className="mt-0">
            <div className="overflow-x-auto">
              <DataTableOpenOrders filters={filters} />
            </div>
          </TabsContent>
          <TabsContent value="order_history" className="mt-0">
            <div className="overflow-x-auto">
              <DataTableOrderHistory filters={filters} />
            </div>
          </TabsContent>
          <TabsContent value="transaction_history" className="mt-0">
            <div className="overflow-x-auto">
              <DataTableTransactionHistory filters={filters} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
