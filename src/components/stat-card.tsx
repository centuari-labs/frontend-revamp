"use client";

import { CentuariGlassSurface } from "@/components/centuari-glass-surface";
import { CentuariTypography } from "@/components/centuari-typography";
import { cn } from "@/lib/utils";

export interface StatCardProps {
	icon?: React.ReactNode;
	label: string;
	value: React.ReactNode;
	variant?: "default" | "withIcon" | "compact" | "centered";
	labelClassName?: string;
	valueClassName?: string;
	iconWrapperClassName?: string;
	className?: string;
	id?: string;
}

export function StatCard({
	icon,
	label,
	value,
	variant = "default",
	labelClassName,
	valueClassName,
	iconWrapperClassName,
	className,
	id,
}: StatCardProps) {
	const isCentered = variant === "centered";
	const withIcon = (variant === "withIcon" || variant === "centered") && icon;

	return (
		<div
			id={id}
			className={cn(
				"flex flex-col items-center md:flex-row md:items-center gap-3 md:gap-4",
				isCentered && "text-center md:text-left",
				className,
			)}
		>
			{withIcon && (
				<CentuariGlassSurface
					intensity="soft"
					className={cn(
						"p-3 rounded-xl flex items-center",
						iconWrapperClassName,
					)}
				>
					{icon}
				</CentuariGlassSurface>
			)}
			<div className={cn(isCentered && "text-center md:text-left")}>
				<CentuariTypography
					className={cn(
						"text-xs md:text-sm text-muted-foreground",
						variant === "compact" && "text-sm",
						labelClassName,
					)}
				>
					{label}
				</CentuariTypography>
				<div
					className={cn(
						"text-lg md:text-2xl font-semibold mt-1",
						variant === "compact" && "text-base",
						valueClassName,
					)}
				>
					{value}
				</div>
			</div>
		</div>
	);
}
