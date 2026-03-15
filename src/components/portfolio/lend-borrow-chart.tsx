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
  { date: "1 Oct", supply: 5000, borrow: 2000 },
  { date: "4 Oct", supply: 5200, borrow: 2100 },
  { date: "7 Oct", supply: 5500, borrow: 2200 },
  { date: "10 Oct", supply: 5400, borrow: 2300 },
  { date: "13 Oct", supply: 6800, borrow: 2500 },
  { date: "16 Oct", supply: 7200, borrow: 2600 },
  { date: "19 Oct", supply: 7000, borrow: 2800 },
  // { date: "22 Oct", supply: 8500, borrow: 3000 },
  // { date: "25 Oct", supply: 9200, borrow: 3200 },
  // { date: "28 Oct", supply: 9000, borrow: 3400 },
  // { date: "31 Oct", supply: 12000, borrow: 3600 },
  // { date: "3 Nov", supply: 14500, borrow: 3800 },
  // { date: "6 Nov", supply: 16000, borrow: 4200 },
  // { date: "9 Nov", supply: 18500, borrow: 4500 },
  // { date: "12 Nov", supply: 22000, borrow: 5000 },
  // { date: "15 Nov", supply: 25000, borrow: 5500 },
  // { date: "18 Nov", supply: 28000, borrow: 6000 },
  // { date: "21 Nov", supply: 32000, borrow: 6800 },
  // { date: "24 Nov", supply: 35000, borrow: 7200 },
  // { date: "27 Nov", supply: 38000, borrow: 7800 },
  // { date: "30 Nov", supply: 36000, borrow: 8200 },
  // { date: "3 Dec", supply: 40000, borrow: 8800 },
  // { date: "6 Dec", supply: 42000, borrow: 9200 },
  // { date: "8 Dec", supply: 41000, borrow: 9500 },
  // { date: "10 Dec", supply: 43000, borrow: 9800 },
  // { date: "11 Dec", supply: 45000, borrow: 10200 },
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
      <div className="bg-white/10 backdrop-blur-[24px] rounded-xl px-4 py-3 shadow-xl border border-white/20">
        <p className="text-white text-sm font-medium">{date} 2025</p>
        <div className="border-t border-dashed border-white/20 my-2" />
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-10">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#517FFF]"></div>
              <span className="text-white/70 text-sm">Supply</span>
            </div>
            <span className="text-white font-medium text-sm">
              $
              {supplyValue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="flex items-center justify-between gap-10">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#EF336F]"></div>
              <span className="text-white/70 text-sm">Borrow</span>
            </div>
            <span className="text-white font-medium text-sm">
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
                offset="0%"
                stopColor="rgba(51, 97, 239)"
                stopOpacity={0.5}
              />
              <stop
                offset="90.3%"
                stopColor="rgba(51, 97, 239)"
                stopOpacity={0}
              />
            </linearGradient>
            <linearGradient id="borrowGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="#EF336F"
                stopOpacity={0.5}
              />
              <stop
                offset="90.3%"
                stopColor="#EF336F"
                stopOpacity={0}
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
            stroke="#EF336F"
            strokeWidth={2}
            fill="url(#borrowGradient)"
            fillOpacity={1}
            dot={false}
            activeDot={{ r: 5, fill: "white", stroke: "#EF336F", strokeWidth: 3 }}
          />

          <Area
            type="monotone"
            dataKey="supply"
            stroke="#517FFF"
            strokeWidth={1}
            fill="url(#supplyGradient)"
            fillOpacity={1}
            dot={false}
            activeDot={{ r: 5, fill: "white", stroke: "#517FFF", strokeWidth: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
