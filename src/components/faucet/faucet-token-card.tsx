"use client";

import { useState } from "react";
import Image from "next/image";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CentuariTypography } from "@/components/centuari-typography";
import { CentuariGlassLayers } from "@/components/centuari-glass-surface";

interface FaucetTokenCardProps {
	token: {
		value: string;
		label: string;
		icon: string;
		tokenAddress: string;
		dripAmount: number;
	};
	selected: boolean;
	onToggle: (value: string) => void;
}

export function FaucetTokenCard({
	token,
	selected,
	onToggle,
}: FaucetTokenCardProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = (e: React.MouseEvent) => {
		e.stopPropagation();
		navigator.clipboard.writeText(token.tokenAddress);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<button
			type="button"
			onClick={() => onToggle(token.value)}
			className={cn(
				"group/glass relative w-full flex items-stretch rounded-xl bg-transparent border-0 overflow-hidden isolate transition-all duration-200 text-left",
				selected && "shadow-[0_0_12px_rgba(59,130,246,0.25)]",
			)}
		>
			<CentuariGlassLayers intensity="soft" />

			{selected && (
				<span
					aria-hidden
					className="pointer-events-none absolute inset-0 rounded-[inherit] z-10 ring-1 ring-primary-blue-base/70"
				/>
			)}

			{/* Checkbox */}
			<div className="absolute top-3 right-3 z-20">
				<div
					className={cn(
						"w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200",
						selected
							? "border-primary-blue-base bg-primary-blue-base"
							: "border-white/30 bg-transparent",
					)}
				>
					{selected && (
						<svg
							width="10"
							height="10"
							viewBox="0 0 12 12"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M2.5 6L5 8.5L9.5 3.5"
								stroke="white"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					)}
				</div>
			</div>

			{/* Left section - Token info */}
			<div className="relative z-20 flex flex-col justify-center items-center gap-3 p-7 min-w-0">
				<div className="w-12 h-12 rounded-full overflow-hidden bg-white/5 flex-shrink-0 flex items-center justify-center">
					<Image
						src={token.icon}
						alt={token.label}
						width={48}
						height={48}
						className="object-contain"
					/>
				</div>
				<div className="min-w-0">
					<CentuariTypography
						variant="title-lg"
						className="font-semibold text-center"
					>
						{token.label}
					</CentuariTypography>
					<button
						type="button"
						onClick={handleCopy}
						className="flex items-center gap-1.5 mx-auto mt-1 px-2 py-1 rounded-md hover:bg-white/5 transition-colors group/copy"
					>
						<CentuariTypography
							variant="subheading-sm"
							className="text-white/40 group-hover/copy:text-white/60 transition-colors"
						>
							{copied ? "Copied!" : "Copy Address"}
						</CentuariTypography>
						{copied ? (
							<Check className="w-3 h-3 text-emerald-400" />
						) : (
							<Copy className="w-3 h-3 text-white/40 group-hover/copy:text-white/60" />
						)}
					</button>
				</div>
			</div>

			{/* Divider */}
			<div className="relative z-20 w-px bg-white/10" />

			{/* Right section - Drip amount */}
			<div className="relative z-20 flex flex-col justify-center px-4 py-4 min-w-[120px]">
				<CentuariTypography
					variant="body-sm"
					className="text-white/40 uppercase tracking-wider"
				>
					Drip Amount
				</CentuariTypography>
				<CentuariTypography variant="h1" className="font-semibold mt-1">
					{token.dripAmount.toLocaleString()}{" "}
					<span className="text-white/60 text-xs">{token.label}</span>
				</CentuariTypography>
			</div>
		</button>
	);
}
