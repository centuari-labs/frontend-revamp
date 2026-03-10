"use client";

import { FaucetHeader } from "@/components/faucet/faucet-header";
import { FaucetTokenGrid } from "@/components/faucet/faucet-token-grid";
import { FaucetPageSkeleton } from "@/components/faucet/faucet-skeleton";
import { useMarketData } from "@/hooks/use-market-data";

export default function FaucetPage() {
  const { isLoading } = useMarketData();

  return (
    <div className="relative w-full flex justify-center mt-24">
      <div className="max-w-7xl w-full px-6">
        {isLoading ? (
          <FaucetPageSkeleton />
        ) : (
          <>
            <FaucetHeader />
            <FaucetTokenGrid />
          </>
        )}
      </div>
    </div>
  );
}
