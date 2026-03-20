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

export default function TransactionHistoryPage() {
  const { isLoading } = useMyPortfolio();

  if (isLoading) {
    return (
      <PageContainer innerClassName="2xl:min-h-0">
        <TransactionHistorySkeleton />
      </PageContainer>
    );
  }

  return (
    <PageContainer innerClassName="2xl:min-h-0">
        <TransactionHistoryHeader />
        <div className="bg-white/5 rounded-lg p-4 md:p-6">
          <Tabs defaultValue="order_history" className="w-full">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <TabsList className="bg-white/5 w-full lg:w-auto justify-start">
                <TabsTrigger
                  value="open_orders"
                  className="flex-1 lg:flex-none data-[state=active]:!border-none"
                >
                  Open Orders
                </TabsTrigger>
                <TabsTrigger
                  value="order_history"
                  className="flex-1 lg:flex-none data-[state=active]:!border-none"
                >
                  Order History
                </TabsTrigger>
                <TabsTrigger
                  value="transaction_history"
                  className="flex-1 lg:flex-none data-[state=active]:!border-none"
                >
                  Transaction History
                </TabsTrigger>
              </TabsList>

              <div className="flex flex-wrap items-center gap-2">
                <Popover>
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
                        <span className="text-white font-medium">All Time</span>
                      </span>
                      <ChevronDown className="w-4 h-4 text-white/50 ml-1" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto bg-[#1b2029] border-0 p-0">
                    <CentuariCalender />
                  </PopoverContent>
                </Popover>

                <Select defaultValue="all_transaction">
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

                <Select defaultValue="all_status">
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
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <TabsContent value="open_orders" className="mt-0">
              <div className="overflow-x-auto">
                <DataTableOpenOrders />
              </div>
            </TabsContent>
            <TabsContent value="order_history" className="mt-0">
              <div className="overflow-x-auto">
                <DataTableOrderHistory />
              </div>
            </TabsContent>
            <TabsContent value="transaction_history" className="mt-0">
              <div className="overflow-x-auto">
                <DataTableTransactionHistory />
              </div>
            </TabsContent>
          </Tabs>
        </div>
    </PageContainer>
  );
}
