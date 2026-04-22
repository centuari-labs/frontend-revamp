"use client";

import { MarketHeader } from "@/components/market/market-header";
import { OrderBookCard } from "@/components/market/order-book";
import { APRHistoryCard } from "@/components/market/apr-history-card";
import { LendBorrowCard } from "@/components/market/lend-borrow-card";
import { PositionSection } from "@/components/market/position-section";
import { MobileLendBorrowButtons } from "@/components/market/mobile-lend-borrow-buttons";
import { PageContainer } from "@/components/page-container";
import { getTokenLogo } from "@/lib/tokens";
import { useMarketDetail } from "@/hooks/use-market-detail";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { MarketPageSkeleton } from "@/components/market/market-skeleton";
import { SectionErrorOverlay } from "@/components/ui/section-error";

export default function Page() {
	const searchParams = useSearchParams();
	const assetId = searchParams.get("token") ?? undefined;

	const {
		symbol,
		decimals,
		imageUrl,
		totalDeposit,
		activeLoans,
		upcomingMaturities,
		isLoading,
		isError,
		refetch,
	} = useMarketDetail(assetId);

	const selectedToken = useMemo(() => {
		const tokenValue = symbol?.toLowerCase() ?? "";
		return {
			logo: getTokenLogo(tokenValue, imageUrl ?? undefined),
			value: tokenValue,
			label: symbol ?? "",
		};
	}, [symbol, imageUrl]);

	const tokenList = useMemo(() => [selectedToken], [selectedToken]);

	const maturityOptions = useMemo(
		() => upcomingMaturities.map((m) => m.maturity),
		[upcomingMaturities],
	);

	if (isLoading) {
		return (
			<PageContainer
				className="mt-8 sm:mt-10 md:mt-12 lg:mt-14 pb-20 md:pb-0"
				maxWidth="wide"
			>
				<MarketPageSkeleton />
			</PageContainer>
		);
	}

	return (
		<SectionErrorOverlay isError={isError} onRetry={refetch}>
			<PageContainer
				className="mt-8 sm:mt-10 md:mt-12 lg:mt-14 pb-20 md:pb-0"
				maxWidth="wide"
			>
				<MarketHeader
					selectedToken={selectedToken}
					totalDeposit={totalDeposit}
					activeLoans={activeLoans}
				/>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mt-4">
					<APRHistoryCard assetId={assetId} />

					<div className="col-span-1">
						{assetId ? (
							<OrderBookCard
								height="600px"
								assetId={assetId}
								decimals={decimals ?? undefined}
							/>
						) : (
							<div className="h-[600px] rounded-xl border border-border/40 bg-card/40 flex items-center justify-center text-sm text-muted-foreground">
								Market data unavailable.
							</div>
						)}
					</div>

					<LendBorrowCard
						tokenList={tokenList}
						selectedToken={selectedToken}
						maturityOptions={maturityOptions}
						assetId={assetId}
					/>
				</div>

				<PositionSection assetId={assetId} />

				<MobileLendBorrowButtons
					tokenList={tokenList}
					selectedToken={selectedToken}
					assetId={assetId}
				/>
			</PageContainer>
		</SectionErrorOverlay>
	);
}
