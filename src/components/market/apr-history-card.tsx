"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { CentuariChart } from "@/components/centuari-chart";
import { CentuariTypography } from "@/components/centuari-typography";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3 } from "lucide-react";
import { useRateHistory } from "@/hooks/use-rate-history";
import { CentuariGlassLayers } from "@/components/centuari-glass-surface";

interface APRHistoryCardProps {
  assetId: string | undefined;
}

function APRHistoryCardSkeleton() {
  return (
    <div className="md:col-span-2 lg:col-span-2 bg-white/5 rounded-md overflow-hidden">
      <div className="hidden md:flex px-6 lg:px-8 py-4 items-center justify-between w-full">
        <Skeleton className="h-5 w-24" />
        <div className="flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-10 rounded-md" />
          ))}
        </div>
      </div>
      <div className="px-6 pb-6">
        <Skeleton className="h-[300px] w-full rounded-md" />
      </div>
    </div>
  );
}

export function APRHistoryCard({ assetId }: APRHistoryCardProps) {
  const { rateHistory, isLoading } = useRateHistory(assetId);

  const chartData = useMemo(
    () =>
      rateHistory.map((item) => ({
        date: format(new Date(item.date), "d MMM"),
        value: item.rate,
      })),
    [rateHistory],
  );

  if (isLoading) {
    return <APRHistoryCardSkeleton />;
  }

  if (chartData.length === 0) {
    return (
      <div className="group/glass relative md:col-span-2 lg:col-span-2 bg-transparent border-0 rounded-xl overflow-hidden isolate flex flex-col items-center justify-center min-h-[300px] gap-3">
        <CentuariGlassLayers intensity="soft" />
        <BarChart3 size={40} className="relative z-20 text-white/20" />
        <span className="relative z-20 text-sm text-white/40">No Data</span>
      </div>
    );
  }

  return (
    <div className="group/glass relative md:col-span-2 lg:col-span-2 bg-transparent border-0 rounded-xl overflow-hidden isolate">
      <CentuariGlassLayers intensity="soft" />
      {/* Desktop Header - Only visible on md+ */}
      <div className="hidden md:flex px-3 sm:px-4 md:px-6 lg:px-8 py-3 md:py-4 items-center gap-3 sm:gap-6 lg:gap-10 justify-between w-full">
        <CentuariTypography className="inline-block text-sm sm:text-base">
          APR History
        </CentuariTypography>
        <div className="w-full sm:w-auto overflow-x-auto">
          <Tabs defaultValue="satu">
            <TabsList className="bg-white/5 w-full sm:w-auto">
              {[
                { value: "satu", label: "7 D" },
                { value: "dua", label: "1 M" },
                { value: "tiga", label: "2 M" },
                { value: "empat", label: "3 M" },
                { value: "lima", label: "6 M" },
                { value: "enam", label: "1 Y" },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="group/glass relative overflow-hidden isolate data-[state=active]:text-white data-[state=active]:border-none! bg-transparent! shadow-none! text-xs sm:text-sm px-2 sm:px-3"
                >
                  <span className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity [[data-state=active]>&]:opacity-100">
                    <CentuariGlassLayers intensity="soft" />
                  </span>
                  <span className="relative z-20">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Chart */}
      <CentuariChart data={chartData} />

      {/* Mobile Tabs - Only visible on mobile, below chart */}
      <div className="md:hidden px-4 pb-4">
        <Tabs defaultValue="satu">
          <TabsList className="bg-white/5 w-full grid grid-cols-6">
            {[
              { value: "satu", label: "7 D" },
              { value: "dua", label: "1 M" },
              { value: "tiga", label: "2 M" },
              { value: "empat", label: "3 M" },
              { value: "lima", label: "6 M" },
              { value: "enam", label: "1 Yr" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="group/glass relative overflow-hidden isolate data-[state=active]:text-white data-[state=active]:border-none! bg-transparent! shadow-none! text-xs px-1"
              >
                <span className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity [[data-state=active]>&]:opacity-100">
                  <CentuariGlassLayers intensity="soft" />
                </span>
                <span className="relative z-20">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
