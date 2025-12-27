"use client";

import React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ChartDataPoint {
  date: string;
  supply: number;
  borrow: number;
}

const chartData: ChartDataPoint[] = [
  { date: "1 Oct", supply: 35000, borrow: 8000 },
  { date: "3 Oct", supply: 36200, borrow: 8500 },
  { date: "5 Oct", supply: 38500, borrow: 9200 },
  { date: "7 Oct", supply: 37800, borrow: 9800 },
  { date: "9 Oct", supply: 39500, borrow: 10200 },
  { date: "11 Oct", supply: 41200, borrow: 10800 },
  { date: "13 Oct", supply: 40500, borrow: 11500 },
  { date: "15 Oct", supply: 42800, borrow: 12200 },
  { date: "17 Oct", supply: 44500, borrow: 12800 },
  { date: "19 Oct", supply: 43800, borrow: 13500 },
  { date: "21 Oct", supply: 46200, borrow: 14200 },
  { date: "23 Oct", supply: 48500, borrow: 15000 },
  { date: "25 Oct", supply: 47200, borrow: 15800 },
  { date: "27 Oct", supply: 49800, borrow: 16500 },
  { date: "29 Oct", supply: 52200, borrow: 17200 },
  { date: "31 Oct", supply: 51500, borrow: 18000 },
  { date: "2 Nov", supply: 54200, borrow: 18800 },
  { date: "4 Nov", supply: 56800, borrow: 19500 },
  { date: "6 Nov", supply: 55500, borrow: 20300 },
  { date: "8 Nov", supply: 58200, borrow: 21200 },
  { date: "10 Nov", supply: 60500, borrow: 22000 },
  { date: "12 Nov", supply: 59200, borrow: 22800 },
  { date: "14 Nov", supply: 62000, borrow: 23800 },
  { date: "16 Nov", supply: 64500, borrow: 24500 },
  { date: "18 Nov", supply: 63200, borrow: 25500 },
  { date: "20 Nov", supply: 66200, borrow: 26500 },
  { date: "22 Nov", supply: 68800, borrow: 27500 },
  { date: "24 Nov", supply: 67500, borrow: 28500 },
  { date: "26 Nov", supply: 70500, borrow: 29800 },
  { date: "28 Nov", supply: 73200, borrow: 31200 },
  { date: "30 Nov", supply: 71800, borrow: 32500 },
  { date: "2 Dec", supply: 74800, borrow: 33800 },
  { date: "4 Dec", supply: 77500, borrow: 35200 },
  { date: "6 Dec", supply: 76000, borrow: 36500 },
  { date: "8 Dec", supply: 79200, borrow: 37800 },
  { date: "10 Dec", supply: 82000, borrow: 39200 },
  { date: "11 Dec", supply: 85000, borrow: 42000 },
];

interface TooltipPayload {
  value: number;
  dataKey: string;
  payload: ChartDataPoint;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const date = payload[0].payload.date;
    const supplyValue = payload.find((p) => p.dataKey === "supply")?.value || 0;
    const borrowValue = payload.find((p) => p.dataKey === "borrow")?.value || 0;

    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 shadow-xl border border-slate-600">
        <p className="text-slate-300 text-sm mb-3">{date} 2025</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white border-2 border-blue-500"></div>
              <span className="text-slate-400 text-sm">Supply</span>
            </div>
            <span className="text-slate-200 font-medium">
              $
              {supplyValue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white border-2 border-pink-500"></div>
              <span className="text-slate-400 text-sm">Borrow</span>
            </div>
            <span className="text-slate-200 font-medium">
              $
              {borrowValue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function LendBorrowChart() {
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart
          data={chartData}
          margin={{ top: 0, right: 0, bottom: 0, left: 20 }}
        >
          <defs>
            <linearGradient id="supplyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="hsl(217, 91%, 60%)"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="hsl(217, 91%, 60%)"
                stopOpacity={0.1}
              />
            </linearGradient>
            <linearGradient id="borrowGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="hsl(330, 82%, 55%)"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="hsl(330, 82%, 55%)"
                stopOpacity={0.1}
              />
            </linearGradient>
          </defs>

          {/* <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e293b"
                vertical={false}
              /> */}

          {/* <XAxis
                dataKey="date"
                stroke="#475569"
                tick={{ fill: "#64748b", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              /> */}

          {/* <YAxis
                stroke="#475569"
                tick={{ fill: "#64748b", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) =>
                  `$${(value / 1000).toFixed(0)}k`
                }
              /> */}

          <Tooltip content={<CustomTooltip />} />

          <Area
            type="monotone"
            dataKey="borrow"
            stroke="hsl(330, 82%, 55%)"
            strokeWidth={2}
            fill="url(#borrowGradient)"
            fillOpacity={1}
          />

          <Area
            type="monotone"
            dataKey="supply"
            stroke="hsl(217, 91%, 60%)"
            strokeWidth={2}
            fill="url(#supplyGradient)"
            fillOpacity={1}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
