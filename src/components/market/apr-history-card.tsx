"use client";

import { CentuariChart } from "@/components/centuari-chart";
import { CentuariTypography } from "@/components/centuari-typography";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function APRHistoryCard() {
  return (
    <div className="md:col-span-2 lg:col-span-2 bg-white/5 rounded-md overflow-hidden">
      {/* Desktop Header - Only visible on md+ */}
      <div className="hidden md:flex px-3 sm:px-4 md:px-6 lg:px-8 py-3 md:py-4 items-center gap-3 sm:gap-6 lg:gap-10 justify-between w-full">
        <CentuariTypography className="inline-block text-sm sm:text-base">
          APR History
        </CentuariTypography>
        <div className="w-full sm:w-auto overflow-x-auto">
          <Tabs defaultValue="satu">
            <TabsList className="bg-white/5 w-full sm:w-auto">
              <TabsTrigger
                value="satu"
                className="data-[state=active]:!border-none text-xs sm:text-sm px-2 sm:px-3"
              >
                7 D
              </TabsTrigger>
              <TabsTrigger
                value="dua"
                className="data-[state=active]:!border-none text-xs sm:text-sm px-2 sm:px-3"
              >
                1 M
              </TabsTrigger>
              <TabsTrigger
                value="tiga"
                className="data-[state=active]:!border-none text-xs sm:text-sm px-2 sm:px-3"
              >
                2 M
              </TabsTrigger>
              <TabsTrigger
                value="empat"
                className="data-[state=active]:!border-none text-xs sm:text-sm px-2 sm:px-3"
              >
                3 M
              </TabsTrigger>
              <TabsTrigger
                value="lima"
                className="data-[state=active]:!border-none text-xs sm:text-sm px-2 sm:px-3"
              >
                6 M
              </TabsTrigger>
              <TabsTrigger
                value="enam"
                className="data-[state=active]:!border-none text-xs sm:text-sm px-2 sm:px-3"
              >
                1 Y
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Chart */}
      <CentuariChart />

      {/* Mobile Tabs - Only visible on mobile, below chart */}
      <div className="md:hidden px-4 pb-4">
        <Tabs defaultValue="satu">
          <TabsList className="bg-white/5 w-full grid grid-cols-6">
            <TabsTrigger
              value="satu"
              className="data-[state=active]:!border-none data-[state=active]:bg-white/10 text-xs px-1"
            >
              7 D
            </TabsTrigger>
            <TabsTrigger
              value="dua"
              className="data-[state=active]:!border-none data-[state=active]:bg-white/10 text-xs px-1"
            >
              1 M
            </TabsTrigger>
            <TabsTrigger
              value="tiga"
              className="data-[state=active]:!border-none data-[state=active]:bg-white/10 text-xs px-1"
            >
              2 M
            </TabsTrigger>
            <TabsTrigger
              value="empat"
              className="data-[state=active]:!border-none data-[state=active]:bg-white/10 text-xs px-1"
            >
              3 M
            </TabsTrigger>
            <TabsTrigger
              value="lima"
              className="data-[state=active]:!border-none data-[state=active]:bg-white/10 text-xs px-1"
            >
              6 M
            </TabsTrigger>
            <TabsTrigger
              value="enam"
              className="data-[state=active]:!border-none data-[state=active]:bg-white/10 text-xs px-1"
            >
              1 Yr
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
