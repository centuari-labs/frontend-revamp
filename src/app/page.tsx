"use client";

import { HomeHeader } from "@/components/home/home-header";
import { TokenGrid } from "@/components/home/token-grid";
import { useMarketData } from "@/hooks/use-market-data";
import { SectionErrorOverlay } from "@/components/ui/section-error";

export default function Page() {
  const { isError, refetch } = useMarketData();

  return (
    <div className="relative w-full flex justify-center mt-24">
      <SectionErrorOverlay isError={isError} onRetry={refetch} className="max-w-7xl w-full px-6">
        <HomeHeader />
        <TokenGrid />
      </SectionErrorOverlay>
    </div>
  );
}
