"use client";

import React, { useMemo } from "react";
import {
  Area,
  AreaChart,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import type { LendBorrowChartPoint } from "@/lib/api";

interface ChartDataPoint {
  date: string;
  supply: number;
  borrow: number;
}

interface LendBorrowChartProps {
  data?: LendBorrowChartPoint[];
}

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
        <p className="text-white text-sm font-medium">{date}</p>
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

export default function LendBorrowChart({ data = [] }: LendBorrowChartProps) {
  const chartData: ChartDataPoint[] = useMemo(
    () =>
      data.map((item) => ({
        date: format(new Date(item.date), "d MMM"),
        supply: Number(item.lendAmount) || 0,
        borrow: Number(item.borrowAmount) || 0,
      })),
    [data]
  );

  if (chartData.length === 0) {
    return (
      <div className="w-full h-[180px] flex items-center justify-center text-sm text-white/40">
        No chart data
      </div>
    );
  }

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
