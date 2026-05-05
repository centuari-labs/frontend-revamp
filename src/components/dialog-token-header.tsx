import Image from "next/image";
import Link from "next/link";
import { Info } from "lucide-react";
import { CentuariTypography } from "./centuari-typography";
import { CentuariTooltip } from "./centuari-tooltip";

interface StatItem {
	label: string;
	tooltip: string;
	value: string;
}

interface DialogTokenHeaderProps {
	tokenImage: string;
	tokenName: string;
	tokenSymbol: string;
	stats: StatItem[];
	showMarketBanner?: boolean;
}

export function DialogTokenHeader({
	tokenImage,
	tokenName,
	tokenSymbol,
	stats,
	showMarketBanner = true,
}: DialogTokenHeaderProps) {
	return (
		<>
			<div
				id="tour-dialog-asset-overview"
				className="flex flex-col items-center justify-center gap-2 mt-6"
			>
				<Image
					src={tokenImage}
					alt={tokenName}
					width={76.5}
					height={76.5}
				/>
				<CentuariTypography variant="h4">{tokenSymbol}</CentuariTypography>
				<div className="flex w-full items-center justify-around mt-4 px-6">
					{stats.map((stat) => (
						<div key={stat.label}>
							<CentuariTypography
								className="flex items-center gap-1 text-muted-foreground"
								variant="b3"
							>
								{stat.label}{" "}
								<CentuariTooltip message={stat.tooltip}>
									<Info size={16} />
								</CentuariTooltip>
							</CentuariTypography>
							<CentuariTypography variant="h5" className="text-center">
								{stat.value}
							</CentuariTypography>
						</div>
					))}
				</div>
			</div>
			{showMarketBanner && (
				<div
					id="tour-dialog-market-banner"
					className="text-sm mt-3 text-primary-blue-20 bg-primary-blue-base/10 border border-primary-blue-base/10 py-2 text-center mx-6 self-stretch rounded-md"
				>
					Go to{" "}
					<Link href="/market" className="font-medium !underline">
						Market View
					</Link>{" "}
					to select other maturities.
				</div>
			)}
		</>
	);
}
