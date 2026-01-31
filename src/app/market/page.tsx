"use client";

import { MarketHeader } from "@/components/market/market-header";
import { OrderBookCard } from "@/components/market/order-book";
import { APRHistoryCard } from "@/components/market/apr-history-card";
import { LendBorrowCard } from "@/components/market/lend-borrow-card";
import { PositionSection } from "@/components/market/position-section";
import { MobileLendBorrowButtons } from "@/components/market/mobile-lend-borrow-buttons";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

const tokenList = [
  { logo: "/tokens/usdc-icon.svg", value: "usdc", label: "USDC" },
  { logo: "/tokens/xsgd-icon.png", value: "xsgd", label: "XSGD" },
  { logo: "/tokens/idrx-icon.png", value: "idrx", label: "IDRX" },
];

export default function Page() {
  const searchParams = useSearchParams();
  
  // Get selected token from URL params, default to USDC
  const selectedToken = useMemo(() => {
    const tokenParam = searchParams.get("token") || "usdc";
    return tokenList.find(t => t.value === tokenParam) || tokenList.find(t => t.value === "usdc") || tokenList[0];
  }, [searchParams]);
  return (
    <div className="relative w-full mt-8 sm:mt-10 md:mt-12 lg:mt-14 pb-20 md:pb-0">
      <div className="w-full max-w-full sm:max-w-6xl xl:max-w-[88rem] 2xl:max-w-[140rem] mx-auto px-2 sm:px-4 2xl:min-h-[calc(100vh-6rem)]">
        <MarketHeader />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mt-4">
          <APRHistoryCard />

          <div className="col-span-1">
            <OrderBookCard height="500px" />
          </div>

          <LendBorrowCard tokenList={tokenList} selectedToken={selectedToken} />
        </div>

        <PositionSection />
      </div>

      <MobileLendBorrowButtons tokenList={tokenList} selectedToken={selectedToken} />
    </div>
  );
}
