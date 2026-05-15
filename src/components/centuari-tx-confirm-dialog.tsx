"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatAddress } from "@/lib/utils";

export type TxConfirmationDetails = {
	action: "Approve" | "Deposit";
	amount: string;
	symbol: string;
	tokenAddress: `0x${string}`;
	spender: `0x${string}`;
	spenderLabel: string;
	chainName: string;
	chainId: number;
};

export interface CentuariTxConfirmDialogProps {
	open: boolean;
	details: TxConfirmationDetails | null;
	onConfirm: () => void;
	onCancel: () => void;
}

export function CentuariTxConfirmDialog({
	open,
	details,
	onConfirm,
	onCancel,
}: CentuariTxConfirmDialogProps) {
	if (!details) return null;

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (!next) onCancel();
			}}
		>
			<DialogContent
				showCloseButton={false}
				className="sm:max-w-md"
				onOpenAutoFocus={(e) => {
					e.preventDefault();
					const cancelBtn = document.querySelector<HTMLButtonElement>(
						'[data-slot="dialog-content"] button[data-confirm-action="cancel"]',
					);
					cancelBtn?.focus();
				}}
			>
				<DialogHeader>
					<DialogTitle>
						{details.action === "Approve"
							? `Approve ${details.spenderLabel}`
							: `Deposit to ${details.spenderLabel}`}
					</DialogTitle>
					<DialogDescription>
						You are about to {details.action.toLowerCase()}{" "}
						<span className="font-medium text-foreground">
							{details.amount}
						</span>
						.
					</DialogDescription>
				</DialogHeader>

				<dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-2 text-sm">
					<dt className="text-muted-foreground">Action</dt>
					<dd className="font-medium">{details.action}</dd>

					<dt className="text-muted-foreground">Amount</dt>
					<dd className="font-medium">
						{details.amount} {details.symbol}
					</dd>

					<dt className="text-muted-foreground">Token contract</dt>
					<dd className="font-mono" title={details.tokenAddress}>
						{formatAddress(details.tokenAddress)}
					</dd>

					<dt className="text-muted-foreground">Spender</dt>
					<dd className="flex flex-col gap-0.5">
						<span className="font-mono" title={details.spender}>
							{formatAddress(details.spender)}
						</span>
						<span className="text-xs text-muted-foreground">
							{details.spenderLabel}
						</span>
					</dd>

					<dt className="text-muted-foreground">Network</dt>
					<dd>
						{details.chainName}{" "}
						<span className="text-xs text-muted-foreground">
							(chain {details.chainId})
						</span>
					</dd>
				</dl>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={onCancel}
						data-confirm-action="cancel"
					>
						Cancel
					</Button>
					<Button
						type="button"
						variant="primary"
						onClick={onConfirm}
						data-confirm-action="continue"
					>
						Continue
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
