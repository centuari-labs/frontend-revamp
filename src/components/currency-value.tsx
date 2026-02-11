"use client";

import { cn, formatCurrencyParts } from "@/lib/utils";

export interface CurrencyValueProps {
  value: number;
  decimalPlaces?: number;
  className?: string;
  decimalClassName?: string;
}

export function CurrencyValue({
  value,
  decimalPlaces = 3,
  className,
  decimalClassName = "text-[#2B2F37]",
}: CurrencyValueProps) {
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
