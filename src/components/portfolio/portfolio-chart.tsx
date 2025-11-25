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

const chartData = [
  { name: "segment1", visitors: 630, fill: "#2A4AC2" },
  { name: "segment2", visitors: 250, fill: "#AAC7F9" },
  { name: "segment3", visitors: 150, fill: "#4F8FFD" },
];

const chartConfig = {
  value: {
    label: "Value",
  },
  segment1: {
    label: "Segment 1",
    color: "#2A4AC2",
  },
  segment2: {
    label: "Segment 2",
    color: "#AAC7F9",
  },
  segment3: {
    label: "Segment 3",
    color: "#4F8FFD",
  },
} satisfies ChartConfig;

export function PortfolioChart() {
  const totalVisitors = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.visitors, 0);
  }, []);

  return (
    <div className="relative">
      <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square max-h-[250px]"
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
            innerRadius={80}
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
                        className="fill-foreground text-2xl font-bold"
                      >
                        $40,000.00
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 24}
                        className="fill-muted-foreground"
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
