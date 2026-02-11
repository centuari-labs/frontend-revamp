"use client";

import { MarketHeader } from "@/components/market/market-header";
import { OrderBookCard } from "@/components/market/order-book";
import { APRHistoryCard } from "@/components/market/apr-history-card";
import { LendBorrowCard } from "@/components/market/lend-borrow-card";
import { PositionSection } from "@/components/market/position-section";
import { MobileLendBorrowButtons } from "@/components/market/mobile-lend-borrow-buttons";
import { PageContainer } from "@/components/page-container";
import { MARKET_TOKEN_LIST } from "@/lib/tokens";
import { getSelectedTokenFromParams } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

export default function Page() {
  const searchParams = useSearchParams();

  const selectedToken = useMemo(
    () => getSelectedTokenFromParams(MARKET_TOKEN_LIST, searchParams.get("token"), "usdc"),
    [searchParams],
  );
  return (
    <PageContainer className="mt-8 sm:mt-10 md:mt-12 lg:mt-14 pb-20 md:pb-0" maxWidth="wide">
        <MarketHeader selectedToken={selectedToken} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mt-4">
          <APRHistoryCard />

          <div className="col-span-1">
            <OrderBookCard height="500px" />
          </div>

          <LendBorrowCard tokenList={MARKET_TOKEN_LIST} selectedToken={selectedToken} />
        </div>

        <PositionSection />

      <MobileLendBorrowButtons tokenList={MARKET_TOKEN_LIST} selectedToken={selectedToken} />
    </PageContainer>
  );
}
