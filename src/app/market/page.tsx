"use client";

import { MarketHeader } from "@/components/market/market-header";
import { OrderBookCard } from "@/components/market/order-book";
import { RateHistoryCard } from "@/components/market/rate-history-card";
import { LendBorrowCard } from "@/components/market/lend-borrow-card";
import { PositionSection } from "@/components/market/position-section";
import { MobileLendBorrowButtons } from "@/components/market/mobile-lend-borrow-buttons";

const tokenList = [
  { logo: "/tokens/centuari-btc.png", value: "btc", label: "Bitcoin" },
  { logo: "/tokens/centuari-aave.png", value: "aave", label: "Aave" },
  { logo: "/tokens/centuari-eth.png", value: "eth", label: "Ethereum" },
  { logo: "/tokens/centuari-arbitrum.png", value: "arb", label: "Arbitrum" },
  { logo: "/tokens/centuari-usdc.png", value: "usdc", label: "USDC" },
  { logo: "/tokens/centuari-usdt.png", value: "usdt", label: "USDT" },
  { logo: "/tokens/centuari-dai.png", value: "dai", label: "DAI" },
  {
    logo: "/tokens/centuari-centuari.png",
    value: "centuari",
    label: "Centuari",
  },
];

export default function Page() {
  return (
    <div className="relative w-full mt-8 sm:mt-10 md:mt-12 lg:mt-14 pb-20 md:pb-0">
      <div className="w-full max-w-full sm:max-w-6xl xl:max-w-[88rem] 2xl:max-w-[140rem] mx-auto px-2 sm:px-4 2xl:min-h-[calc(100vh-6rem)]">
        <MarketHeader />

        {/* Main Grid - Responsive Layout: 4 cols on lg+, 2 cols on md, 1 col on sm */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mt-4">
          <RateHistoryCard />

          <div className="col-span-1">
            <OrderBookCard height="500px" />
          </div>

          <LendBorrowCard tokenList={tokenList} />
        </div>

        <PositionSection />
      </div>

      {/* Mobile Fixed Bottom Buttons */}
      <MobileLendBorrowButtons tokenList={tokenList} />
    </div>
  );
}
