"use client";

import { MarketHeader } from "@/components/market/market-header";
import { OrderBookCard } from "@/components/market/order-book";
import { APRHistoryCard } from "@/components/market/apr-history-card";
import { LendBorrowCard } from "@/components/market/lend-borrow-card";
import { PositionSection } from "@/components/market/position-section";
import { MobileLendBorrowButtons } from "@/components/market/mobile-lend-borrow-buttons";
import { PageContainer } from "@/components/page-container";
import { MARKET_TOKEN_LIST, getTokenLogo } from "@/lib/tokens";
import { getSelectedTokenFromParams } from "@/lib/utils";
import { useMarketData } from "@/hooks/use-market-data";
import { useMarketDetail } from "@/hooks/use-market-detail";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { MarketPageSkeleton } from "@/components/market/market-skeleton";
import { SectionErrorOverlay } from "@/components/ui/section-error";

export default function Page() {
  const searchParams = useSearchParams();
  const { markets, isLoading, isError, refetch } = useMarketData();

  const tokenList = useMemo(
    () => {
      if (markets.length === 0) return MARKET_TOKEN_LIST;
      return markets.map((m) => ({
        logo: getTokenLogo(m.asset.symbol.toLowerCase(), m.asset.image_url ?? undefined),
        value: m.asset.symbol.toLowerCase(),
        label: m.asset.symbol,
      }));
    },
    [markets],
  );

  const selectedToken = useMemo(
    () => getSelectedTokenFromParams(tokenList, searchParams.get("token"), "usdc"),
    [tokenList, searchParams],
  );

  const activeMarket = useMemo(
    () => markets.find((m) => m.asset.symbol.toLowerCase() === selectedToken.value),
    [markets, selectedToken.value],
  );

  const {
    totalDeposit,
    activeLoans,
    upcomingMaturities,
  } = useMarketDetail(activeMarket?.asset.id);

  const maturityOptions = useMemo(
    () => upcomingMaturities.map((m) => m.maturity),
    [upcomingMaturities],
  );

  if (isLoading) {
    return (
      <PageContainer className="mt-8 sm:mt-10 md:mt-12 lg:mt-14 pb-20 md:pb-0" maxWidth="wide">
        <MarketPageSkeleton />
      </PageContainer>
    );
  }

  return (
    <SectionErrorOverlay isError={isError} onRetry={refetch}>
    <PageContainer className="mt-8 sm:mt-10 md:mt-12 lg:mt-14 pb-20 md:pb-0" maxWidth="wide">
        <MarketHeader
          selectedToken={selectedToken}
          totalDeposit={totalDeposit}
          activeLoans={activeLoans}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mt-4">
          <APRHistoryCard assetId={activeMarket?.asset.id} />

          <div className="col-span-1">
            {activeMarket ? (
              <OrderBookCard
                height="500px"
                assetId={activeMarket.asset.id}
                decimals={activeMarket.asset.decimals ?? undefined}
              />
            ) : (
              <div className="h-[500px] rounded-xl border border-border/40 bg-card/40 flex items-center justify-center text-sm text-muted-foreground">
                {markets.length === 0
                  ? "Loading market data..."
                  : "Market data unavailable for the selected token."}
              </div>
            )}
          </div>

          <LendBorrowCard
            tokenList={tokenList}
            selectedToken={selectedToken}
            maturityOptions={maturityOptions}
          />
        </div>

        <PositionSection />

      <MobileLendBorrowButtons tokenList={tokenList} selectedToken={selectedToken} />
    </PageContainer>
    </SectionErrorOverlay>
  );
}
