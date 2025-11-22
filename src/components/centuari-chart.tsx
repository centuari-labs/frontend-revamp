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
        <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-2xl px-4 py-2 shadow-2xl">
          <p className="text-slate-400 text-sm mb-1 font-light">
            {payload[0].payload.date}
          </p>
          <div className="absolute inset-x-0 h-px w-1/2 mx-auto top-0 shadow-2xl bg-gradient-to-r from-transparent via-white/50 to-transparent" />
          <p className="text-white text-xl font-light">{payload[0].value}%</p>
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
        <circle cx={cx} cy={cy} r={20} fill="#517FFF" opacity={0.2} />
        <circle cx={cx} cy={cy} r={12} fill="#517FFF" opacity={0.4} />
        <circle cx={cx} cy={cy} r={6} fill="#ffffff" />
      </g>
    );
  }
  return null;
};

export function CentuariChart() {
  return (
    <div className="h-96 mt-10">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3361EF80" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3361EF80" stopOpacity={0.1} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#3361EF80"
            vertical={false}
            horizontal={true}
          />

          <XAxis
            dataKey="date"
            stroke="#FFFFFF"
            tick={{ fill: "#FFFFFF", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />

          <YAxis
            stroke="#3361EF80"
            tick={{ fill: "#FFFFFF", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
            ticks={[0, 20, 40, 60, 80, 100]}
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{
              stroke: "#3361EF80",
              strokeWidth: 2,
              strokeDasharray: "5 5",
            }}
            position={{ y: 0 }}
          />

          <Area
            type="monotone"
            dataKey="value"
            stroke="#517FFF"
            strokeWidth={3}
            fill="url(#colorValue)"
            dot={false}
            activeDot={<CustomDot />}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
