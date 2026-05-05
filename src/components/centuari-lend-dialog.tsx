"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { CentuariButton } from "./centuari-button";
import { CentuariGlassButton } from "./centuari-glass-button";
import { TransactionSuccessDialog } from "./transaction-success-dialog";
import { LendMainView } from "./lend-main-view";
import { LendDepositView } from "./lend-deposit-view";
import {
	formatNumberWithSeparator,
	parseNumberFromSeparator,
	formatCurrency,
	calculateFutureAmount,
} from "@/lib/utils";
import { getDefaultMaturityTimestamp } from "@/lib/maturity";
import { calculateFees } from "@/lib/fee-calculations";
import { useDialogViewAnimation } from "@/hooks/use-dialog-view-animation";
import { useSubmitLend } from "@/hooks/use-submit-lend";
import { useLendDialogData } from "@/hooks/use-lend-dialog-data";
import { useAuthToken } from "@/hooks/use-auth-token";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateUserQueries } from "@/lib/query-keys";
import { useDeposit } from "@/hooks/use-deposit";
import { useTokens } from "@/hooks/use-tokens";
import { useOnChainBalance } from "@/hooks/use-on-chain-balance";
import { getTokenLogo } from "@/lib/tokens";
import { useNetworkSwitch } from "@/hooks/use-network-switch";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type ViewMode = "lend" | "deposit-lend";

interface CentuariLendDialogProps {
	token_image: string;
	token_name: string;
	token_symbol: string;
	lendAPR: string;
	borrowAPR: string;
	collateralFactor: string;
	vaultTotal: number;
	asset_id?: string;
	market_id?: string;
}

export function CentuariLendDialog({
	token_image,
	token_name,
	token_symbol,
	lendAPR,
	borrowAPR,
	collateralFactor,
	vaultTotal,
	asset_id,
	market_id,
}: CentuariLendDialogProps) {
	const [viewMode, setViewMode] = useState<ViewMode>("lend");
	const lendViewRef = useRef<HTMLDivElement>(null);
	const collateralViewRef = useRef<HTMLDivElement>(null);
	const reactId = useId();
	const router = useRouter();
	const { submitMarket, isPending } = useSubmitLend();
	const { getToken } = useAuthToken();
	const queryClient = useQueryClient();

	const {
		availableBalance,
		tokenPrice,
		isLoading: dataLoading,
	} = useLendDialogData(token_symbol);

	// Lend form state
	const [amountToLend, setAmountToLend] = useState("");
	const [displayAmount, setDisplayAmount] = useState("");
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [showSuccessDialog, setShowSuccessDialog] = useState(false);
	const [successAmount, setSuccessAmount] = useState("");
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	// Deposit state & hooks
	const {
		deposit,
		status: depositStatus,
		reset: resetDepositHook,
	} = useDeposit();
	const { tokens: depositTokens, isLoading: depositTokensLoading } =
		useTokens();
	const [depositSelectedTokenId, setDepositSelectedTokenId] = useState("");
	const [depositAmount, setDepositAmount] = useState("");
	const [depositDisplayAmount, setDepositDisplayAmount] = useState("");

	const depositSelectedToken = useMemo(
		() => depositTokens.find((t) => t.id === depositSelectedTokenId),
		[depositTokens, depositSelectedTokenId],
	);

	useEffect(() => {
		if (depositTokens.length > 0 && !depositSelectedTokenId) {
			setDepositSelectedTokenId(depositTokens[0].id);
		}
	}, [depositTokens, depositSelectedTokenId]);

	const { balance: depositOnChainBalance, isLoading: depositBalanceLoading } =
		useOnChainBalance(depositSelectedToken?.symbol ?? "");

	const isDepositProcessing =
		depositStatus === "checkingAllowance" ||
		depositStatus === "approving" ||
		depositStatus === "waitingApproval" ||
		depositStatus === "depositing" ||
		depositStatus === "confirming";

	const depositAmountExceedsBalance = useMemo(() => {
		if (!depositAmount || depositOnChainBalance <= 0) return false;
		return Number.parseFloat(depositAmount) > depositOnChainBalance;
	}, [depositAmount, depositOnChainBalance]);

	// Network detection
	const { isWrongNetwork, switchingChain, handleSwitchChain } =
		useNetworkSwitch();

	const isDepositSubmitDisabled =
		isDepositProcessing ||
		!depositAmount ||
		!depositSelectedTokenId ||
		depositAmountExceedsBalance ||
		isWrongNetwork;

	const depositTokenIcon = depositSelectedToken
		? getTokenLogo(
				depositSelectedToken.symbol,
				depositSelectedToken.imageUrl ?? undefined,
			)
		: "/tokens/usdc-icon.webp";

	// Animation
	useDialogViewAnimation(lendViewRef, collateralViewRef, viewMode === "lend");

	// Derived calculations
	const tokenValue = token_symbol.toLowerCase();
	const parseLendAPR = (aprString: string): number => {
		const cleaned = aprString.replace("%", "").replace(",", ".");
		return parseFloat(cleaned) || 0;
	};
	const lendAPRNumeric = parseLendAPR(lendAPR);
	const numericAmount = parseFloat(amountToLend) || 0;
	const { transactionFee, amountToPay } = calculateFees(numericAmount);
	const formattedVaultTotal = formatCurrency(vaultTotal);
	const maturityDate = getDefaultMaturityTimestamp();
	const futureAmount = calculateFutureAmount(
		numericAmount,
		lendAPRNumeric,
		maturityDate,
	);

	// Handlers
	const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const numericValue = parseNumberFromSeparator(e.target.value);
		setAmountToLend(numericValue);
		setDisplayAmount(formatNumberWithSeparator(numericValue));
	};

	const handleMaxClick = () => {
		const maxAmount = availableBalance.toString();
		setAmountToLend(maxAmount);
		setDisplayAmount(formatNumberWithSeparator(maxAmount));
	};

	const handleDepositAmountChange = (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const numericValue = parseNumberFromSeparator(e.target.value);
		setDepositAmount(numericValue);
		setDepositDisplayAmount(formatNumberWithSeparator(numericValue));
	};

	const handleDepositMaxClick = () => {
		if (depositOnChainBalance > 0) {
			const balance = String(depositOnChainBalance);
			setDepositAmount(balance);
			setDepositDisplayAmount(formatNumberWithSeparator(balance));
		}
	};

	const handleDepositSubmit = async () => {
		if (!depositAmount || !depositSelectedTokenId || isDepositProcessing)
			return;
		try {
			const result = await deposit(
				depositSelectedTokenId,
				depositAmount,
				depositSelectedToken,
			);
			if (result) {
				toast.success(
					`Deposited ${depositDisplayAmount || depositAmount} ${depositSelectedToken?.symbol ?? ""}`,
				);
				setDepositAmount("");
				setDepositDisplayAmount("");
				resetDepositHook();
				setViewMode("lend");
				invalidateUserQueries(queryClient);
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : "Deposit failed";
			toast.error(message);
		}
	};

	const resetDepositForm = () => {
		setDepositAmount("");
		setDepositDisplayAmount("");
		setDepositSelectedTokenId(depositTokens[0]?.id ?? "");
		resetDepositHook();
	};

	const handleDialogChange = (open: boolean) => {
		setIsDialogOpen(open);
		if (!open) {
			setViewMode("lend");
			setAmountToLend("");
			setDisplayAmount("");
			setSubmitError(null);
			resetDepositForm();
		}
	};

	const handleLend = async () => {
		if (viewMode !== "lend") return;
		if (numericAmount <= 0 || numericAmount > availableBalance) return;
		if (tokenPrice <= 0) return;

		setSubmitError(null);

		try {
			const authToken = await getToken();
			const amountInUsd = numericAmount * tokenPrice;

			await submitMarket(
				{
					tokenValue,
					tokenLogo: token_image,
					tokenLabel: token_name,
					amount: numericAmount,
					amountInUsd,
					maturity: maturityDate,
					autoRollover: true,
				},
				authToken && asset_id && market_id
					? {
							token: authToken,
							marketIds: {
								assetId: asset_id,
								marketId: market_id,
								tokenSymbol: token_symbol,
							},
						}
					: undefined,
			);

			setSuccessAmount(formatNumberWithSeparator(numericAmount));
			setAmountToLend("");
			setDisplayAmount("");
			setIsDialogOpen(false);
			setShowSuccessDialog(true);
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Transaction failed. Please try again.";
			setSubmitError(message);
		}
	};

	return (
		<>
			<Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
				<DialogTrigger asChild>
					<CentuariGlassButton className="flex-1">
						Start Earning
					</CentuariGlassButton>
				</DialogTrigger>
				<DialogContent className="flex max-h-[min(600px,80vh)] flex-col gap-0 p-0 sm:max-w-md data-[state=open]:!zoom-in-0 data-[state=open]:duration-600">
					<DialogHeader className="contents space-y-0 text-left">
						<div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
							<div className="absolute w-[568px] h-[450px] -top-72 left-0 bg-primary-blue-base/50 blur-[264px] opacity-100 transition-opacity duration-500" />
							<div className="absolute w-[150px] h-[216px] -top-60 left-1/3 bg-white blur-3xl opacity-100 transition-opacity duration-500" />
						</div>
						<ScrollArea className="flex max-h-full flex-col overflow-hidden pb-2">
							<div className="relative overflow-hidden">
								<LendMainView
									ref={lendViewRef}
									tokenImage={token_image}
									tokenName={token_name}
									tokenSymbol={token_symbol}
									lendAPR={lendAPR}
									formattedVaultTotal={formattedVaultTotal}
									maturityDate={maturityDate}
									reactId={reactId}
									displayAmount={displayAmount}
									numericAmount={numericAmount}
									availableBalance={availableBalance}
									dataLoading={dataLoading}
									transactionFee={transactionFee}
									amountToPay={amountToPay}
									futureAmount={futureAmount}
									submitError={submitError}
									viewMode={viewMode}
									onAmountChange={handleAmountChange}
									onMaxClick={handleMaxClick}
									onDepositClick={() => setViewMode("deposit-lend")}
								/>
								<LendDepositView
									ref={collateralViewRef}
									viewMode={viewMode}
									onBack={() => setViewMode("lend")}
									reactId={reactId}
									isWrongNetwork={isWrongNetwork}
									switchingChain={switchingChain}
									onSwitchChain={handleSwitchChain}
									depositTokens={depositTokens}
									depositTokensLoading={depositTokensLoading}
									depositSelectedTokenId={depositSelectedTokenId}
									onTokenChange={setDepositSelectedTokenId}
									depositTokenIcon={depositTokenIcon}
									depositSelectedTokenSymbol={
										depositSelectedToken?.symbol ?? "token"
									}
									depositDisplayAmount={depositDisplayAmount}
									onAmountChange={handleDepositAmountChange}
									onMaxClick={handleDepositMaxClick}
									depositOnChainBalance={depositOnChainBalance}
									depositBalanceLoading={depositBalanceLoading}
									depositAmountExceedsBalance={depositAmountExceedsBalance}
									isDepositProcessing={isDepositProcessing}
									onFaucetClick={() => {
										setIsDialogOpen(false);
										router.push("/faucet");
									}}
									onSubmit={handleDepositSubmit}
								/>
							</div>
						</ScrollArea>
					</DialogHeader>
					<DialogFooter className="flex !flex-col gap-2 px-6">
						<div className="flex items-center gap-4">
							<DialogClose asChild>
								<CentuariButton variant="secondary">Cancel</CentuariButton>
							</DialogClose>
							<CentuariButton
								type="button"
								variant="primary"
								className="flex-1"
								onClick={
									viewMode === "deposit-lend" ? handleDepositSubmit : handleLend
								}
								disabled={
									viewMode === "deposit-lend"
										? isDepositSubmitDisabled
										: isPending ||
											dataLoading ||
											numericAmount <= 0 ||
											numericAmount > availableBalance
								}
							>
								{viewMode === "deposit-lend" ? (
									depositStatus === "checkingAllowance" ? (
										<>
											Checking allowance...{" "}
											<Loader2 className="w-4 h-4 ml-2 animate-spin" />
										</>
									) : depositStatus === "approving" ? (
										<>
											Approve in wallet...{" "}
											<Loader2 className="w-4 h-4 ml-2 animate-spin" />
										</>
									) : depositStatus === "waitingApproval" ? (
										<>
											Waiting for approval...{" "}
											<Loader2 className="w-4 h-4 ml-2 animate-spin" />
										</>
									) : depositStatus === "depositing" ? (
										<>
											Confirm deposit in wallet...{" "}
											<Loader2 className="w-4 h-4 ml-2 animate-spin" />
										</>
									) : depositStatus === "confirming" ? (
										<>
											Confirming deposit...{" "}
											<Loader2 className="w-4 h-4 ml-2 animate-spin" />
										</>
									) : (
										"Confirm Deposit"
									)
								) : isPending || dataLoading ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										{dataLoading ? "Loading..." : "Processing..."}
									</>
								) : (
									"Confirm Lend"
								)}
							</CentuariButton>
						</div>
						<p className="text-xs text-muted-foreground text-center leading-relaxed mb-2">
							This position is automatically refinanced. At maturity, it will
							roll over to the next available term unless you take action.
						</p>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<TransactionSuccessDialog
				open={showSuccessDialog}
				onOpenChange={(open) => {
					setShowSuccessDialog(open);
					if (!open) setSuccessAmount("");
				}}
				title="Lend Complete"
				description={
					successAmount
						? `You have successfully lent ${successAmount} ${token_symbol} to the vault.`
						: `Your ${token_symbol} lend has been completed successfully.`
				}
				primaryActionLabel="Done"
				onPrimaryAction={() => setShowSuccessDialog(false)}
			/>
		</>
	);
}
