"use client";

import { IcPieChartColorCentuari } from "@/components/icons/ic-pie-chart-color-centuari";
import { IcWalletColorCentuari } from "@/components/icons/ic-wallet-color-centuari";
import { CentuariGlassLayers } from "@/components/centuari-glass-surface";
import { CentuariTypography } from "@/components/centuari-typography";
import { CurrencyValue } from "@/components/currency-value";
import { StatRow } from "@/components/stat-row";
import { useMarketData } from "@/hooks/use-market-data";
import { useAccountName } from "@/hooks/use-account-name";
import { HomeHeaderSkeleton } from "./home-header-skeleton";
import { usePrivy } from "@privy-io/react-auth";
import Image from "next/image";

export function HomeHeader() {
	const { totalDeposit, activeLoans, isLoading } = useMarketData();
	const name = useAccountName();
	const { authenticated } = usePrivy();

	if (isLoading) return <HomeHeaderSkeleton />;

	return (
		<div
			id={"tour-home-header"}
			className="group/glass relative isolate flex flex-col justify-between items-center md:items-start gap-6 overflow-hidden px-6 md:px-12 py-8 rounded-xl"
		>
			<div className="pointer-events-none absolute inset-0 -z-20 hidden md:block" />
			<Image
				src={"/assets/centuari-home-header.webp"}
				fill
				className="object-contain object-right z-50 hidden md:block"
				alt="centuari-home-header"
			/>

			<CentuariGlassLayers intensity="soft" sheen={false} />

			<div className="relative z-20 text-center md:text-left w-full">
				{authenticated && (
					<CentuariTypography className="text-primary-blue-30 font-semibold text-2xl md:text-4xl pb-1">
						Hi{name ? ` ${name}` : ""}!,
					</CentuariTypography>
				)}
				<CentuariTypography className="text-2xl md:text-4xl font-semibold mt-1 md:mt-2">
					Welcome To Centuari
				</CentuariTypography>
			</div>

			<div className="relative z-20 w-full md:w-auto">
				<StatRow
					items={[
						{
							id: "tour-total-balance",
							icon: <IcWalletColorCentuari className="w-8 h-8 md:w-6 md:h-6" />,
							label: "Total Deposits",
							value: (
								<CurrencyValue value={totalDeposit} decimalPlaces={2} compact />
							),
						},
						{
							id: "tour-active-loans",
							icon: (
								<IcPieChartColorCentuari className="w-8 h-8 md:w-6 md:h-6" />
							),
							label: "Active Loans",
							value: (
								<CurrencyValue value={activeLoans} decimalPlaces={2} compact />
							),
						},
					]}
					showSeparator
					layout="grid"
					statCardVariant="centered"
				/>
			</div>
		</div>
	);
}
