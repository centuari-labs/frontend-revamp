"use client";

import { CentuariTable } from "@/components/centuari-table";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit2, Search, Trash2 } from "lucide-react";
import Image from "next/image";

const mockPositions = [
  {
    id: 1,
    token: "USDT",
    logo: "/tokens/centuari-usdt.png",
    status: "Pending",
    amount: "$12,000",
    targetAPY: "8%",
    maturity: "22 Oct 2025",
    createdAt: "21 Oct 2025",
  },
  {
    id: 2,
    token: "USDT",
    logo: "/tokens/centuari-usdt.png",
    status: "Pending",
    amount: "$12,000",
    targetAPY: "8%",
    maturity: "22 Oct 2025",
    createdAt: "21 Oct 2025",
  },
];

function PositionCard({ position }: { position: (typeof mockPositions)[0] }) {
  return (
    <div className="px-4 py-4 border-b border-white/10 last:border-b-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Image
            src={position.logo}
            alt={position.token}
            width={32}
            height={32}
            className="rounded-full"
          />
          <div>
            <p className="font-semibold text-white">{position.token}</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              <span className="text-sm text-muted-foreground">
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
          <span className="text-white font-semibold">{position.amount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Target APY%</span>
          <span className="text-white font-semibold">{position.targetAPY}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Maturity</span>
          <span className="text-white font-semibold">{position.maturity}</span>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
          <Edit2 size={16} className="text-white" />
        </button>
        <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
          <Trash2 size={16} className="text-red-400" />
        </button>
      </div>
    </div>
  );
}

export function PositionSection() {
  return (
    <div className="mt-2 bg-white/5 rounded-md md:p-4">
      <Tabs defaultValue="open_orders">
        <div className="md:hidden">
          <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 px-3 pt-3 pb-2 border-b border-white/10">
            <h1 className="text-base font-medium mb-3">Your Position</h1>

            <div className="relative mb-3">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={18}
              />
              <Input
                placeholder="Search position"
                className="pl-10 bg-white/5 border-white/10"
              />
            </div>

            <TabsList className="bg-white/5 w-full grid grid-cols-3">
              <TabsTrigger
                value="open_orders"
                className="data-[state=active]:!border-none data-[state=active]:bg-white/10 text-xs"
              >
                Open Order
              </TabsTrigger>
              <TabsTrigger
                value="active_position"
                className="data-[state=active]:!border-none data-[state=active]:bg-white/10 text-xs"
              >
                Positions
              </TabsTrigger>
              <TabsTrigger
                value="all_transactions"
                className="data-[state=active]:!border-none data-[state=active]:bg-white/10 text-xs"
              >
                All Transaction
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="open_orders" className="mt-0">
            {mockPositions.map((position) => (
              <PositionCard key={position.id} position={position} />
            ))}
          </TabsContent>

          <TabsContent value="active_position" className="mt-0">
            {mockPositions.map((position) => (
              <PositionCard key={position.id} position={position} />
            ))}
          </TabsContent>

          <TabsContent value="all_transactions" className="mt-0">
            {mockPositions.map((position) => (
              <PositionCard key={position.id} position={position} />
            ))}
          </TabsContent>
        </div>

        <div className="hidden md:block p-2 sm:p-3">
          <div className="mb-3 md:mb-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <h1 className="text-sm sm:text-base font-medium">Position</h1>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
              <Input
                placeholder="Search Position..."
                className="w-full sm:max-w-xs md:max-w-sm text-sm"
              />
              <div className="overflow-x-auto">
                <TabsList className="bg-white/5 w-full sm:w-auto">
                  <TabsTrigger
                    value="open_orders"
                    className="data-[state=active]:!border-none text-xs sm:text-sm px-2 sm:px-3 md:px-4"
                  >
                    Open Orders
                  </TabsTrigger>
                  <TabsTrigger
                    value="active_position"
                    className="data-[state=active]:!border-none text-xs sm:text-sm px-2 sm:px-3 md:px-4"
                  >
                    Active Position
                  </TabsTrigger>
                  <TabsTrigger
                    value="order_history"
                    className="data-[state=active]:!border-none text-xs sm:text-sm px-2 sm:px-3 md:px-4"
                  >
                    Order History
                  </TabsTrigger>
                  <TabsTrigger
                    value="all_transactions"
                    className="data-[state=active]:!border-none text-xs sm:text-sm px-2 sm:px-3 md:px-4"
                  >
                    All Transactions
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
          </div>

          <TabsContent value="open_orders">
            <CentuariTable />
          </TabsContent>
          <TabsContent value="active_position">
            <CentuariTable />
          </TabsContent>
          <TabsContent value="order_history">
            <CentuariTable />
          </TabsContent>
          <TabsContent value="all_transactions">
            <CentuariTable />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
