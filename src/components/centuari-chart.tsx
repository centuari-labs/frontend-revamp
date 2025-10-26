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
import { Card } from "@/components/ui/card";

const chartData = [
  { date: "1 Oct", value: 45 },
  { date: "2 Oct", value: 52 },
  { date: "3 Oct", value: 48 },
  { date: "4 Oct", value: 65 },
  { date: "5 Oct", value: 58 },
  { date: "6 Oct", value: 72 },
  { date: "7 Oct", value: 68 },
];

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: any[];
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="relative">
        <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-2xl px-6 py-4 shadow-2xl">
          <p className="text-slate-400 text-sm mb-1 font-light">
            {payload[0].payload.date}
          </p>
          <p className="text-white text-4xl font-light">{payload[0].value}%</p>
        </div>
      </div>
    );
  }
  return null;
};

const CustomDot = (props: {
  cx?: number;
  cy?: number;
  payload?: any;
  dataKey?: string;
}) => {
  const { cx, cy, payload } = props;

  if (props.dataKey === "value") {
    return (
      <g>
        <circle cx={cx} cy={cy} r={20} fill="#10b981" opacity={0.2} />
        <circle cx={cx} cy={cy} r={12} fill="#10b981" opacity={0.4} />
        <circle cx={cx} cy={cy} r={6} fill="#ffffff" />
      </g>
    );
  }
  return null;
};

export function CentuariChart() {
  return (
    <div className="flex items-center justify-center p-8">
      <Card className="w-full max-w-4xl bg-transparent border-transparent p-6">
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#334155"
                vertical={false}
                horizontal={true}
              />

              <XAxis
                dataKey="date"
                stroke="#64748b"
                tick={{ fill: "#64748b", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                stroke="#64748b"
                tick={{ fill: "#64748b", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                ticks={[0, 20, 40, 60, 80, 100]}
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: "#10b981",
                  strokeWidth: 2,
                  strokeDasharray: "5 5",
                }}
                position={{ y: 0 }}
              />

              <Area
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={3}
                fill="url(#colorValue)"
                dot={false}
                activeDot={<CustomDot />}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
