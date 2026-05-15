"use client";

import { FaucetHeader } from "@/components/faucet/faucet-header";
import { FaucetTokenGrid } from "@/components/faucet/faucet-token-grid";
import { FaucetPageSkeleton } from "@/components/faucet/faucet-skeleton";
import { useMarketData } from "@/hooks/use-market-data";
import { SectionErrorOverlay } from "@/components/ui/section-error";

export default function FaucetPage() {
	const { isLoading, isError, refetch } = useMarketData();

	return (
		<div className="relative w-full flex justify-center mt-24">
			<SectionErrorOverlay
				isError={isError}
				onRetry={refetch}
				className="max-w-7xl w-full px-6"
			>
				{isLoading ? (
					<FaucetPageSkeleton />
				) : (
					<>
						<FaucetHeader />
						<FaucetTokenGrid />
					</>
				)}
			</SectionErrorOverlay>
		</div>
	);
}
