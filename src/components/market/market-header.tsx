"use client";

import { CentuariTypography } from "@/components/centuari-typography";
import { IcPieChartColorCentuari } from "@/components/icons/ic-pie-chart-color-centuari";
import { IcWalletColorCentuari } from "@/components/icons/ic-wallet-color-centuari";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

const tokenList = [
  { logo: "/tokens/centuari-btc.png", value: "btc", label: "Bitcoin", symbol: "BTC" },
  { logo: "/tokens/centuari-aave.png", value: "aave", label: "Aave", symbol: "AAVE" },
  { logo: "/tokens/eth-icon.svg", value: "eth", label: "Ethereum", symbol: "ETH" },
  { logo: "/tokens/centuari-arbitrum.png", value: "arb", label: "Arbitrum", symbol: "ARB" },
  { logo: "/tokens/usdc-icon.svg", value: "usdc", label: "USDC", symbol: "USDC" },
  { logo: "/tokens/centuari-usdt.png", value: "usdt", label: "USDT", symbol: "USDT" },
  { logo: "/tokens/centuari-dai.png", value: "dai", label: "DAI", symbol: "DAI" },
  { logo: "/tokens/centuari-centuari.png", value: "centuari", label: "Centuari", symbol: "CENT" },
];

export function MarketHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get selected token from URL params, default to USDC
  const selectedToken = useMemo(() => {
    const tokenParam = searchParams.get("token") || "usdc";
    return tokenList.find(t => t.value === tokenParam) || tokenList.find(t => t.value === "usdc") || tokenList[4];
  }, [searchParams]);
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
            src={selectedToken.logo}
            alt={`${selectedToken.symbol} Icon`}
            width={24}
            height={24}
          />
          <CentuariTypography className="uppercase font-semibold text-lg">
            {selectedToken.symbol}
          </CentuariTypography>
        </div>

        <div className="w-10" />
      </div>

      {/* Desktop Header - Full layout with stats */}
      <div className="hidden md:flex justify-between items-center w-full">
        <div
          className="flex items-center gap-4 cursor-pointer"
          onClick={() => router.push("/")}
        >
          <ArrowLeft size={20} />
          <div className="inline-flex items-center gap-2">
            <Image
              src={selectedToken.logo}
              alt={`${selectedToken.symbol} Icon`}
              width={35}
              height={35}
            />
            <CentuariTypography
              className="uppercase font-semibold"
              variant="heading-md"
            >
              {selectedToken.symbol}
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
