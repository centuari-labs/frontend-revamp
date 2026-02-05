"use client";

import React from "react";
import { gsap } from "gsap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ArrowUp } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";

type OrderRow = {
  apr: number;
  amount: number;
  side: "lend" | "borrow";
};

const formatAPR = (apr: number): string => `${(apr * 100).toFixed(2)}%`;
const formatAmount = (amount: number): string =>
  amount.toLocaleString(undefined, { maximumFractionDigits: 0 });

// ===================== DATA =====================
const borrowOrders: OrderRow[] = [
  { apr: 0.0482, amount: 21000, side: "borrow" },
  { apr: 0.048, amount: 18000, side: "borrow" },
  { apr: 0.0477, amount: 15000, side: "borrow" },
  { apr: 0.0475, amount: 12000, side: "borrow" },
  { apr: 0.0473, amount: 9000, side: "borrow" },
  { apr: 0.047, amount: 6500, side: "borrow" },
  { apr: 0.0469, amount: 4500, side: "borrow" },
];

const lendOrders: OrderRow[] = [
  { apr: 0.0468, amount: 3500, side: "lend" },
  { apr: 0.0465, amount: 5000, side: "lend" },
  { apr: 0.0462, amount: 7000, side: "lend" },
  { apr: 0.0459, amount: 9000, side: "lend" },
  { apr: 0.0455, amount: 12000, side: "lend" },
  { apr: 0.0453, amount: 15000, side: "lend" },
  { apr: 0.0451, amount: 18000, side: "lend" },
];

function withCumulative(rows: OrderRow[]) {
  let acc = 0;
  return rows.map((row) => {
    acc += row.amount;
    return { row, cum: acc };
  });
}

function sideMaxCumulative(rows: { cum: number }[]) {
  return Math.max(...rows.map((r) => r.cum), 1);
}

function randomizeOrder(order: OrderRow, side: OrderRow["side"]): OrderRow {
  // Small APR delta so values wiggle realistically
  const aprDelta = (Math.random() - 0.5) * 0.0008;
  let nextApr = order.apr + aprDelta;

  // Clamp APR to a plausible band
  const minApr = side === "borrow" ? 0.0465 : 0.0445;
  const maxApr = side === "borrow" ? 0.0495 : 0.0475;
  nextApr = Math.min(Math.max(nextApr, minApr), maxApr);

  // Slightly vary amounts
  const factor = 0.97 + Math.random() * 0.06; // ~±3%
  let nextAmount = Math.round(order.amount * factor);
  nextAmount = Math.min(Math.max(nextAmount, 2500), 25000);

  return {
    ...order,
    apr: nextApr,
    amount: nextAmount,
  };
}

function generateRandomOrder(
  side: OrderRow["side"],
  anchorApr?: number,
): OrderRow {
  const baseAprDefault = side === "borrow" ? 0.0478 : 0.0462;
  const baseApr = anchorApr ?? baseAprDefault;
  const jitter = (Math.random() - 0.5) * 0.0012;
  let apr = baseApr + jitter;

  const minApr = side === "borrow" ? 0.0465 : 0.0445;
  const maxApr = side === "borrow" ? 0.0495 : 0.0475;
  apr = Math.min(Math.max(apr, minApr), maxApr);

  const amount =
    5000 +
    Math.round(Math.random() * (side === "borrow" ? 15000 : 13000));

  return { apr, amount, side };
}

function updateOrders(
  prev: OrderRow[],
  side: OrderRow["side"],
): OrderRow[] {
  let updated = prev.map((o) => randomizeOrder(o, side));

  // Occasionally inject a new order at the top and drop one at the bottom
  if (Math.random() < 0.45) {
    const bestApr =
      side === "borrow"
        ? Math.min(...updated.map((o) => o.apr))
        : Math.max(...updated.map((o) => o.apr));
    const fresh = generateRandomOrder(side, bestApr);

    // For borrow, lowest APR (best for borrowers) should update first,
    // so push new liquidity near the bottom; for lend, highest APR first,
    // so push new liquidity near the top.
    if (side === "borrow") {
      updated = [...updated, fresh];
    } else {
      updated = [fresh, ...updated];
    }

    if (updated.length > prev.length) {
      // Trim from the opposite side of where we inserted
      if (side === "borrow") {
        updated.shift();
      } else {
        updated.pop();
      }
    }
  }

  // Keep plausible ordering by APR per side (highest APR first)
  updated.sort((a, b) => b.apr - a.apr);

  // Give a bit more motion to the edge that should move "first":
  // - Lend: highest APR row (index 0)
  // - Borrow: lowest APR row (last index)
  if (updated.length > 0) {
    const edgeIndex = side === "borrow" ? updated.length - 1 : 0;
    const edge = updated[edgeIndex];
    const edgeAprDelta = (Math.random() - 0.5) * 0.0015;
    let edgeApr = edge.apr + edgeAprDelta;
    const minApr = side === "borrow" ? 0.0465 : 0.0445;
    const maxApr = side === "borrow" ? 0.0495 : 0.0475;
    edgeApr = Math.min(Math.max(edgeApr, minApr), maxApr);
    const edgeAmountFactor = 0.95 + Math.random() * 0.15;
    updated[edgeIndex] = {
      ...edge,
      apr: edgeApr,
      amount: Math.round(edge.amount * edgeAmountFactor),
    };
  }

  return updated;
}

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
    <div className="relative grid grid-cols-12 h-6 items-center text-sm hover:bg-white/5 transition-colors overflow-hidden">
      {/* Per-row liquidity bar (no cumulative) */}
      <div
        ref={barRef}
        className={`absolute inset-y-0 ${
          isBorrow
            ? "right-0 bg-[rgba(255,59,68,0.15)]"
            : "right-0 bg-[rgba(61,229,122,0.15)]"
        }`}
        style={{ width: "0%" }}
      />

      {/* APR */}
      <div
        className={`col-span-6 font-semibold tracking-tight z-10 ${
          isBorrow ? "text-[#ff5b5b]" : "text-[#3de57a]"
        }`}
      >
        {formatAPR(order.apr)}
      </div>

      {/* Amount */}
      <div
        className={`col-span-6 text-right font-semibold tracking-tight pr-2 z-10 ${
          isBorrow ? "text-[#ffd6d6]" : "text-white/80"
        }`}
      >
        {formatAmount(order.amount)}
      </div>
    </div>
  );
};

const OrderTable: React.FC<{ orders: OrderRow[] }> = ({ orders }) => {
  const sideMaxAmount = Math.max(...orders.map((o) => o.amount), 1);
  return (
    <ScrollArea className="space-y-0.5 h-[160px]">
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

const RecentTradeTable: React.FC = () => {
  // Dummy data for recent trades
  const recentTrades = [
    { time: "11:42:35", type: "Lend", amount: 5000, apr: 0.047 },
    { time: "11:42:36", type: "Borrow", amount: 3000, apr: 0.048 },
    { time: "11:42:37", type: "Lend", amount: 7000, apr: 0.0465 },
    { time: "11:42:38", type: "Borrow", amount: 4000, apr: 0.049 },
    { time: "11:42:39", type: "Lend", amount: 6000, apr: 0.0458 },
    { time: "11:42:39", type: "Lend", amount: 6000, apr: 0.0458 },
    { time: "11:42:39", type: "Lend", amount: 6000, apr: 0.0458 },
    { time: "11:42:39", type: "Lend", amount: 6000, apr: 0.0458 },
    { time: "11:42:39", type: "Lend", amount: 6000, apr: 0.0458 },
    { time: "11:42:39", type: "Lend", amount: 6000, apr: 0.0458 },
    { time: "11:42:39", type: "Lend", amount: 6000, apr: 0.0458 },
    { time: "11:42:39", type: "Lend", amount: 6000, apr: 0.0458 },
    { time: "11:42:39", type: "Lend", amount: 6000, apr: 0.0458 },
    { time: "11:42:39", type: "Lend", amount: 6000, apr: 0.0458 },
    { time: "11:42:39", type: "Lend", amount: 6000, apr: 0.0458 },
    { time: "11:42:39", type: "Lend", amount: 6000, apr: 0.0458 },
    { time: "11:42:39", type: "Lend", amount: 6000, apr: 0.0458 },
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
              trade.type === "Lend" ? "text-[#3de57a]" : "text-[#ff5b5b]"
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
  const [borrowState, setBorrowState] = React.useState(borrowOrders);
  const [lendState, setLendState] = React.useState(lendOrders);

  const allOrders = [...borrowState, ...lendState];
  const maxAmount = Math.max(...allOrders.map((o) => o.amount));

  const topBorrowApr = borrowState[borrowState.length - 1]?.apr;
  const topLendApr = lendState[0]?.apr;
  const midApr =
    topBorrowApr != null && topLendApr != null
      ? (topBorrowApr + topLendApr) / 2
      : undefined;
  const spreadApr =
    topBorrowApr != null && topLendApr != null
      ? Math.abs(topBorrowApr - topLendApr)
      : undefined;

  React.useEffect(() => {
    const interval = setInterval(() => {
      setBorrowState((prev) => updateOrders(prev, "borrow"));
      setLendState((prev) => updateOrders(prev, "lend"));
    }, 1100);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="mt-2.5 grid grid-cols-12 mb-3 text-sm">
        <div className="col-span-6 text-white/80 text-start font-semibold">
          APR
        </div>
        <div className="col-span-6 text-white/80 font-semibold text-right">
          Amount
        </div>
      </div>

      {/* BORROW */}
      <OrderTable orders={borrowState} />

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

      {/* LEND */}
      <OrderTable orders={lendState} />
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
