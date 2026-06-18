"use client";

import Link from "next/link";
import { CentuariButton } from "@/components/centuari-button";
import { CentuariTypography } from "@/components/centuari-typography";

export function CollateralEmptyState({
	compact = false,
}: {
	compact?: boolean;
}) {
	return (
		<div className="rounded-[8px] border border-primary-blue-base/10 bg-primary-blue-base/10 p-1 flex items-center justify-between">
			<div className="flex flex-col items-start">
				<CentuariTypography
					className={
						compact
							? "text-xs font-medium text-primary-blue-20"
							: "text-sm font-medium text-primary-blue-20"
					}
				>
					Add assets in your portfolio to proceed.
				</CentuariTypography>
				{/* <CentuariTypography
          className={
            compact ? "text-[10px] text-primary-blue-20/50" : "text-xs text-primary-blue-20/50"
          }
        >
          
        </CentuariTypography> */}
			</div>
			<Link href="/portfolio" className="shrink-0">
				<CentuariButton
					variant="secondary"
					size="sm"
					className={
						compact
							? "rounded-lg bg-white/5 hover:bg-white/10 text-xs"
							: "rounded-lg bg-white/5 hover:bg-white/10"
					}
				>
					Add Assets
				</CentuariButton>
			</Link>
		</div>
	);
}
