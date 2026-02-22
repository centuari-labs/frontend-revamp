"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { CentuariTypography } from "@/components/centuari-typography";
import type { FaucetToken } from "@/lib/faucet-tokens";

const CATEGORY_LABELS: Record<FaucetToken["category"], string> = {
  stablecoin: "Stablecoin",
  crypto: "Crypto",
  stock: "Stock",
  commodity: "Commodity",
};

interface FaucetTokenCardProps {
  token: FaucetToken;
  selected: boolean;
  onToggle: (value: string) => void;
}

export function FaucetTokenCard({
  token,
  selected,
  onToggle,
}: FaucetTokenCardProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(token.value)}
      className={cn(
        "relative w-full flex items-stretch rounded-xl border bg-primary-blue-100/5 transition-all duration-200 hover:bg-white/[0.03] text-left",
        selected
          ? "border-primary-blue-base shadow-[0_0_12px_rgba(59,130,246,0.15)]"
          : "border-white/10"
      )}
    >
      {/* Checkbox */}
      <div className="absolute top-3 right-3">
        <div
          className={cn(
            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200",
            selected
              ? "border-primary-blue-base bg-primary-blue-base"
              : "border-white/30 bg-transparent"
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
      <div className="flex flex-col justify-center items-center gap-3 p-7 min-w-0">
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
          <CentuariTypography variant="title-lg" className="font-semibold text-center">
            {token.label}
          </CentuariTypography>
          <CentuariTypography variant="body-sm" className="text-white/40 text-center">
            {CATEGORY_LABELS[token.category]}
          </CentuariTypography>
        </div>
      </div>

      {/* Divider */}
      <div className="w-px bg-white/10" />

      {/* Right section - Drip amount */}
      <div className="flex flex-col justify-center px-4 py-4 min-w-[120px]">
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
