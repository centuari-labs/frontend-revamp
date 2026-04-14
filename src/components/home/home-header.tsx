"use client";

import { IcPieChartColorCentuari } from "@/components/icons/ic-pie-chart-color-centuari";
import { IcWalletColorCentuari } from "@/components/icons/ic-wallet-color-centuari";
import { CentuariGlassLayers } from "@/components/centuari-glass-surface";
import { CentuariTypography } from "@/components/centuari-typography";
import { CurrencyValue } from "@/components/currency-value";
import { StatRow } from "@/components/stat-row";
import { useMarketData } from "@/hooks/use-market-data";
import { useAccountName } from "@/hooks/use-account-name";
import { HomeHeaderSkeleton } from "./home-header-skeleton";
import { usePrivy } from "@privy-io/react-auth";
import Image from "next/image";

export function HomeHeader() {
  const { totalDeposit, activeLoans, isLoading } = useMarketData();
  const name = useAccountName();
  const { authenticated } = usePrivy();

  if (isLoading) return <HomeHeaderSkeleton />;

  return (
    <div className="group/glass relative isolate flex flex-col justify-between items-center md:items-start gap-6 overflow-hidden px-6 md:px-12 py-8 rounded-xl border border-white/10 bg-[#05070D]">
      {/* Base dark gradient — near-black fading across */}
      <div
        className="pointer-events-none absolute inset-0 -z-20 hidden md:block"
        style={{
          backgroundImage:
            "linear-gradient(90deg, #05070D 0%, #070B18 45%, #0A1430 70%, #0E1D52 100%)",
        }}
      />
      <Image
        src={"/assets/centuari-home-header.webp"}
        fill
        className="object-contain object-right z-50 hidden md:block"
        alt="centuari-home-header"
      />

      {/* Bright blue glow concentrated on the right */}
      {/* <div className="pointer-events-none absolute -z-10 -right-40 top-1/2 -translate-y-1/2 w-[680px] h-[680px] rounded-full bg-[#2E6BFF] opacity-70 blur-[140px]" />
      <div className="pointer-events-none absolute -z-10 -right-10 top-1/2 -translate-y-1/2 w-[360px] h-[360px] rounded-full bg-[#5B8CFF] opacity-50 blur-[100px]" /> */}

      {/* Organic curved shape (decorative) on the far right — hidden on mobile */}
      {/* <div
        aria-hidden
        className="hidden md:block pointer-events-none absolute -z-10 -right-24 -top-16 w-[520px] h-[420px] opacity-80"
        style={{
          background:
            "radial-gradient(60% 80% at 70% 40%, rgba(80,130,255,0.9) 0%, rgba(30,60,180,0.5) 35%, rgba(10,20,60,0) 70%)",
          filter: "blur(30px)",
        }}
      /> */}

      <CentuariGlassLayers intensity="soft" sheen={false} />

      {/* Header Text - centered on mobile, left-aligned on desktop */}
      <div className="relative z-20 text-center md:text-left w-full">
        {authenticated && <CentuariTypography className="text-primary-blue-30 font-semibold text-2xl md:text-4xl pb-1">
          Hi{name ? ` ${name}` : ""}!,
        </CentuariTypography>}
        <CentuariTypography className="text-2xl md:text-4xl font-semibold mt-1 md:mt-2">
          Welcome To Centuari
        </CentuariTypography>
      </div>

      {/* Balance Cards - 2 column grid on mobile, horizontal on desktop */}
      <div id={"tour-home-header"} className="relative z-20 w-full md:w-auto">
        <StatRow
          items={[
            {
              id: "tour-total-balance",
              icon: <IcWalletColorCentuari className="w-8 h-8 md:w-6 md:h-6" />,
              label: "Total Deposits",
              value: <CurrencyValue value={totalDeposit} decimalPlaces={2} compact />,
            },
            {
              id: "tour-active-loans",
              icon: (
                <IcPieChartColorCentuari className="w-8 h-8 md:w-6 md:h-6" />
              ),
              label: "Active Loans",
              value: <CurrencyValue value={activeLoans} decimalPlaces={2} compact />,
            },
          ]}
          showSeparator
          layout="grid"
          statCardVariant="centered"
          glass
        />
      </div>
    </div>
  );
}
