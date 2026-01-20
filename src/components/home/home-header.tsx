"use client";

import { CentuariTypography } from "@/components/centuari-typography";
import { IcPieChartColorCentuari } from "@/components/icons/ic-pie-chart-color-centuari";
import { IcWalletColorCentuari } from "@/components/icons/ic-wallet-color-centuari";
import { formatCurrency } from "@/lib/utils";
import Image from "next/image";

export function HomeHeader() {
  const totalBalance = 521000000; // 521M
  const activeLoans = 248000000; // 248M

  const renderCurrency = (value: number) => {
    const formatted = formatCurrency(value);
    const idx = formatted.lastIndexOf(".");
    if (idx === -1) return formatted;

    return (
      <>
        {formatted.slice(0, idx)}
        <span className="text-[#2B2F37]">{formatted.slice(idx)}</span>
      </>
    );
  };

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
          Hi William!,
        </CentuariTypography>
        <CentuariTypography className="text-2xl md:text-4xl font-semibold mt-1 md:mt-2">
          Welcome To Centuari
        </CentuariTypography>
      </div>

      {/* Balance Cards - 2 column grid on mobile, horizontal on desktop */}
      <div
        id="tour-home-header"
        className="grid grid-cols-2 md:flex md:flex-row gap-4 md:gap-12 w-full md:w-auto"
      >
        <div
          id="tour-total-balance"
          className="flex flex-col items-center md:flex-row md:items-center gap-3 md:gap-4"
        >
          <div className="p-4 md:p-0 bg-white/10 md:bg-transparent rounded-2xl md:rounded-none border border-white/5 md:border-0">
            <IcWalletColorCentuari className="w-8 h-8 md:w-6 md:h-6" />
          </div>
          <div className="text-center md:text-left">
            <CentuariTypography className="text-xs md:text-sm text-muted-foreground">
              Total Deposits
            </CentuariTypography>
            <CentuariTypography className="text-lg md:text-2xl font-semibold mt-1">
              {renderCurrency(totalBalance)}
            </CentuariTypography>
          </div>
        </div>

        <Image
          src="/assets/separator.svg"
          alt="Separator"
          width={1}
          height={37}
          className="hidden md:block"
        />

        <div
          id="tour-active-loans"
          className="flex flex-col items-center md:flex-row md:items-center gap-3 md:gap-4"
        >
          <div className="p-4 md:p-0 bg-white/10 md:bg-transparent rounded-2xl md:rounded-none border border-white/5 md:border-0">
            <IcPieChartColorCentuari className="w-8 h-8 md:w-6 md:h-6" />
          </div>
          <div className="text-center md:text-left">
            <CentuariTypography className="text-xs md:text-sm text-muted-foreground">
              Active Loans
            </CentuariTypography>
            <CentuariTypography className="text-lg md:text-2xl font-semibold mt-1">
              {renderCurrency(activeLoans)}
            </CentuariTypography>
          </div>
        </div>
      </div>
    </div>
  );
}
