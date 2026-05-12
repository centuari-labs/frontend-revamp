"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	FlagCollateralUrgentDialog,
	type CollateralDialogAsset,
} from "@/components/use-asset-as-collateral-dialog";
import { useFlagCollateralDirect } from "@/hooks/use-flag-collateral-direct";
import type { MyAssetItem } from "@/lib/api";

const HF_WARNING_THRESHOLD = 1.2;

type CentuariHfBannerProps = {
	healthFactor: number;
	/** All wallet assets, including those not currently flagged. Used to
	 *  pick the first urgent-flag candidate (must be `usedAsCollateral=false`
	 *  AND `pendingCollateralFlag=false` — the queued path is useless in a
	 *  pre-liquidation scenario, and re-flagging an already-flagged asset
	 *  is a no-op). */
	assets: MyAssetItem[];
};

export function CentuariHfBanner({
	healthFactor,
	assets,
}: CentuariHfBannerProps) {
	const [dialogOpen, setDialogOpen] = useState(false);
	const flagDirectMutation = useFlagCollateralDirect();

	const isInDanger = healthFactor > 0 && healthFactor < HF_WARNING_THRESHOLD;

	const candidate = assets.find(
		(a) => !a.isCollateral && !a.pendingCollateralFlag,
	);

	if (!isInDanger || !candidate) return null;

	const dialogAsset: CollateralDialogAsset = {
		logo: candidate.imageUrl ?? "/tokens/default-token.svg",
		label: candidate.symbol,
		tokenAddress: candidate.tokenAddress,
	};

	return (
		<>
			<div className="flex items-start gap-3 rounded-xl border border-warning-70/40 bg-warning-base/10 px-5 py-4 mt-3">
				<AlertTriangle size={20} className="text-warning-50 shrink-0 mt-0.5" />
				<div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
					<div className="flex flex-col gap-1">
						<p className="text-sm font-medium text-warning-50">
							Health factor low ({healthFactor.toFixed(2)})
						</p>
						<p className="text-xs text-white/70">
							Your position is approaching liquidation. Consider flagging
							additional assets as collateral to improve your health factor.
						</p>
					</div>
					<Button
						variant="primary"
						size="sm"
						className="shrink-0"
						onClick={() => setDialogOpen(true)}
					>
						Flag {candidate.symbol} now (urgent)
					</Button>
				</div>
			</div>
			<FlagCollateralUrgentDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				asset={dialogAsset}
				onConfirm={async () => {
					await flagDirectMutation.mutateAsync({
						asset: candidate.tokenAddress,
					});
				}}
			/>
		</>
	);
}
