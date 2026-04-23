"use client";

import { useMemo, useState } from "react";
import { CentuariChart } from "@/components/centuari-chart";
import { CentuariTypography } from "@/components/centuari-typography";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3 } from "lucide-react";
import { useRateHistory } from "@/hooks/use-rate-history";
import { CentuariGlassLayers } from "@/components/centuari-glass-surface";
import {
  buildRateChartData,
  DEFAULT_RANGE,
  RANGE_TABS,
  type RangeValue,
} from "@/lib/rate-history";

interface APRHistoryCardProps {
  assetId: string | undefined;
}

function APRHistoryCardSkeleton() {
  return (
    <div className="md:col-span-2 lg:col-span-2 bg-white/5 rounded-md overflow-hidden p-4 flex flex-col md:h-[600px]">
      <div className="hidden md:flex items-center justify-between w-full shrink-0">
        <Skeleton className="h-5 w-24" />
        <div className="flex gap-2">
          {Array.from({ length: RANGE_TABS.length }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-10 rounded-md" />
          ))}
        </div>
      </div>
      <div className="flex-1 min-h-0 mt-4">
        <Skeleton className="h-full w-full rounded-md" />
      </div>
    </div>
  );
}

interface RangeTabsProps {
  value: RangeValue;
  onChange: (value: RangeValue) => void;
  variant: "desktop" | "mobile";
}

function RangeTabs({ value, onChange, variant }: RangeTabsProps) {
  const isMobile = variant === "mobile";
  const listClass = isMobile
    ? "bg-white/5 w-full grid grid-cols-6"
    : "bg-white/5 w-full sm:w-auto";
  const triggerClass = isMobile
    ? "group/glass relative overflow-hidden isolate data-[state=active]:text-white data-[state=active]:border-none! bg-transparent! shadow-none! text-xs px-1"
    : "group/glass relative overflow-hidden isolate data-[state=active]:text-white data-[state=active]:border-none! bg-transparent! shadow-none! text-xs sm:text-sm px-2 sm:px-3";

  return (
    <Tabs
      value={value}
      onValueChange={(next) => onChange(next as RangeValue)}
    >
      <TabsList className={listClass}>
        {RANGE_TABS.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className={triggerClass}
          >
            <span className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity [[data-state=active]>&]:opacity-100">
              <CentuariGlassLayers intensity="soft" />
            </span>
            <span className="relative z-20">
              {isMobile ? (tab.mobileLabel ?? tab.label) : tab.label}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

export function APRHistoryCard({ assetId }: APRHistoryCardProps) {
  const { rateHistory, isLoading } = useRateHistory(assetId);
  const [range, setRange] = useState<RangeValue>(DEFAULT_RANGE);

  const chartData = useMemo(
    () => buildRateChartData(rateHistory, range),
    [rateHistory, range],
  );

  if (isLoading) {
    return <APRHistoryCardSkeleton />;
  }

  if (rateHistory.length === 0) {
    return (
      <div className="group/glass relative md:col-span-2  lg:col-span-2 bg-transparent border-0 rounded-xl overflow-hidden isolate flex flex-col items-center justify-center md:h-[600px] gap-3 p-4">
        <CentuariGlassLayers intensity="soft" />
        <BarChart3 size={40} className="relative z-20 text-white/20" />
        <span className="relative z-20 text-sm text-white/40">No Data</span>
      </div>
    );
  }

  return (
    <div className="group/glass relative md:col-span-2 lg:col-span-2 bg-transparent border-0 rounded-xl overflow-hidden isolate p-4 flex flex-col md:h-[600px]">
      <CentuariGlassLayers intensity="soft" />
      {/* Desktop Header - Only visible on md+ */}
      <div className="hidden md:flex items-center gap-3 sm:gap-6 lg:gap-10 justify-between w-full shrink-0">
        <CentuariTypography className="inline-block text-sm sm:text-base">
          APR History
        </CentuariTypography>
        <div className="w-full sm:w-auto overflow-x-auto">
          <RangeTabs value={range} onChange={setRange} variant="desktop" />
        </div>
      </div>

      {/* Chart */}
      <CentuariChart
        data={chartData}
        yAxisWidth={30}
        yAxisOrientation="right"
        yTickCount={9}
        margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
        className="h-[450px] md:h-auto md:flex-1 md:min-h-0 mt-4"
      />

      {/* Mobile Tabs - Only visible on mobile, below chart */}
      <div className="md:hidden">
        <RangeTabs value={range} onChange={setRange} variant="mobile" />
      </div>
    </div>
  );
}
