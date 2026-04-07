"use client";

import { useState, useRef, useId } from "react";
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
import { CentuariButton } from "./centuari-button";
import { TransactionSuccessDialog } from "./transaction-success-dialog";
import { BorrowMainView } from "./borrow-main-view";
import { BorrowDepositView } from "./borrow-deposit-view";
import {
	formatNumberWithSeparator,
	parseNumberFromSeparator,
	calculateFutureAmount,
	getHealthFactorPercentage,
} from "@/lib/utils";
import { useTokenPrice } from "@/contexts/price-context";
import { getDefaultMaturityTimestamp } from "@/lib/maturity";
import { calculateFees } from "@/lib/fee-calculations";
import { useDialogViewAnimation } from "@/hooks/use-dialog-view-animation";
import { useSubmitBorrow } from "@/hooks/use-submit-borrow";
import { useBorrowDialogData } from "@/hooks/use-borrow-dialog-data";
import { useAuthToken } from "@/hooks/use-auth-token";

type ViewMode = "borrow" | "deposit-collateral";

interface CentuariBorrowDialogProps {
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

export function CentuariBorrowDialog({
	token_image,
	token_name,
	token_symbol,
	lendAPR,
	borrowAPR,
	collateralFactor,
	vaultTotal,
	asset_id,
	market_id,
}: CentuariBorrowDialogProps) {
	const [viewMode, setViewMode] = useState<ViewMode>("borrow");
	const borrowViewRef = useRef<HTMLDivElement>(null);
	const collateralViewRef = useRef<HTMLDivElement>(null);
	const reactId = useId();
	const { submitMarket, isPending } = useSubmitBorrow();
	const { getToken } = useAuthToken();
	const borrowTokenPrice = useTokenPrice(asset_id) ?? 0;

	const {
		portfolio,
		totalDebt,
		collateralStatus,
		collateralTokenList,
		userHealthFactor,
		apiCollateralUsd,
		apiSettledDebtUsd,
		apiWeightedLtv,
		isLoading: dataLoading,
	} = useBorrowDialogData();

	// Form state
	const [amountToBorrow, setAmountToBorrow] = useState("");
	const [displayAmount, setDisplayAmount] = useState("");
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [selectedCollaterals, setSelectedCollaterals] = useState<string[]>([]);
	const [showSuccessDialog, setShowSuccessDialog] = useState(false);
	const [successAmount, setSuccessAmount] = useState("");
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	// Animation
	useDialogViewAnimation(borrowViewRef, collateralViewRef, viewMode === "borrow");

	// Parse APR values
	const parseAPR = (aprString: string): number => {
		const cleaned = aprString.replace("%", "").replace(",", ".");
		return parseFloat(cleaned) || 0;
	};

	const borrowAPRNumeric = parseAPR(borrowAPR);
	const collateralFactorNumeric = parseAPR(collateralFactor) / 100;

	// Derived calculations
	const numericAmount = parseFloat(amountToBorrow) || 0;
	const { transactionFee, amountToPay } = calculateFees(numericAmount);
	const maturityDate = getDefaultMaturityTimestamp();
	const futureAmount = calculateFutureAmount(numericAmount, borrowAPRNumeric, maturityDate);

	const totalPortfolioValue = selectedCollaterals.reduce(
		(total, val) => total + (portfolio[val] || 0),
		0,
	);

	const weightedLTV =
		selectedCollaterals.length > 0 && totalPortfolioValue > 0
			? selectedCollaterals.reduce((sum, val) => {
					const token = collateralTokenList.find((t) => t.value === val);
					const portfolioValue = portfolio[val] || 0;
					if (token && portfolioValue > 0) return sum + token.ltv * portfolioValue;
					return sum;
				}, 0) / totalPortfolioValue
			: collateralFactorNumeric;

	const maxBorrowCapacity = totalPortfolioValue * weightedLTV;
	const availableQuota = maxBorrowCapacity - totalDebt;
	const newTotalDebt = totalDebt + numericAmount * borrowTokenPrice;

	// Health factor calculation
	const healthFactor =
		numericAmount > 0 && apiCollateralUsd > 0 && selectedCollaterals.length > 0
			? (() => {
					const borrowAmountUsd = numericAmount * borrowTokenPrice;
					const projectedDebt = apiSettledDebtUsd + borrowAmountUsd;
					if (projectedDebt <= 0) return 0;
					const numerator = (apiCollateralUsd - apiSettledDebtUsd) * apiWeightedLtv;
					const calculatedHF = numerator / projectedDebt;
					if (!Number.isFinite(calculatedHF) || calculatedHF < 0) return 0;
					return calculatedHF;
				})()
			: 0;

	const healthFactorPercentage =
		healthFactor > 0 && !isNaN(healthFactor) && selectedCollaterals.length > 0 && numericAmount > 0
			? healthFactor >= 2.5
				? 100
				: healthFactor >= 1.5
					? 75 + ((healthFactor - 1.5) / 1.0) * 25
					: healthFactor >= 1.2
						? 50 + ((healthFactor - 1.2) / 0.3) * 25
						: healthFactor >= 1.0
							? 25 + ((healthFactor - 1.0) / 0.2) * 25
							: (healthFactor / 1.0) * 25
			: 0;

	// Handlers
	const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const numericValue = parseNumberFromSeparator(e.target.value);
		setAmountToBorrow(numericValue);
		setDisplayAmount(formatNumberWithSeparator(numericValue));
	};

	const handleDialogChange = (open: boolean) => {
		setIsDialogOpen(open);
		if (open) {
			const autoSelected = collateralTokenList
				.filter(
					(token) =>
						portfolio[token.value] &&
						portfolio[token.value] > 0 &&
						collateralStatus[token.value] === true,
				)
				.map((token) => token.value);
			setSelectedCollaterals(autoSelected);
			setSubmitError(null);
		} else {
			setViewMode("borrow");
			setAmountToBorrow("");
			setDisplayAmount("");
			setShowSuccessDialog(false);
			setSubmitError(null);
			setSelectedCollaterals([]);
		}
	};

	const handleBorrow = async () => {
		if (viewMode !== "borrow") return;
		if (numericAmount <= 0 || numericAmount * borrowTokenPrice > availableQuota) return;
		if (selectedCollaterals.length === 0 || totalPortfolioValue === 0) return;
		if (healthFactor < 1.0) return;

		setSubmitError(null);

		try {
			const authToken = await getToken();

			await submitMarket(
				{
					tokenValue: token_symbol.toLowerCase(),
					tokenLogo: token_image,
					tokenLabel: token_name,
					amount: numericAmount,
					maturity: maturityDate,
					collateralTokens: selectedCollaterals,
				},
				authToken && asset_id && market_id
					? { token: authToken, marketIds: { assetId: asset_id, marketId: market_id, tokenSymbol: token_symbol } }
					: undefined,
			);

			setSuccessAmount(formatNumberWithSeparator(numericAmount));
			setAmountToBorrow("");
			setDisplayAmount("");
			setSelectedCollaterals([]);
			setIsDialogOpen(false);
			setShowSuccessDialog(true);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Transaction failed. Please try again.";
			setSubmitError(message);
		}
	};

	return (
		<>
			<Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
				<DialogTrigger asChild>
					<CentuariButton variant="secondary" className="flex-1">
						Borrow
					</CentuariButton>
				</DialogTrigger>
				<DialogContent className="flex max-h-[min(600px,80vh)] flex-col gap-0 p-0 sm:max-w-md data-[state=open]:!zoom-in-0 data-[state=open]:duration-600">
					<DialogHeader className="contents space-y-0 text-left">
						<div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
							<div className="absolute w-[568px] h-[450px] -top-72 left-0 bg-primary-blue-base/50 blur-[264px] opacity-100 transition-opacity duration-500" />
							<div className="absolute w-[150px] h-[216px] -top-60 left-1/3 bg-white blur-3xl opacity-100 transition-opacity duration-500" />
						</div>
						<ScrollArea className="flex max-h-full flex-col overflow-hidden pb-2">
							<div className="relative overflow-hidden min-h-[400px]">
								<BorrowMainView
									ref={borrowViewRef}
									tokenImage={token_image}
									tokenName={token_name}
									tokenSymbol={token_symbol}
									lendAPR={lendAPR}
									borrowAPR={borrowAPR}
									maturityDate={maturityDate}
									reactId={reactId}
									displayAmount={displayAmount}
									numericAmount={numericAmount}
									transactionFee={transactionFee}
									amountToPay={amountToPay}
									futureAmount={futureAmount}
									submitError={submitError}
									selectedCollaterals={selectedCollaterals}
									collateralTokenList={collateralTokenList}
									healthFactor={healthFactor}
									userHealthFactor={userHealthFactor}
									healthFactorPercentage={healthFactorPercentage}
									newTotalDebt={newTotalDebt}
									weightedLTV={weightedLTV}
									totalPortfolioValue={totalPortfolioValue}
									viewMode={viewMode}
									onAmountChange={handleAmountChange}
								/>
								<BorrowDepositView
									ref={collateralViewRef}
									viewMode={viewMode}
									onBack={() => setViewMode("borrow")}
								/>
							</div>
						</ScrollArea>
					</DialogHeader>
					<DialogFooter className="flex !flex-col gap-2 pt-2 px-6">
						<div className="flex items-center gap-4">
							<DialogClose asChild>
								<CentuariButton variant="secondary">Cancel</CentuariButton>
							</DialogClose>
							<CentuariButton
								type="button"
								variant="primary"
								className="flex-1"
								onClick={handleBorrow}
								disabled={
									isPending ||
									dataLoading ||
									(viewMode === "borrow" &&
										(numericAmount <= 0 ||
											numericAmount * borrowTokenPrice > availableQuota ||
											selectedCollaterals.length === 0 ||
											totalPortfolioValue === 0 ||
											healthFactor < 1.0))
								}
							>
								{isPending || dataLoading ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										{dataLoading ? "Loading..." : "Processing..."}
									</>
								) : viewMode === "borrow" ? (
									"Confirm Borrow"
								) : (
									"Confirm Add Collateral"
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
				onOpenChange={setShowSuccessDialog}
				title="Borrow Complete"
				description={
					successAmount
						? `You have successfully borrowed ${successAmount} ${token_symbol} from the vault.`
						: `Your ${token_symbol} borrow has been completed successfully.`
				}
				primaryActionLabel="Done"
				onPrimaryAction={() => setShowSuccessDialog(false)}
			/>
		</>
	);
}
