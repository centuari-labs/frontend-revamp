"use client";

import { cn, formatCompactCurrency, formatCurrencyParts } from "@/lib/utils";

export interface CurrencyValueProps {
	value: number;
	decimalPlaces?: number;
	compact?: boolean;
	className?: string;
	decimalClassName?: string;
}

export function CurrencyValue({
	value,
	decimalPlaces = 3,
	compact = false,
	className,
	decimalClassName = "text-[#2B2F37]",
}: CurrencyValueProps) {
	if (compact && Math.abs(value) >= 1e6) {
		return (
			<span className={cn(className)}>
				{formatCompactCurrency(value, decimalPlaces)}
			</span>
		);
	}

	const parts = formatCurrencyParts(value, decimalPlaces);

	return (
		<span className={cn(className)}>
			{parts.integer}
			{parts.decimal && (
				<span className={decimalClassName}>{parts.decimal}</span>
			)}
		</span>
	);
}
