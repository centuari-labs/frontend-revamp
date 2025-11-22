"use client";

import React from "react";
import { gsap } from "gsap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ArrowUp } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";

type OrderRow = {
  price: number;
  apr: number;
  amount: number;
  side: "buy" | "sell";
};

const formatPrice = (price: number): string => `$${price.toFixed(3)}`;
const formatAPR = (apr: number): string => `${(apr * 100).toFixed(2)}%`;
const formatAmount = (amount: number): string =>
  amount.toLocaleString(undefined, { maximumFractionDigits: 0 });

// ===================== DATA =====================
const sellOrders: OrderRow[] = [
  { price: 1.005, apr: 0.0482, amount: 12000, side: "sell" },
  { price: 1.004, apr: 0.048, amount: 8500, side: "sell" },
  { price: 1.003, apr: 0.0477, amount: 15200, side: "sell" },
  { price: 1.002, apr: 0.0475, amount: 10400, side: "sell" },
  { price: 1.001, apr: 0.0473, amount: 6250, side: "sell" },
  { price: 1.0, apr: 0.047, amount: 18900, side: "sell" },
  { price: 0.999, apr: 0.0469, amount: 7200, side: "sell" },
];

const buyOrders: OrderRow[] = [
  { price: 0.999, apr: 0.0468, amount: 14300, side: "buy" },
  { price: 0.998, apr: 0.0465, amount: 10800, side: "buy" },
  { price: 0.997, apr: 0.0462, amount: 19500, side: "buy" },
  { price: 0.996, apr: 0.0459, amount: 12700, side: "buy" },
  { price: 0.995, apr: 0.0455, amount: 17900, side: "buy" },
  { price: 0.994, apr: 0.0453, amount: 9000, side: "buy" },
  { price: 0.993, apr: 0.0451, amount: 7200, side: "buy" },
];

function withCumulative(rows: OrderRow[]) {
  let acc = 0;
  return rows.map((r) => {
    const prev = acc;
    acc += r.amount;
    return { row: r, cum: acc, prevCum: prev };
  });
}
function sideMaxCumulative(rows: { cum: number }[]) {
  return Math.max(...rows.map((r) => r.cum), 1);
}

const OrderRowView: React.FC<{
  order: OrderRow;
  maxAmount: number;
  cum: number;
  prevCum: number;
  sideMaxCum: number;
}> = ({ order, maxAmount, cum, prevCum, sideMaxCum }) => {
  const isSell = order.side === "sell";
  const cumPct = (cum / sideMaxCum) * 100;

  const cumRef = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    if (!cumRef.current) return;
    gsap.to(cumRef.current, {
      width: `${cumPct}%`,
      duration: 0.6,
      ease: "power3.out",
    });
  }, [cumPct]);

  return (
    <div className="relative grid grid-cols-12 h-6 items-center text-sm hover:bg-white/5 transition-colors overflow-hidden">
      {/* Depth background full row (align ke kanan/kiri tergantung side) */}
      <div
        ref={cumRef}
        className={`absolute inset-y-0 right-0 ${
          isSell ? "bg-[rgba(255,59,68,0.15)]" : "bg-[rgba(61,229,122,0.15)]"
        }`}
        style={{ width: "0%" }}
      />

      {/* Price */}
      <div
        className={`col-span-4 font-semibold tracking-tight z-10 ${
          isSell ? "text-[#ff5b5b]" : "text-[#3de57a]"
        }`}
      >
        {formatPrice(order.price)}
      </div>

      {/* APR */}
      <div className="col-span-4 text-center text-white/90 z-10">
        {formatAPR(order.apr)}
      </div>

      {/* Amount */}
      <div
        className={`col-span-4 text-right font-semibold tracking-tight pr-2 z-10 ${
          isSell ? "text-[#ffd6d6]" : "text-white/80"
        }`}
      >
        {formatAmount(order.amount)}
      </div>
    </div>
  );
};

const OrderTable: React.FC<{ orders: OrderRow[]; maxAmount: number }> = ({
  orders,
  maxAmount,
}) => {
  const cumRows = withCumulative(orders);
  const sideMax = sideMaxCumulative(cumRows);
  return (
    <ScrollArea className="space-y-0.5 h-[160px]">
      {cumRows.map(({ row, cum, prevCum }, i) => (
        <OrderRowView
          key={i}
          order={row}
          maxAmount={maxAmount}
          cum={cum}
          prevCum={prevCum}
          sideMaxCum={sideMax}
        />
      ))}
    </ScrollArea>
  );
};

const RecentTradeTable: React.FC = () => {
  // Dummy data for recent trades
  const recentTrades = [
    { time: "11:42:35", type: "Buy", amount: 5000, apr: 0.047 },
    { time: "11:42:36", type: "Sell", amount: 3000, apr: 0.048 },
    { time: "11:42:37", type: "Buy", amount: 7000, apr: 0.0465 },
    { time: "11:42:38", type: "Sell", amount: 4000, apr: 0.049 },
    { time: "11:42:39", type: "Buy", amount: 6000, apr: 0.0458 },
    { time: "11:42:39", type: "Buy", amount: 6000, apr: 0.0458 },
    { time: "11:42:39", type: "Buy", amount: 6000, apr: 0.0458 },
    { time: "11:42:39", type: "Buy", amount: 6000, apr: 0.0458 },
    { time: "11:42:39", type: "Buy", amount: 6000, apr: 0.0458 },
    { time: "11:42:39", type: "Buy", amount: 6000, apr: 0.0458 },
    { time: "11:42:39", type: "Buy", amount: 6000, apr: 0.0458 },
    { time: "11:42:39", type: "Buy", amount: 6000, apr: 0.0458 },
    { time: "11:42:39", type: "Buy", amount: 6000, apr: 0.0458 },
    { time: "11:42:39", type: "Buy", amount: 6000, apr: 0.0458 },
    { time: "11:42:39", type: "Buy", amount: 6000, apr: 0.0458 },
    { time: "11:42:39", type: "Buy", amount: 6000, apr: 0.0458 },
    { time: "11:42:39", type: "Buy", amount: 6000, apr: 0.0458 },
  ];

  return (
    <ScrollArea className="space-y-0.5 h-[350px]">
      {recentTrades.map((trade, i) => (
        <div
          key={i}
          className="grid grid-cols-12 h-6 gap-6 items-center text-sm hover:bg-white/5 transition-colors"
        >
          <div className="col-span-3 text-start text-white/90">
            {trade.time}
          </div>
          <div
            className={`col-span-3 text-center font-semibold z-10 ${
              trade.type === "Buy" ? "text-[#3de57a]" : "text-[#ff5b5b]"
            }`}
          >
            {trade.type}
          </div>
          <div className="col-span-3 text-white/90 z-10">
            {formatAmount(trade.amount)}
          </div>
          <div className="col-span-3 text-white/90 z-10">
            {formatAPR(trade.apr)}
          </div>
        </div>
      ))}
    </ScrollArea>
  );
};

const OrderBookContent: React.FC = () => {
  const allOrders = [...sellOrders, ...buyOrders];
  const maxAmount = Math.max(...allOrders.map((o) => o.amount));

  const midPrice = 1.0;
  const spread = 0.001;

  return (
    <>
      <div className="mt-2.5 grid grid-cols-12 mb-3 text-sm">
        <div className="col-span-4 text-white/80 text-start font-semibold">
          Price
        </div>
        <div className="col-span-4 text-white/80 font-semibold text-center">
          APR
        </div>
        <div className="col-span-4 text-white/80 font-semibold text-right">
          Amount
        </div>
      </div>

      {/* SELL */}
      <OrderTable orders={sellOrders} maxAmount={maxAmount} />

      {/* MID */}
      <div className="my-2 bg-white/5 rounded-md h-9 flex items-center justify-between px-4">
        <div className="inline-flex items-center gap-2 text-[#3de57a] font-medium">
          <ArrowUp color="#3de57a" size={16} />
          <span>${midPrice.toFixed(1)}</span>
        </div>
        <div className="text-white/70">Spread : ${spread.toFixed(3)}</div>
      </div>

      {/* BUY */}
      <OrderTable orders={buyOrders} maxAmount={maxAmount} />
    </>
  );
};

const RecentTradesContent: React.FC = () => {
  return (
    <>
      <div className="mt-2.5 grid grid-cols-12 gap-6 mb-3 text-sm">
        <div className="col-span-3 text-white/80 font-semibold">
          Time
        </div>
        <div className="col-span-3 text-white/80 font-semibold">
          Type
        </div>
        <div className="col-span-3 text-white/80 font-semibold">
          Amount
        </div>
        <div className="col-span-3 text-white/80 font-semibold">
          APR
        </div>
      </div>

      <RecentTradeTable />
    </>
  );
};

export const OrderBookCard: React.FC<{ height?: string }> = ({
  height = "auto",
}) => (
  <div
    className="bg-white/5 rounded-md p-3 sm:p-4 md:p-[18px]"
    style={{ height }}
  >
    <Tabs defaultValue="orderbook" className="w-full">
      <TabsList className="bg-white/5 w-full">
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
        <OrderBookContent />
      </TabsContent>

      <TabsContent value="trades">
        <RecentTradesContent />
      </TabsContent>
    </Tabs>
  </div>
);
