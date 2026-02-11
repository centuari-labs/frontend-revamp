"use client";

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
import { CurrencyValue } from "@/components/currency-value";
import { PageContainer } from "@/components/page-container";
import { DataTableAssets } from "@/components/portfolio/tables/data-table-assets";
import { DataTableAllPosition } from "@/components/portfolio/tables/data-table-all-position";
import Link from "next/link";
import { useEffect, useState } from "react";
import { defaultPortfolio } from "@/lib/portfolio-data";
import {
  getHealthFactorStatus,
  getLocalStorageJson,
  getLocalStorageNumber,
  migratePortfolioFromStorage,
  toPercent,
} from "@/lib/utils";

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<Record<string, number>>(() =>
    getLocalStorageJson("centuari_portfolio", defaultPortfolio, (p) => {
      const m = migratePortfolioFromStorage(p, defaultPortfolio);
      if (typeof window !== "undefined") {
        localStorage.setItem("centuari_portfolio", JSON.stringify(m));
      }
      return m;
    }),
  );

  const [totalDebt, setTotalDebt] = useState<number>(() =>
    getLocalStorageNumber("centuari_total_debt", 0),
  );

  const [totalSupply, setTotalSupply] = useState<number>(() =>
    getLocalStorageNumber("centuari_total_supply", 0),
  );

  useEffect(() => {
    const handleStorageChange = () => {
      setPortfolio(
        getLocalStorageJson("centuari_portfolio", defaultPortfolio),
      );
      setTotalDebt(getLocalStorageNumber("centuari_total_debt", 0));
      setTotalSupply(getLocalStorageNumber("centuari_total_supply", 0));
    };

    window.addEventListener("storage", handleStorageChange);
    const interval = setInterval(handleStorageChange, 500);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const totalPortfolioValue = Object.values(portfolio).reduce((sum, value) => sum + value, 0);
  const totalBalance = totalPortfolioValue + totalSupply - totalDebt;

  const availableBalancePercent = toPercent(totalPortfolioValue, totalBalance);
  const suppliedPercent = toPercent(totalSupply, totalBalance);
  const borrowedPercent = toPercent(totalDebt, totalBalance);

  const healthFactor =
    totalDebt > 0 ? (totalPortfolioValue / totalDebt).toFixed(2) : "0.00";
  const healthFactorStatus = getHealthFactorStatus(parseFloat(healthFactor));

  return (
    <PageContainer>
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
                My Portofolio
              </h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:flex-row items-start md:items-center gap-6 md:gap-8 mt-6 md:mt-9 py-3.5">
                <div>
                  <CentuariTypography className="text-xs md:text-sm text-white">
                    Total Balance
                  </CentuariTypography>
                  <CentuariTypography className="text-xl md:text-2xl font-semibold mt-1">
                    <CurrencyValue
                      value={totalBalance}
                      decimalPlaces={2}
                      decimalClassName="text-white"
                    />
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
                    All Time Return
                  </CentuariTypography>
                  <CentuariTypography className="text-xl md:text-2xl font-semibold mt-1">
                    <CurrencyValue
                      value={totalSupply}
                      decimalPlaces={2}
                      decimalClassName="text-white"
                    />
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
                    Net APR
                  </CentuariTypography>
                  <CentuariTypography className="text-xl md:text-2xl font-semibold mt-1">
                    6.9%
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
                    value: `${availableBalancePercent}%`,
                  },
                  {
                    label: "Supplied Assets",
                    color: "bg-[#AAC7F9]",
                    value: `${suppliedPercent}%`,
                  },
                  {
                    label: "Borrowed Assets",
                    color: "bg-[#4F8FFD]",
                    value: `${borrowedPercent}%`,
                  },
                ].map((item, idx) => (
                  <div
                    key={item.label}
                    className={`flex items-center justify-between py-2.5 ${idx !== 0 ? "border-t border-white/10" : ""
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
                <Link href="/portfolio/transaction-history">
                  <Button
                    variant="secondary"
                    size={"sm"}
                    className="w-full mt-4"
                  >
                    See All Transaction
                  </Button>
                </Link>
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
                  <span className="text-2xl font-semibold">
                    <CurrencyValue value={totalSupply} decimalPlaces={2} />
                  </span>
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
                  <span className="text-2xl font-semibold">
                    <CurrencyValue value={totalDebt} decimalPlaces={2} />
                  </span>
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
                  <Badge
                    variant={
                      healthFactorStatus === "Safe" || healthFactorStatus === "Good"
                        ? "success"
                        : healthFactorStatus === "Warning"
                          ? "warning"
                          : "destructive"
                    }
                  >
                    {healthFactor} ~ {healthFactorStatus}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="w-full lg:w-[700px] xl:w-[700px] mt-6 lg:mt-0">
              <LendBorrowChart />
            </div>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row items-stretch gap-3 mt-3">
          <div className="flex-1 h-[400px] min-w-0 overflow-x-auto">
            <DataTableAssets />
          </div>
          <div className="flex-1 h-[400px] min-w-0 overflow-x-auto">
            <DataTableAllPosition />
          </div>
        </div>
    </PageContainer>
  );
}
