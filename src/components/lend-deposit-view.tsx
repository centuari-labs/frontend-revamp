import { forwardRef } from "react";
import Image from "next/image";
import { ArrowLeft, AlertTriangle, Loader2 } from "lucide-react";
import { CentuariTypography } from "./centuari-typography";
import { CentuariInput } from "./centuari-input";
import { CentuariAlert } from "./centuari-alert";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { getTokenLogo } from "@/lib/tokens";
import { truncateBalance } from "@/lib/utils";
import { ACTIVE_CHAIN_LABEL } from "@/lib/chain-config";
import type { Token } from "@/types";

interface LendDepositViewProps {
	viewMode: string;
	onBack: () => void;
	reactId: string;
	// Chain switching
	isWrongNetwork: boolean;
	switchingChain: boolean;
	onSwitchChain: () => void;
	// Token selection
	depositTokens: Token[];
	depositTokensLoading: boolean;
	depositSelectedTokenId: string;
	onTokenChange: (id: string) => void;
	depositTokenIcon: string;
	depositSelectedTokenSymbol: string;
	// Amount
	depositDisplayAmount: string;
	onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onMaxClick: () => void;
	// Balance
	depositOnChainBalance: number;
	depositBalanceLoading: boolean;
	depositAmountExceedsBalance: boolean;
	// Processing
	isDepositProcessing: boolean;
	// Navigation
	onFaucetClick: () => void;
	// Submit
	onSubmit: () => void;
}

export const LendDepositView = forwardRef<HTMLDivElement, LendDepositViewProps>(
	function LendDepositView(
		{
			viewMode,
			onBack,
			reactId,
			isWrongNetwork,
			switchingChain,
			onSwitchChain,
			depositTokens,
			depositTokensLoading,
			depositSelectedTokenId,
			onTokenChange,
			depositTokenIcon,
			depositSelectedTokenSymbol,
			depositDisplayAmount,
			onAmountChange,
			onMaxClick,
			depositOnChainBalance,
			depositBalanceLoading,
			depositAmountExceedsBalance,
			isDepositProcessing,
			onFaucetClick,
			onSubmit,
		},
		ref,
	) {
		return (
			<div
				ref={ref}
				className={
					viewMode === "deposit-lend"
						? "relative mt-6 px-6"
						: "absolute inset-0 pointer-events-none mt-6 px-6"
				}
				style={{ opacity: viewMode === "deposit-lend" ? 1 : 0 }}
			>
				<Button
					variant="ghost"
					size="sm"
					onClick={onBack}
					className="mb-4 -ml-2"
					type="button"
					disabled={isDepositProcessing}
				>
					<ArrowLeft size={16} />
				</Button>
				<div className="flex flex-col items-center justify-center text-center">
					<Image
						src={"/centuari-logo.png"}
						width={48}
						height={48}
						alt="centuari-logo"
					/>
					<CentuariTypography variant="h1" className="mt-8">
						Deposit to Your Vault
					</CentuariTypography>
					<CentuariTypography
						variant="b3"
						className="mb-1 text-muted-foreground mt-3"
					>
						Select the asset and amount you want to add, and power up your
						Centuari balance.
					</CentuariTypography>
				</div>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						onSubmit();
					}}
				>
					<div className="w-full space-y-2 mt-3.5">
						<Label>Select Chain</Label>
						{isWrongNetwork ? (
							<button
								type="button"
								onClick={onSwitchChain}
								disabled={switchingChain}
								className="flex w-full items-center gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-400 transition-colors hover:bg-yellow-500/20 disabled:opacity-50"
							>
								{switchingChain ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<AlertTriangle className="h-4 w-4" />
								)}
								<span className="flex-1 text-left">
									{switchingChain
										? "Switching..."
										: `Switch to ${ACTIVE_CHAIN_LABEL}`}
								</span>
								<img
									src="https://assets.coingecko.com/coins/images/16547/standard/arb.jpg?1721358242"
									alt={ACTIVE_CHAIN_LABEL}
									width={20}
									height={20}
									className="size-5 rounded-full object-cover"
								/>
							</button>
						) : (
							<Select value="arbitrum-sepolia" disabled>
								<SelectTrigger className="!h-9 border-0 bg-transparent px-2 py-1 focus:ring-0 focus:ring-offset-0 gap-1 w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="z-[120] bg-white/5 backdrop-blur-[140px]">
									<SelectGroup>
										<SelectItem value="arbitrum-sepolia">
											<img
												src="https://assets.coingecko.com/coins/images/16547/standard/arb.jpg?1721358242"
												alt="Arbitrum Sepolia"
												width={16}
												height={16}
												className="size-4 rounded-full object-cover"
											/>
											Arbitrum Sepolia
										</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
						)}
					</div>
					<div className="w-full space-y-2 mt-3.5">
						<Label>Select Token</Label>
						<Select
							value={depositSelectedTokenId}
							onValueChange={onTokenChange}
							disabled={depositTokensLoading || isDepositProcessing}
						>
							<SelectTrigger className="!h-9 border-0 bg-transparent px-2 py-1 focus:ring-0 focus:ring-offset-0 gap-1 w-full">
								<SelectValue
									placeholder={
										depositTokensLoading ? "Loading..." : "Select Token"
									}
								/>
							</SelectTrigger>
							<SelectContent className="z-[120] bg-white/5 backdrop-blur-[140px]">
								<SelectGroup>
									{depositTokens?.map((token) => (
										<SelectItem key={token.id} value={token.id}>
											<Image
												src={getTokenLogo(
													token.symbol,
													token.imageUrl ?? undefined,
												)}
												width={16}
												height={16}
												alt={token.symbol}
											/>
											{token.symbol}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
					<CentuariInput
						id={`deposit-amount-${reactId}`}
						label="Deposit Amount"
						size="large"
						showTooltip={false}
						placeholder="0"
						leftIcon={
							<Image
								src={depositTokenIcon}
								width={16}
								height={16}
								alt={depositSelectedTokenSymbol}
							/>
						}
						className="mt-0"
						containerClassName="mt-3.5"
						value={depositDisplayAmount}
						onChange={onAmountChange}
						disabled={isDepositProcessing}
						type="text"
						inputMode="decimal"
						balanceText={
							!depositBalanceLoading && depositOnChainBalance != null ? (
								<span className="flex items-center gap-1 text-xs text-muted-foreground">
									Balance: {truncateBalance(depositOnChainBalance)}{" "}
									{depositSelectedTokenSymbol}
									<button
										type="button"
										onClick={onMaxClick}
										className="text-primary-blue-base hover:underline font-medium ml-1"
									>
										Max
									</button>
								</span>
							) : null
						}
					/>
					{depositAmountExceedsBalance && (
						<CentuariAlert
							variant="destructive"
							text="Insufficient wallet balance"
							description="Get testnet tokens from the faucet"
							className="mt-1.5"
							action={
								<Button
									variant="destructive"
									size="sm"
									type="button"
									onClick={onFaucetClick}
								>
									Deposit
								</Button>
							}
						/>
					)}
				</form>
			</div>
		);
	},
);
