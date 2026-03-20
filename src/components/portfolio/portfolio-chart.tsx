"use client";

import * as React from "react";
import { Label, Pie, PieChart } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export const description = "A donut chart with text";

interface PortfolioChartProps {
  availableBalance?: number;
  suppliedAssets?: number;
  borrowedAssets?: number;
  totalValue?: number;
}

const defaultChartData = [
  { name: "segment1", visitors: 630, fill: "#2A4AC2" },
  { name: "segment2", visitors: 250, fill: "#AAC7F9" },
  { name: "segment3", visitors: 150, fill: "#4F8FFD" },
];

const chartConfig = {
  value: {
    label: "Value",
  },
  segment1: {
    label: "Available Balance",
    color: "#2A4AC2",
  },
  segment2: {
    label: "Supplied Assets",
    color: "#AAC7F9",
  },
  segment3: {
    label: "Borrowed Assets",
    color: "#4F8FFD",
  },
} satisfies ChartConfig;

export function PortfolioChart({ availableBalance, suppliedAssets, borrowedAssets, totalValue }: PortfolioChartProps = {}) {
  const chartData = React.useMemo(() => {
    if (availableBalance !== undefined && suppliedAssets !== undefined && borrowedAssets !== undefined) {
      const hasData = availableBalance > 0 || suppliedAssets > 0 || borrowedAssets > 0;
      if (!hasData) {
        return [{ name: "segment1", visitors: 1, fill: "#ffffff10" }];
      }
      return [
        { name: "segment1", visitors: availableBalance, fill: "#2A4AC2" },
        { name: "segment2", visitors: suppliedAssets, fill: "#AAC7F9" },
        { name: "segment3", visitors: borrowedAssets, fill: "#4F8FFD" },
      ];
    }
    return defaultChartData;
  }, [availableBalance, suppliedAssets, borrowedAssets]);

  const total = React.useMemo(() => {
    if (totalValue !== undefined) return totalValue;
    return chartData.reduce((acc, curr) => acc + curr.visitors, 0);
  }, [totalValue, chartData]);

  return (
    <div className="relative flex items-center justify-center w-full max-w-[280px] mx-auto">
      <ChartContainer
        config={chartConfig}
        className="aspect-square w-full max-h-[220px]"
        style={{
          filter:
            "drop-shadow(0 0 40px rgba(98, 149, 255, 0.3)) drop-shadow(0 0 80px rgba(42, 74, 194, 0.2))",
        }}
      >
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Pie
            data={chartData}
            dataKey="visitors"
            nameKey="browser"
            innerRadius="65%"
            strokeWidth={5}
            legendType="circle"
            paddingAngle={-10}
            cornerRadius={10}
          >
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={viewBox.cy}
                        className="fill-foreground text-xl font-bold"
                      >
                        {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(total)}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 24}
                        className="fill-muted-foreground text-xs"
                      >
                        Total Value
                      </tspan>
                    </text>
                  );
                }
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>
    </div>
  );
}
