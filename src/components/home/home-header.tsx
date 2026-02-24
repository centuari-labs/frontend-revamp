"use client";

import { CentuariTypography } from "@/components/centuari-typography";
import { IcPieChartColorCentuari } from "@/components/icons/ic-pie-chart-color-centuari";
import { IcWalletColorCentuari } from "@/components/icons/ic-wallet-color-centuari";
import { CurrencyValue } from "@/components/currency-value";
import { StatRow } from "@/components/stat-row";
import { useMarketData } from "@/hooks/use-market-data";
import { useAccountName } from "@/hooks/use-account-name";
import Image from "next/image";

export function HomeHeader() {
  const { totalDeposit, activeLoans } = useMarketData();
  const name = useAccountName();

  return (
    <div className="relative flex flex-col justify-between items-center md:items-start gap-6 bg-primary-blue-100/5 overflow-hidden px-6 md:px-12 py-8 rounded-xl border-0 md:border">
      {/* Desktop dot-world background - hidden on mobile */}
      <div className="hidden md:block absolute top-0 right-0 w-[621px] h-[240px] overflow-hidden">
        <Image
          src="/assets/centuari-home-header.png"
          alt="centuari-home-header"
          fill
          className="object-cover z-50 object-right"
        />
      </div>

      {/* Header Text - centered on mobile, left-aligned on desktop */}
      <div className="text-center md:text-left w-full">
        <CentuariTypography className="text-transparent font-semibold text-2xl md:text-4xl bg-clip-text bg-gradient-to-r from-primary-blue-base via-white to-primary-blue-base">
          Hi{name ? ` ${name}` : ""},
        </CentuariTypography>
        <CentuariTypography className="text-2xl md:text-4xl font-semibold mt-1 md:mt-2">
          Welcome To Centuari
        </CentuariTypography>
      </div>

      {/* Balance Cards - 2 column grid on mobile, horizontal on desktop */}
      <div id="tour-home-header" className="w-full md:w-auto">
        <StatRow
          items={[
            {
              id: "tour-total-balance",
              icon: <IcWalletColorCentuari className="w-8 h-8 md:w-6 md:h-6" />,
              label: "Total Deposits",
              value: <CurrencyValue value={totalDeposit} decimalPlaces={0} />,
            },
            {
              id: "tour-active-loans",
              icon: (
                <IcPieChartColorCentuari className="w-8 h-8 md:w-6 md:h-6" />
              ),
              label: "Active Loans",
              value: <CurrencyValue value={activeLoans} decimalPlaces={0} />,
            },
          ]}
          showSeparator
          layout="grid"
          statCardVariant="centered"
        />
      </div>
    </div>
  );
}
