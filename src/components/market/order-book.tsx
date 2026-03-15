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
  const widthPct =
    maxAmount > 0 ? (order.amount / maxAmount) * 100 : 0;

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
      {/* Per-row liquidity bar — anchored left */}
      <div
        ref={barRef}
        className={`absolute inset-y-0 left-0 ${isBorrow
          ? "bg-[rgba(255,59,68,0.18)]"
          : "bg-[rgba(61,229,122,0.18)]"
          }`}
        style={{ width: "0%" }}
      />

      {/* APR */}
      <div
        className={`col-span-6 pl-2 font-semibold tracking-tight z-10 ${isBorrow ? "text-[#ff5b5b]" : "text-[#3de57a]"
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

const OrderTable: React.FC<{ orders: OrderRow[] }> = ({ orders }) => {
  const sideMaxAmount = Math.max(...orders.map((o) => o.amount), 1);

  if (orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-[195px] text-sm text-white/40">
        No data
      </div>
    );
  }

  return (
    <ScrollArea className="space-y-0.5 h-[195px]">
      {orders.map((row, i) => (
        <OrderRowView
          key={i}
          order={row}
          maxAmount={sideMaxAmount}
        />
      ))}
    </ScrollArea>
  );
};

const RecentTradeTable: React.FC<{ trades: TradeRow[] }> = ({ trades }) => {
  return (
    <div className="space-y-0.5">
      {trades.map((trade, i) => (
        <div
          key={i}
          className="grid grid-cols-12 h-6 items-center text-sm hover:bg-white/5 transition-colors"
        >
          <div className="col-span-3 text-start text-white/90 shrink-0">
            {trade.time}
          </div>
          <div
            className={`col-span-3 text-left font-semibold z-10 shrink-0 ${trade.type === "Lend" ? "text-[#3de57a]" : "text-[#ff5b5b]"
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
  // Sort borrow: highest APR first (descending) — the highest rate above
  // Limited to 10 best levels (lowest rates) which are at the end of the descending sorted list
  const sortedBorrow = [...borrowOrders]
    .sort((a, b) => b.apr - a.apr)
    .slice(-10);

  // Sort lend: highest APR first (descending) — the highest rate above
  // Limited to 10 best levels (highest rates) which are at the top of the descending sorted list
  const sortedLend = [...lendOrders]
    .sort((a, b) => b.apr - a.apr)
    .slice(0, 10);

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

      {/* BORROW — rate paling besar → kecil */}
      <OrderTable orders={sortedBorrow} />

      {/* MID APR */}
      {midApr != null && spreadApr != null && (
        <div className="my-2 bg-white/5 rounded-md h-9 flex items-center justify-between px-4">
          <div className="inline-flex items-center gap-2 text-[#3de57a] font-medium">
            <ArrowUp color="#3de57a" size={16} />
            <span>{formatAPR(midApr)}</span>
          </div>
          <div className="text-white/70 text-xs sm:text-sm">
            Spread : {(spreadApr * 100).toFixed(2)}%
          </div>
        </div>
      )}

      {/* LEND — rate paling besar → kecil */}
      <OrderTable orders={sortedLend} />
    </>
  );
};

const RecentTradesContent: React.FC<{
  trades: TradeRow[];
  cardRef: React.RefObject<HTMLDivElement | null>;
}> = ({ trades, cardRef }) => {
  const headerRef = React.useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = React.useState<number>(0);

  React.useEffect(() => {
    const card = cardRef.current;
    const header = headerRef.current;
    if (!card) return;

    // Find TabsList element height
    const tabsList = card.querySelector('[data-slot="tabs-list"]');

    const recalc = () => {
      const cardH = card.clientHeight;
      const cardPadding = parseFloat(getComputedStyle(card).paddingTop) + parseFloat(getComputedStyle(card).paddingBottom);
      const tabsH = tabsList?.getBoundingClientRect().height ?? 0;
      const headerH = header?.offsetHeight ?? 0;
      // gap-2 from Tabs = 8px, mt-2.5 from header = 10px, mb-3 = 12px
      const gaps = 8 + 8;
      setListHeight(Math.max(cardH - cardPadding - tabsH - headerH - gaps, 0));
    };

    const observer = new ResizeObserver(recalc);
    observer.observe(card);
    recalc();
    return () => observer.disconnect();
  }, [cardRef]);

  return (
    <>
      <div ref={headerRef} className="mt-2.5 grid grid-cols-12 mb-3 text-sm text-center">
        <div className="col-span-3 text-white/80 font-semibold">
          Time
        </div>
        <div className="col-span-3 text-white/80 font-semibold">
          Type
        </div>
        <div className="col-span-3 text-white/80 font-semibold">
          Amount
        </div>
        <div className="col-span-3 text-white/80 text-right font-semibold">
          APR
        </div>
      </div>

      {trades.length === 0 ? (
        <div
          className="flex items-center justify-center text-sm text-white/40"
          style={{ height: listHeight || undefined }}
        >
          No recent trades
        </div>
      ) : (
        <div
          className="overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/40"
          style={{ height: listHeight || undefined }}
        >
          <RecentTradeTable trades={trades} />
        </div>
      )}
    </>
  );
};

export const OrderBookCard: React.FC<{
  height?: string;
  assetId?: string;
  decimals?: number;
}> = ({
  height = "auto",
  assetId,
  decimals,
}) => {
    const { borrowOrders, lendOrders } = useOrderbook({ assetId, decimals });
    const { trades } = useRecentTrades({ assetId, decimals });
    const cardRef = React.useRef<HTMLDivElement>(null);

    return (
      <div
        ref={cardRef}
        className="bg-white/5 rounded-md p-3 sm:p-4 md:p-[18px]`"
        style={{ height }}
      >
        <Tabs defaultValue="orderbook" className="w-full">
          <TabsList className="bg-white/5 w-full shrink-0">
            <TabsTrigger
              value="orderbook"
              className="data-[state=active]:!border-none"
            >
              Order Book
            </TabsTrigger>
            <TabsTrigger
              value="trades"
              className="data-[state=active]:!border-none"
            >
              Recent Trades
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orderbook">
            <OrderBookContent borrowOrders={borrowOrders} lendOrders={lendOrders} />
          </TabsContent>

          <TabsContent value="trades">
            <RecentTradesContent trades={trades} cardRef={cardRef} />
          </TabsContent>
        </Tabs>
      </div>
    );
  };
