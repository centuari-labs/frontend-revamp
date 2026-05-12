"use client";

import * as React from "react";
import {
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
	type ColumnDef,
} from "@tanstack/react-table";
import { ArrowLeft, ArrowRight, Wallet } from "lucide-react";
import Image from "next/image";
import { cn, truncateBalance } from "@/lib/utils";
import {
	CentuariGlassLayers,
	CentuariGlassSurface,
} from "@/components/centuari-glass-surface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { CentuariTooltip } from "@/components/centuari-tooltip";
import {
	FlagCollateralDialog,
	FlagCollateralUrgentDialog,
	RemoveCollateralDialog,
	RemovePendingDialog,
	type CollateralDialogAsset,
} from "@/components/use-asset-as-collateral-dialog";
import { useCountdown } from "@/hooks/use-countdown";
import { useFlagCollateral } from "@/hooks/use-flag-collateral";
import { useFlagCollateralDirect } from "@/hooks/use-flag-collateral-direct";
import { useUnflagCollateral } from "@/hooks/use-unflag-collateral";

export type AssetProps = {
	id: string;
	tokenAddress: `0x${string}`;
	assetImg: string;
	assetName: string;
	assetSymbol: string;
	walletBalance: number;
	amountInUsd: number;
	/** On-chain truth from `user_balance.used_as_collateral`. */
	usedAsCollateral: boolean;
	/** Queued pre-settlement flag (intent, not yet on-chain). */
	pendingCollateralFlag: boolean;
	/** Unix seconds; `0` when not flagged. */
	flaggedAt: number;
	/** Unix seconds; `0` when not flagged. `flaggedAt + 86_400` otherwise. */
	unlocksAt: number;
};

interface DataTableAssetsProps {
	assets: AssetProps[];
	page?: number;
	totalData?: number;
	totalPages?: number;
	onPageChange?: (page: number) => void;
	pageSize?: number;
}

type RowDialog =
	| { kind: "flag"; asset: CollateralDialogAsset; tokenAddress: `0x${string}` }
	| {
			kind: "urgent";
			asset: CollateralDialogAsset;
			tokenAddress: `0x${string}`;
	  }
	| {
			kind: "remove-pending";
			asset: CollateralDialogAsset;
			tokenAddress: `0x${string}`;
	  }
	| {
			kind: "remove-collateral";
			asset: CollateralDialogAsset;
			tokenAddress: `0x${string}`;
	  };

function CollateralBadge({ asset }: { asset: AssetProps }) {
	const { remainingSec, formatted } = useCountdown(asset.unlocksAt);

	if (asset.usedAsCollateral) {
		const showCountdown = asset.unlocksAt > 0 && remainingSec > 0;
		return (
			<Badge variant="success" className="gap-1.5">
				Collateral
				{showCountdown && (
					<span className="opacity-70 font-normal">· {formatted}</span>
				)}
			</Badge>
		);
	}
	if (asset.pendingCollateralFlag) {
		return <Badge variant="warning">Pending</Badge>;
	}
	return <span className="text-white/30 text-xs">—</span>;
}

function CollateralActions({
	asset,
	onOpenDialog,
}: {
	asset: AssetProps;
	onOpenDialog: (dialog: RowDialog) => void;
}) {
	const { remainingSec } = useCountdown(asset.unlocksAt);
	const dialogAsset: CollateralDialogAsset = {
		logo: asset.assetImg,
		label: asset.assetName,
		tokenAddress: asset.tokenAddress,
	};

	if (asset.usedAsCollateral) {
		const isLocked = asset.unlocksAt > 0 && remainingSec > 0;
		return (
			<Button
				size="sm"
				variant="destructive"
				disabled={isLocked}
				onClick={() =>
					onOpenDialog({
						kind: "remove-collateral",
						asset: dialogAsset,
						tokenAddress: asset.tokenAddress,
					})
				}
			>
				Remove as collateral
			</Button>
		);
	}
	if (asset.pendingCollateralFlag) {
		return (
			<Button
				size="sm"
				variant="ghost"
				onClick={() =>
					onOpenDialog({
						kind: "remove-pending",
						asset: dialogAsset,
						tokenAddress: asset.tokenAddress,
					})
				}
			>
				Remove pending
			</Button>
		);
	}
	return (
		<div className="flex items-center gap-2 justify-end">
			<Button
				size="sm"
				variant="primary"
				onClick={() =>
					onOpenDialog({
						kind: "flag",
						asset: dialogAsset,
						tokenAddress: asset.tokenAddress,
					})
				}
			>
				Flag as collateral
			</Button>
			<Button
				size="sm"
				variant="ghost"
				onClick={() =>
					onOpenDialog({
						kind: "urgent",
						asset: dialogAsset,
						tokenAddress: asset.tokenAddress,
					})
				}
			>
				Flag now (urgent)
			</Button>
		</div>
	);
}

export function DataTableAssets({
	assets,
	page: serverPage,
	totalData,
	totalPages,
	onPageChange,
	pageSize = 10,
}: DataTableAssetsProps) {
	const [activeDialog, setActiveDialog] = React.useState<RowDialog | null>(
		null,
	);
	const flagMutation = useFlagCollateral();
	const flagDirectMutation = useFlagCollateralDirect();
	const unflagMutation = useUnflagCollateral();

	const closeDialog = () => setActiveDialog(null);

	const columns: ColumnDef<AssetProps>[] = React.useMemo(
		() => [
			{
				accessorKey: "assetName",
				header: "Assets",
				cell: ({ row }) => {
					const asset = row.original;
					return (
						<div className="flex items-center gap-3 min-w-0">
							<div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
								<Image
									src={asset.assetImg}
									alt={asset.assetName}
									width={24}
									height={24}
									className="w-full h-full object-cover"
									unoptimized
								/>
							</div>
							<CentuariTooltip message={asset.assetName}>
								<span className="font-medium text-white">
									{asset.assetName.length > 8
										? `${asset.assetName.slice(0, 8)}...`
										: asset.assetName}
								</span>
							</CentuariTooltip>
						</div>
					);
				},
			},
			{
				accessorKey: "walletBalance",
				header: "Wallet Balance",
				cell: ({ row }) => {
					const asset = row.original;
					return (
						<div className="flex items-center gap-1.5">
							<span className="text-white font-medium">
								{truncateBalance(asset.walletBalance, 2)}
							</span>
							<span className="text-white/40">
								{asset.assetSymbol.toUpperCase()}
							</span>
						</div>
					);
				},
			},
			{
				accessorKey: "amountInUsd",
				header: () => <p className="text-center">Amount in USD</p>,
				cell: ({ row }) => {
					const amount = row.original.amountInUsd;
					const formatted = new Intl.NumberFormat("en-US", {
						style: "currency",
						currency: "USD",
						minimumFractionDigits: 2,
						maximumFractionDigits: 2,
					}).format(amount);
					const [main, cents] = formatted.split(".");
					return (
						<div className="font-medium text-center text-white">
							{main}
							<span className="text-white/40">.{cents}</span>
						</div>
					);
				},
			},
			{
				id: "collateralStatus",
				header: () => <p className="text-center">Collateral</p>,
				cell: ({ row }) => (
					<div className="flex justify-center">
						<CollateralBadge asset={row.original} />
					</div>
				),
			},
			{
				id: "collateralActions",
				header: () => <p className="text-right pr-2">Action</p>,
				cell: ({ row }) => (
					<div className="flex justify-end">
						<CollateralActions
							asset={row.original}
							onOpenDialog={setActiveDialog}
						/>
					</div>
				),
			},
		],
		[],
	);

	const isServerPagination = !!onPageChange;
	const [pagination, setPagination] = React.useState({
		pageIndex: 0,
		pageSize,
	});

	const table = useReactTable({
		data: assets,
		columns,
		getCoreRowModel: getCoreRowModel(),
		...(isServerPagination
			? { manualPagination: true, pageCount: totalPages ?? -1 }
			: { getPaginationRowModel: getPaginationRowModel() }),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onPaginationChange: setPagination,
		autoResetPageIndex: false,
		state: {
			pagination: isServerPagination
				? { pageIndex: (serverPage ?? 1) - 1, pageSize }
				: pagination,
		},
	});

	return (
		<>
			<FlagCollateralDialog
				open={activeDialog?.kind === "flag"}
				onOpenChange={(o) => !o && closeDialog()}
				asset={activeDialog?.kind === "flag" ? activeDialog.asset : null}
				onConfirm={async () => {
					if (activeDialog?.kind !== "flag") return;
					await flagMutation.mutateAsync({ asset: activeDialog.tokenAddress });
				}}
			/>
			<FlagCollateralUrgentDialog
				open={activeDialog?.kind === "urgent"}
				onOpenChange={(o) => !o && closeDialog()}
				asset={activeDialog?.kind === "urgent" ? activeDialog.asset : null}
				onConfirm={async () => {
					if (activeDialog?.kind !== "urgent") return;
					await flagDirectMutation.mutateAsync({
						asset: activeDialog.tokenAddress,
					});
				}}
			/>
			<RemovePendingDialog
				open={activeDialog?.kind === "remove-pending"}
				onOpenChange={(o) => !o && closeDialog()}
				asset={
					activeDialog?.kind === "remove-pending" ? activeDialog.asset : null
				}
				onConfirm={async () => {
					if (activeDialog?.kind !== "remove-pending") return;
					await unflagMutation.mutateAsync({
						asset: activeDialog.tokenAddress,
					});
				}}
			/>
			<RemoveCollateralDialog
				open={activeDialog?.kind === "remove-collateral"}
				onOpenChange={(o) => !o && closeDialog()}
				asset={
					activeDialog?.kind === "remove-collateral" ? activeDialog.asset : null
				}
				onConfirm={async () => {
					if (activeDialog?.kind !== "remove-collateral") return;
					await unflagMutation.mutateAsync({
						asset: activeDialog.tokenAddress,
					});
				}}
			/>
			<div className="group/glass relative w-full overflow-hidden flex flex-col h-full rounded-xl bg-transparent border-0 isolate">
				<CentuariGlassLayers intensity="soft" />
				<h1 className="text-white text-lg font-normal py-3.5 px-6 flex-shrink-0">
					My Assets
				</h1>
				<div className="flex-1 overflow-y-auto overflow-x-hidden max-h-[300px] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/40">
					<Table className="w-full">
						<TableHeader>
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow
									key={headerGroup.id}
									className="bg-white/5 border-none"
								>
									{headerGroup.headers.map((header, index) => (
										<TableHead
											key={header.id}
											className={cn(
												"text-white/60 font-normal h-12",
												index === 0 && "pl-6",
												index === headerGroup.headers.length - 1 && "pr-6",
											)}
										>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</TableHead>
									))}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{table.getRowModel().rows?.length ? (
								table.getRowModel().rows.map((row) => (
									<TableRow
										key={row.id}
										className="border-none hover:bg-white/5 transition-colors h-8"
									>
										{row.getVisibleCells().map((cell, index) => (
											<TableCell
												key={cell.id}
												className={cn(
													"py-2",
													index === 0 && "pl-6",
													index === row.getVisibleCells().length - 1 && "pr-6",
												)}
											>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext(),
												)}
											</TableCell>
										))}
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={columns.length} className="h-[300px]">
										<div className="flex flex-col items-center justify-center gap-3">
											<CentuariGlassSurface
												intensity="soft"
												className="rounded-xl p-3"
											>
												<Wallet size={22} className="text-white/40" />
											</CentuariGlassSurface>
											<span className="text-sm text-white/40">
												You don&apos;t have any assets yet
											</span>
										</div>
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
				<div className="group/glass relative flex flex-col sm:flex-row flex-shrink-0 w-full items-center justify-between py-2 px-6 border-t border-white/5 gap-4 sm:gap-0 isolate overflow-hidden">
					<CentuariGlassLayers intensity="soft" />
					<div className="relative z-20 flex items-center gap-2 text-sm">
						<span className="text-white font-medium">
							Page{" "}
							{isServerPagination
								? (serverPage ?? 1)
								: table.getState().pagination.pageIndex + 1}{" "}
							of{" "}
							{isServerPagination
								? (totalPages ?? 1)
								: table.getPageCount() || 1}
						</span>
						<span className="text-white/20">•</span>
						<span className="text-white/40">
							Showing {table.getRowModel().rows.length} of{" "}
							{isServerPagination ? (totalData ?? 0) : assets.length} Data
						</span>
					</div>
					<div className="relative z-20 flex items-center gap-2">
						<Button
							variant="outline"
							size="icon"
							className="w-8 h-8 rounded-lg bg-white/5 border-none hover:bg-white/10"
							onClick={() => {
								if (isServerPagination && onPageChange) {
									onPageChange(Math.max(1, Number(serverPage ?? 1) - 1));
								} else {
									table.previousPage();
								}
							}}
							disabled={
								isServerPagination
									? Number(serverPage ?? 1) <= 1
									: !table.getCanPreviousPage()
							}
						>
							<ArrowLeft size={16} className="text-white" />
						</Button>
						<Button
							variant="outline"
							size="icon"
							className="w-8 h-8 rounded-lg bg-white/5 border-none hover:bg-white/10"
							onClick={() => {
								if (isServerPagination && onPageChange) {
									onPageChange(
										Math.min(
											Number(totalPages ?? 1),
											Number(serverPage ?? 1) + 1,
										),
									);
								} else {
									table.nextPage();
								}
							}}
							disabled={
								isServerPagination
									? Number(serverPage ?? 1) >= Number(totalPages ?? 1)
									: !table.getCanNextPage()
							}
						>
							<ArrowRight size={16} className="text-white" />
						</Button>
					</div>
				</div>
			</div>
		</>
	);
}
