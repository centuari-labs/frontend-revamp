"use client";

import { CentuariTypography } from "@/components/centuari-typography";
import { IcPieChartColorCentuari } from "@/components/icons/ic-pie-chart-color-centuari";
import { IcWalletColorCentuari } from "@/components/icons/ic-wallet-color-centuari";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export function MarketHeader() {
  const router = useRouter();
  return (
    <>
      {/* Mobile Header - Simple centered layout */}
      <div className="flex md:hidden items-center justify-between w-full py-4">
        <button
          onClick={() => router.push("/")}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} className="text-white" />
        </button>

        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <Image
            src={"/tokens/usdc-icon.svg"}
            alt="USDC Icon"
            width={24}
            height={24}
          />
          <CentuariTypography className="uppercase font-semibold text-lg">
            USDC
          </CentuariTypography>
        </div>

        <div className="w-10" />
      </div>

      {/* Desktop Header - Full layout with stats */}
      <div className="hidden md:flex justify-between items-center w-full">
        <div className="flex items-center gap-4 cursor-pointer">
          <ArrowLeft size={20} onClick={() => router.push("/")} />
          <div className="inline-flex items-center gap-2">
            <Image
              src={"/tokens/usdc-icon.svg"}
              alt="USDC Icon"
              width={35}
              height={35}
            />
            <CentuariTypography
              className="uppercase font-semibold"
              variant="heading-md"
            >
              USDC
            </CentuariTypography>
          </div>
        </div>
        <div className="flex flex-col items-center md:flex-row gap-6 md:gap-12 md:mt-0 py-3.5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-lg border border-white/5">
              <IcWalletColorCentuari />
            </div>
            <div>
              <CentuariTypography className="text-sm text-muted-foreground">
                Total Deposits
              </CentuariTypography>
              <CentuariTypography className="text-2xl font-semibold mt-1">
                {(() => {
                  const totalBalance = 2340340.0;
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
                      <span className="text-[#2B2F37]">
                        {formatted.slice(idx)}
                      </span>
                    </>
                  );
                })()}
              </CentuariTypography>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-lg border border-white/5">
              <IcPieChartColorCentuari />
            </div>
            <div>
              <CentuariTypography className="text-sm text-muted-foreground">
                Active Loans
              </CentuariTypography>
              <CentuariTypography className="text-2xl font-semibold mt-1">
                {(() => {
                  const activeLoans = 840340.0;
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
                      <span className="text-[#2B2F37]">
                        {formatted.slice(idx)}
                      </span>
                    </>
                  );
                })()}
              </CentuariTypography>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
