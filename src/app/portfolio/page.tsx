import { CentuariCalender } from "@/components/centuari-calender";
import { CentuariTable } from "@/components/centuari-table";
import { PortfolioChart } from "@/components/portfolio/portfolio-chart";
import { PortfolioHeader } from "@/components/portfolio/portfolio-header";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, Calendar, CalendarRange, Flag } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CentuariTypography } from "@/components/centuari-typography";
import LendBorrowChart from "@/components/portfolio/lend-borrow-chart";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { DataTableAssets } from "@/components/portfolio/tables/data-table-assets";
import { DataTableAllPosition } from "@/components/portfolio/tables/data-table-all-position";

export default function PortfolioPage() {
  return (
    <div className="relative w-full mt-14">
      <div className="w-full max-w-6xl xl:max-w-[88rem] 2xl:max-w-[140rem] mx-auto px-4 2xl:min-h-[calc(100vh-6rem)]">
        {/* <PortfolioHeader /> */}
        <div className="mt-10 md:mt-20">
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white/5 border rounded-lg w-full px-6 md:px-8 py-8 lg:py-0 overflow-hidden">
            <Image
              src="/assets/portfolio-gradient-card.svg"
              alt="portfolio-gradient-card"
              width={944}
              height={217}
              className="absolute top-0 left-0 object-cover w-full h-full"
            />
            <div className="relative z-10">
              <h1 className="text-2xl md:text-3xl font-semibold">
                My Position
              </h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:flex-row items-start md:items-center gap-6 md:gap-8 mt-6 md:mt-9 py-3.5">
                <div>
                  <CentuariTypography className="text-xs md:text-sm text-white">
                    Total Balance
                  </CentuariTypography>
                  <CentuariTypography className="text-xl md:text-2xl font-semibold mt-1">
                    {(() => {
                      const totalBalance = 2340340.0; // nanti ganti dari API`
                      const formatted = new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                        minimumFractionDigits: 2,
                      }).format(totalBalance);
                      const idx = formatted.lastIndexOf(".");
                      if (idx === -1) return formatted;
                      return (
                        <>
                          {formatted.slice(0, idx)}
                          <span className="text-white">
                            {formatted.slice(idx)}
                          </span>
                        </>
                      );
                    })()}
                  </CentuariTypography>
                </div>
                <Image
                  src="/assets/separator.svg"
                  alt="Separator"
                  width={1}
                  height={37}
                  className="hidden md:block"
                />
                <div>
                  <CentuariTypography className="text-xs md:text-sm text-white">
                    My Total Supply
                  </CentuariTypography>
                  <CentuariTypography className="text-xl md:text-2xl font-semibold mt-1">
                    {(() => {
                      const activeLoans = 840340.0; // nanti ganti dari API
                      const formatted = new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                        minimumFractionDigits: 2,
                      }).format(activeLoans);
                      const idx = formatted.lastIndexOf(".");
                      if (idx === -1) return formatted;
                      return (
                        <>
                          {formatted.slice(0, idx)}
                          <span className="text-white">
                            {formatted.slice(idx)}
                          </span>
                        </>
                      );
                    })()}
                  </CentuariTypography>
                </div>
                <Image
                  src="/assets/separator.svg"
                  alt="Separator"
                  width={1}
                  height={37}
                  className="hidden md:block"
                />
                <div>
                  <CentuariTypography className="text-xs md:text-sm text-white">
                    My Total Borrow
                  </CentuariTypography>
                  <CentuariTypography className="text-xl md:text-2xl font-semibold mt-1">
                    {(() => {
                      const activeLoans = 840340.0; // nanti ganti dari API
                      const formatted = new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                        minimumFractionDigits: 2,
                      }).format(activeLoans);
                      const idx = formatted.lastIndexOf(".");
                      if (idx === -1) return formatted;
                      return (
                        <>
                          {formatted.slice(0, idx)}
                          <span className="text-white">
                            {formatted.slice(idx)}
                          </span>
                        </>
                      );
                    })()}
                  </CentuariTypography>
                </div>
              </div>
            </div>
            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8 lg:gap-4 w-full lg:w-auto">
              {/* Legend Section */}
              <div className="flex-shrink-0 w-full sm:w-[280px]">
                {[
                  {
                    label: "Available Balance",
                    color: "bg-[#2A4AC2]",
                    value: "60%",
                  },
                  {
                    label: "Supplied Assets",
                    color: "bg-[#AAC7F9]",
                    value: "30%",
                  },
                  {
                    label: "Borrowed Assets",
                    color: "bg-[#4F8FFD]",
                    value: "10%",
                  },
                ].map((item, idx) => (
                  <div
                    key={item.label}
                    className={`flex items-center justify-between py-2.5 ${
                      idx !== 0 ? "border-t border-white/10" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 ${item.color} border border-black rounded-full flex-shrink-0`}
                      />
                      <p className="text-sm text-white/80">{item.label}</p>
                    </div>
                    <p className="text-sm font-medium text-white">
                      {item.value}
                    </p>
                  </div>
                ))}
                <Button variant="secondary" size={"sm"} className="w-full mt-4">
                  See All Transaction
                </Button>
              </div>
              {/* Chart Section */}
              <div className="flex-shrink-0 w-full sm:w-[220px] flex justify-center">
                <PortfolioChart />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between bg-white/5 border rounded-xl overflow-hidden p-6 lg:p-0 lg:pl-8">
            <div>
              <h1 className="text-lg font-medium">Lend & Borrow Assets</h1>
              <div className="mt-8 lg:mt-12 flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-10">
                <div className="space-y-1.5">
                  <p className="text-sm">Supplied Assets</p>
                  <span className="text-2xl font-semibold">$0,000.00</span>
                </div>
                <Image
                  src="/assets/separator.svg"
                  alt="Separator"
                  width={1}
                  height={37}
                  className="hidden sm:block"
                />
                <div className="space-y-1.5">
                  <p className="text-sm">Borrowed Assets</p>
                  <span className="text-2xl font-semibold">$0,000.00</span>
                </div>
                <Image
                  src="/assets/separator.svg"
                  alt="Separator"
                  width={1}
                  height={37}
                  className="hidden sm:block"
                />
                <div className="space-y-1.5">
                  <p className="text-sm">Health Factor</p>
                  <Badge variant={"success"}>0.0 ~ Safe</Badge>
                </div>
              </div>
            </div>
            <div className="w-full lg:w-[700px] xl:w-[700px] mt-6 lg:mt-0">
              <LendBorrowChart />
            </div>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row items-stretch gap-3 mt-3">
          <div className="flex-1 min-w-0 overflow-x-auto">
            <DataTableAssets />
          </div>
          <div className="flex-1 min-w-0 overflow-x-auto">
            <DataTableAllPosition />
          </div>
        </div>
      </div>
    </div>
  );
}
