"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CentuariButton } from "@/components/centuari-button";
import { CentuariTypography } from "@/components/centuari-typography";

export type CollateralDialogAsset = {
	logo: string;
	label: string;
	tokenAddress: `0x${string}`;
};

type CollateralDialogShellProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	asset: CollateralDialogAsset | null;
	title: string;
	body: ReactNode;
	confirmLabel: string;
	confirmVariant?: "primary" | "destructive";
	onConfirm: () => Promise<void> | void;
};

function CollateralDialogShell({
	open,
	onOpenChange,
	asset,
	title,
	body,
	confirmLabel,
	confirmVariant = "primary",
	onConfirm,
}: CollateralDialogShellProps) {
	const [loading, setLoading] = useState(false);

	const handleConfirm = async () => {
		setLoading(true);
		try {
			await onConfirm();
		} finally {
			setLoading(false);
			onOpenChange(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(v) => {
				if (!loading) onOpenChange(v);
			}}
		>
			<DialogContent
				showCloseButton={false}
				className="flex max-h-[min(600px,80vh)] flex-col gap-0 p-0 sm:max-w-md data-[state=open]:!zoom-in-0 data-[state=open]:duration-600"
			>
				<DialogHeader className="contents space-y-0 text-left">
					<div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
						<div className="absolute w-[568px] h-[450px] -top-72 left-0 bg-primary-blue-base/50 blur-[264px] opacity-100 transition-opacity duration-500" />
						<div className="absolute w-[150px] h-[216px] -top-60 left-1/3 bg-white blur-3xl opacity-100 transition-opacity duration-500" />
					</div>
					<div className="mt-6 px-6 flex items-center justify-center flex-col gap-4 pb-6 z-50">
						{asset && (
							<>
								<div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
									<Image
										src={asset.logo}
										alt={asset.label}
										width={64}
										height={64}
										className="w-full h-full object-cover"
										unoptimized
										onError={(e) => {
											const target = e.target as HTMLImageElement;
											target.src = "/tokens/eth-icon.webp";
										}}
									/>
								</div>
								<CentuariTypography className="text-xl font-medium">
									{asset.label}
								</CentuariTypography>
							</>
						)}
						<CentuariTypography className="text-2xl font-semibold text-center">
							{title}
						</CentuariTypography>
						<div className="text-center text-muted-foreground text-sm leading-relaxed">
							{body}
						</div>
					</div>
				</DialogHeader>
				<DialogFooter className="flex-row gap-2 items-center px-6 py-4">
					<DialogClose asChild>
						<CentuariButton
							variant="secondary"
							className="flex-1"
							disabled={loading}
						>
							Cancel
						</CentuariButton>
					</DialogClose>
					<Button
						variant={confirmVariant}
						onClick={handleConfirm}
						className="flex-1"
						disabled={loading}
					>
						{loading ? (
							<>
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								Processing...
							</>
						) : (
							confirmLabel
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

type DialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	asset: CollateralDialogAsset | null;
	onConfirm: () => Promise<void> | void;
};

export function FlagCollateralDialog(props: DialogProps) {
	return (
		<CollateralDialogShell
			{...props}
			title="Flag as collateral?"
			confirmLabel="Flag"
			body={
				<>
					This queues the asset to be flagged at your next match settlement. No
					wallet signature, no gas. The flag applies once the matching engine
					picks it up.
				</>
			}
		/>
	);
}

export function FlagCollateralUrgentDialog(props: DialogProps) {
	return (
		<CollateralDialogShell
			{...props}
			title="Flag now (urgent)"
			confirmLabel="Sign & flag"
			body={
				<>
					Direct on-chain flag via your wallet. <strong>Gas required.</strong>{" "}
					Use this only when you need the flag to apply before the next match —
					for example, when your health factor is approaching liquidation.
				</>
			}
		/>
	);
}

export function RemovePendingDialog(props: DialogProps) {
	return (
		<CollateralDialogShell
			{...props}
			title="Remove pending flag?"
			confirmLabel="Remove"
			body={
				<>
					Clears the queued collateral flag for this asset. No on-chain action.
					You can re-queue at any time.
				</>
			}
		/>
	);
}

export function RemoveCollateralDialog(props: DialogProps) {
	return (
		<CollateralDialogShell
			{...props}
			title="Remove as collateral?"
			confirmLabel="Unflag"
			confirmVariant="destructive"
			body={
				<>
					This submits an on-chain unflag. It will be rejected if removing this
					asset drops your health factor below 1. Rate-limited to 5 unflag
					attempts per wallet per 24h.
				</>
			}
		/>
	);
}
