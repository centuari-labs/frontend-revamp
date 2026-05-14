"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import {
	CentuariGlassLayers,
	CentuariGlassSurface,
} from "./centuari-glass-surface";
import { CentuariTooltip } from "./centuari-tooltip";
import { ArrowRight, InfoIcon } from "lucide-react";
import { CentuariTypography } from "./centuari-typography";
import { CentuariBorrowDialog } from "./centuari-borrow-dialog";
import { CentuariLendDialog } from "./centuari-lend-dialog";
import { useRouter } from "next/navigation";
import { randomIntInRange } from "@/lib/utils";

export const CentuariTokenCard = ({
	token_image,
	token_name,
	token_symbol,
	id,
	asset_id,
	market_id,
	borrow_rate,
	lend_rate,
	collateral_factor,
}: {
	token_image: string;
	token_name: string;
	token_symbol: string;
	id: number;
	asset_id: string;
	market_id?: string;
	borrow_rate: number;
	lend_rate: number;
	collateral_factor: number;
}) => {
	const router = useRouter();

	const rates = {
		borrowAPR: `${borrow_rate}%`,
		lendAPR: `${lend_rate}%`,
		collateralFactor: `${Math.ceil(collateral_factor)}%`,
	};

	const [vaultTotal] = useState(() => randomIntInRange(50000, 500000));

	return (
		<Card
			id={`tour-token-card-${id}`}
			className="w-full p-3 md:p-4 gap-2 bg-transparent border-0 relative group group/glass isolate overflow-hidden rounded-2xl transition-all duration-300"
		>
			<CentuariGlassLayers intensity="soft" sheen={false} />
			<CardHeader className="relative z-20 gap-0 pb-0">
				<div className="flex flex-col items-center gap-3 md:gap-4">
					<CardTitle>
						<Image
							src={token_image}
							alt={token_name}
							width={68}
							height={68}
							className="w-12 h-12 md:w-[68px] md:h-[68px]"
						/>
					</CardTitle>
					<CentuariTypography variant="b1" className="text-sm md:text-base">
						{token_symbol}
					</CentuariTypography>
				</div>
			</CardHeader>
			<CardContent
				id={`tour-token-card-${id}-content`}
				className="relative z-20 px-0"
			>
				<CentuariGlassSurface
					intensity="soft"
					className="p-3 md:p-4 rounded-xl w-full"
				>
					<div className="flex flex-col w-full gap-3 md:gap-4">
						{[
							{
								label: "Borrow APR",
								value: rates.borrowAPR,
								tooltipMessage:
									"The fixed interest rate you pay when borrowing.",
							},
							{
								label: "Lend APR",
								value: rates.lendAPR,
								tooltipMessage:
									"The fixed return you earn when lending your assets.",
							},
							{
								label: "Collateral Factor",
								value: rates.collateralFactor,
								tooltipMessage:
									"The percentage of your asset’s value you can borrow against.",
							},
						].map(({ label, value, tooltipMessage }, i) => (
							<div
								key={label}
								className={`flex items-center justify-between ${
									i < 2 ? "border-b border-dashed border-white/10 pb-2" : ""
								}`}
							>
								<p className="text-xs md:text-sm">{label}</p>
								<div className="flex items-center gap-1">
									<p className="text-xs md:text-sm">{value}</p>
									<CentuariTooltip message={tooltipMessage}>
										<InfoIcon size={12} />
									</CentuariTooltip>
								</div>
							</div>
						))}
					</div>
				</CentuariGlassSurface>
			</CardContent>
			<CardFooter className="relative z-20 flex flex-col px-0">
				<div id={`tour-token-card-${id}-btn`} className="flex gap-2 w-full">
					<CentuariBorrowDialog
						token_image={token_image}
						token_name={token_name}
						token_symbol={token_symbol}
						lendAPR={rates.lendAPR}
						borrowAPR={rates.borrowAPR}
						collateralFactor={rates.collateralFactor}
						vaultTotal={vaultTotal}
						asset_id={asset_id}
						market_id={market_id}
					/>
					<CentuariLendDialog
						token_image={token_image}
						token_name={token_name}
						token_symbol={token_symbol}
						lendAPR={rates.lendAPR}
						borrowAPR={rates.borrowAPR}
						collateralFactor={rates.collateralFactor}
						vaultTotal={vaultTotal}
						asset_id={asset_id}
						market_id={market_id}
					/>
				</div>
				<Button
					className="w-full flex items-center justify-center mt-3 md:mt-4 gap-2 text-xs md:text-sm bg-transparent hover:bg-transparent text-white"
					onClick={() => router.push(`/market?token=${asset_id}`)}
				>
					<span
						className="relative flex items-center gap-2 group hover:after:w-full after:absolute after:bottom-0 after:left-0 after:h-px after:bg-white after:w-0 after:transition-all after:duration-300"
						id={`tour-token-card-${id}-btn-view`}
					>
						View Market for Details
						<ArrowRight size={12} />
					</span>
				</Button>
			</CardFooter>
			<div className="pointer-events-none absolute -z-10 w-142 h-112.5 top-24 -left-22.5 bg-[#1D7656]/30 blur-[264px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
			<div className="pointer-events-none absolute -z-10 w-md h-54 top-87.5 -left-8.75 bg-primary-blue-base/60 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
		</Card>
	);
};
