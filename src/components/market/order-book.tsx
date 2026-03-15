"use client";

import React from "react";
import { gsap } from "gsap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ArrowUp } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { useOrderbook, type OrderRow } from "@/hooks/use-orderbook";
import { useRecentTrades, type TradeRow } from "@/hooks/use-recent-trades";

const formatAPR = (apr: number): string => `${(apr * 100).toFixed(2)}%`;
const formatAmount = (amount: number): string =>
  amount.toLocaleString(undefined, { maximumFractionDigits: 0 });

const OrderRowView: React.FC<{
  order: OrderRow;
  maxAmount: number;
}> = ({ order, maxAmount }) => {
  const isBorrow = order.side === "borrow";
  const widthPct = maxAmount > 0 ? (order.amount / maxAmount) * 100 : 0;

  const barRef = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    if (!barRef.current) return;
    gsap.to(barRef.current, {
      width: `${widthPct}%`,
      duration: 0.6,
      ease: "power3.out",
    });
  }, [widthPct]);

  return (
    <div className="relative grid grid-cols-12 h-7 items-center text-sm hover:bg-white/5 transition-colors overflow-hidden">
      {/* Per-row liquidity bar — anchored right */}
      <div
        ref={barRef}
        className={`absolute inset-y-0 right-0 ${
          isBorrow ? "bg-[rgba(61,229,122,0.25)]" : "bg-[rgba(255,59,68,0.25)]"
        }`}
        style={{ width: "0%" }}
      />

      {/* APR */}
      <div
        className={`col-span-6 pl-2 font-semibold tracking-tight z-10 ${
          isBorrow ? "text-[#3de57a]" : "text-[#ff5b5b]"
        }`}
      >
        {formatAPR(order.apr)}
      </div>

      {/* Amount */}
      <div className="col-span-6 text-right font-semibold tracking-tight pr-2 z-10 text-white/80">
        {formatAmount(order.amount)}
      </div>
    </div>
  );
};

const OrderTable: React.FC<{
  orders: OrderRow[];
  align?: "top" | "bottom";
}> = ({ orders, align = "top" }) => {
  const sideMaxAmount = Math.max(...orders.map((o) => o.amount), 1);
  return (
    <ScrollArea className="h-[160px]">
      <div
        className={`flex flex-col ${align === "bottom" ? "justify-end min-h-[160px]" : ""} space-y-0.5`}
      >
        {orders.map((row, i) => (
          <OrderRowView key={i} order={row} maxAmount={sideMaxAmount} />
        ))}
      </div>
    </ScrollArea>
  );
};

const RecentTradeTable: React.FC<{ trades: TradeRow[] }> = ({ trades }) => {
  if (trades.length === 0) {
    return (
      <div className="flex items-center justify-center h-20 text-sm text-white/40">
        No recent trades
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {trades.map((trade, i) => (
        <div
          key={i}
          className="grid grid-cols-12 h-6 gap-6 items-center text-sm hover:bg-white/5 transition-colors min-w-[320px]"
        >
          <div className="col-span-3 text-start text-white/90 shrink-0">
            {trade.time}
          </div>
          <div
            className={`col-span-3 text-left font-semibold z-10 shrink-0 ${
              trade.type === "Lend" ? "text-[#ff5b5b]" : "text-[#3de57a]"
            }`}
          >
            {trade.type}
          </div>
          <div className="col-span-3 text-right text-white/90 z-10 shrink-0">
            {formatAmount(trade.amount)}
          </div>
          <div className="col-span-3 text-white/90 text-right z-10 shrink-0">
            {formatAPR(trade.apr)}
          </div>
        </div>
      ))}
    </div>
  );
};

const OrderBookContent: React.FC<{
  borrowOrders: OrderRow[];
  lendOrders: OrderRow[];
}> = ({ borrowOrders, lendOrders }) => {
  // Sort borrow: highest APR first (descending) — rate paling besar di atas
  const sortedBorrow = [...borrowOrders].sort((a, b) => b.apr - a.apr);
  // Sort lend: highest APR first (descending) — rate paling besar di atas
  const sortedLend = [...lendOrders].sort((a, b) => b.apr - a.apr);

  // Best borrow = lowest APR (bottom of borrow list)
  const bestBorrowApr = sortedBorrow[sortedBorrow.length - 1]?.apr;
  // Best lend = highest APR (top of lend list)
  const bestLendApr = sortedLend[0]?.apr;

  const midApr =
    bestBorrowApr != null && bestLendApr != null
      ? (bestBorrowApr + bestLendApr) / 2
      : undefined;
  const spreadApr =
    bestBorrowApr != null && bestLendApr != null
      ? Math.abs(bestBorrowApr - bestLendApr)
      : undefined;

  return (
    <>
      <div className="mt-2.5 grid grid-cols-12 mb-3 text-sm">
        <div className="col-span-6 text-white/80 text-start font-semibold pl-2">
          APR
        </div>
        <div className="col-span-6 text-white/80 font-semibold text-right pr-2">
          Amount
        </div>
      </div>

      {/* LEND (Asks) — rate paling besar → kecil (bottom-aligned) */}
      <OrderTable orders={sortedLend} align="bottom" />

      {/* MID APR */}
      {midApr != null && spreadApr != null && (
        <div className="my-2 bg-white/5 rounded-md h-9 flex items-center justify-between px-4 border border-white/5">
          <div className="inline-flex items-center gap-2 text-[#3de57a] font-medium">
            <ArrowUp color="#3de57a" size={16} />
            <span>{formatAPR(midApr)}</span>
          </div>
          <div className="text-white/70 text-xs sm:text-sm">
            Spread : {(spreadApr * 100).toFixed(2)}%
          </div>
        </div>
      )}

      {/* BORROW (Bids) — rate paling besar → kecil (top-aligned) */}
      <OrderTable orders={sortedBorrow} align="top" />
    </>
  );
};

const RecentTradesContent: React.FC<{
  trades: TradeRow[];
}> = ({ trades }) => (
  <div className="overflow-auto max-h-[400px]">
    <div className="min-w-max">
      <div className="mt-2.5 grid grid-cols-12 gap-6 mb-3 text-sm min-w-[320px]">
        <div className="col-span-3 text-white/80 font-semibold shrink-0">
          Time
        </div>
        <div className="col-span-3 text-white/80 font-semibold shrink-0">
          Type
        </div>
        <div className="col-span-3 text-white/80 text-right font-semibold shrink-0">
          Amount
        </div>
        <div className="col-span-3 text-white/80 text-right font-semibold shrink-0">
          APR
        </div>
      </div>

      <RecentTradeTable trades={trades} />
    </div>
  </div>
);

export const OrderBookCard: React.FC<{
  height?: string;
  assetId?: string;
  decimals?: number;
}> = ({ height = "auto", assetId, decimals }) => {
  const { borrowOrders, lendOrders } = useOrderbook({ assetId, decimals });
  const { trades } = useRecentTrades({ assetId, decimals });

  return (
    <div
      className="bg-white/5 rounded-md p-3 sm:p-4 md:p-[18px]"
      style={{ height }}
    >
      <Tabs defaultValue="orderbook" className="w-full">
        <TabsList className="bg-white/5 w-full">
          <TabsTrigger
            value="orderbook"
            className="data-[state=active]:border-none!"
          >
            Order Book
          </TabsTrigger>
          <TabsTrigger
            value="trades"
            className="data-[state=active]:border-none!"
          >
            Recent Trades
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orderbook">
          <OrderBookContent
            borrowOrders={borrowOrders}
            lendOrders={lendOrders}
          />
        </TabsContent>

        <TabsContent value="trades">
          <RecentTradesContent trades={trades} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
