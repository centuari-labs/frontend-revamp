"use client";

import { CentuariTypography } from "@/components/centuari-typography";
import { IcPieChartColorCentuari } from "@/components/icons/ic-pie-chart-color-centuari";
import { IcWalletColorCentuari } from "@/components/icons/ic-wallet-color-centuari";
import { CurrencyValue } from "@/components/currency-value";
import { StatCard } from "@/components/stat-card";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export interface MarketHeaderProps {
	selectedToken: { logo: string; value: string; label: string };
	totalDeposit?: number;
	activeLoans?: number;
}

export function MarketHeader({
	selectedToken,
	totalDeposit,
	activeLoans,
}: MarketHeaderProps) {
	const router = useRouter();

	return (
		<>
			{/* Mobile Header - Simple centered layout */}
			<div className="flex md:hidden items-center justify-between w-full py-4">
				<button
					type="button"
					onClick={() => router.push("/")}
					className="p-2 hover:bg-white/5 rounded-lg transition-colors"
				>
					<ArrowLeft size={24} className="text-white" />
				</button>

				<div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
					<Image
						src={selectedToken.logo}
						alt={`${selectedToken.label} Icon`}
						width={48}
						height={48}
						quality={100}
						className="size-6 object-contain"
					/>
					<CentuariTypography className="uppercase font-semibold text-lg">
						{selectedToken.label}
					</CentuariTypography>
				</div>

				<div className="w-10" />
			</div>

			{/* Desktop Header - Full layout with stats */}
			<div className="hidden md:flex justify-between items-center w-full">
				<button
					type="button"
					className="flex items-center gap-4 cursor-pointer bg-transparent border-0 p-0 text-left"
					onClick={() => router.push("/")}
				>
					<ArrowLeft size={20} />
					<div className="inline-flex items-center gap-2">
						<Image
							src={selectedToken.logo}
							alt={`${selectedToken.label} Icon`}
							width={70}
							height={70}
							quality={100}
							className="size-[35px] object-contain"
						/>
						<CentuariTypography
							className="uppercase font-semibold"
							variant="heading-md"
						>
							{selectedToken.label}
						</CentuariTypography>
					</div>
				</button>
				<div className="flex flex-col items-center md:flex-row gap-6 md:gap-12 md:mt-0 py-3.5">
					<StatCard
						icon={<IcWalletColorCentuari />}
						label="Total Deposits"
						value={
							<CurrencyValue value={totalDeposit ?? 0} decimalPlaces={2} />
						}
						variant="withIcon"
					/>
					<StatCard
						icon={<IcPieChartColorCentuari />}
						label="Active Loans"
						value={<CurrencyValue value={activeLoans ?? 0} decimalPlaces={2} />}
						variant="withIcon"
					/>
				</div>
			</div>
		</>
	);
}
