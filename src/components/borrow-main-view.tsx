import { forwardRef } from "react";
import Image from "next/image";
import { Info } from "lucide-react";
import { CentuariInput } from "./centuari-input";
import { CentuariAlert } from "./centuari-alert";
import { CentuariTypography } from "./centuari-typography";
import { CentuariTooltip } from "./centuari-tooltip";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import HealthFactor from "./centuari-health-factor";
import { CollateralListDisplay } from "./collateral-list-display";
import { CollateralEmptyState } from "./collateral-empty-state";
import { TransactionSummary } from "./market/transaction-summary";
import { DialogTokenHeader } from "./dialog-token-header";
import {
	formatCurrency,
	formatNumber,
	getHealthFactorPercentage,
	getHealthFactorDisplayStatus,
} from "@/lib/utils";
import { formatMaturityTimestamp } from "@/lib/maturity";
import type { TokenInfo } from "@/lib/portfolio-data";

interface BorrowMainViewProps {
	tokenImage: string;
	tokenName: string;
	tokenSymbol: string;
	lendAPR: string;
	borrowAPR: string;
	maturityDate: number;
	reactId: string;
	displayAmount: string;
	numericAmount: number;
	transactionFee: number;
	amountToPay: number;
	futureAmount: number;
	submitError: string | null;
	selectedCollaterals: string[];
	collateralTokenList: TokenInfo[];
	healthFactor: number;
	userHealthFactor: number;
	healthFactorPercentage: number;
	newTotalDebt: number;
	weightedLTV: number;
	totalPortfolioValue: number;
	viewMode: string;
	onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const BorrowMainView = forwardRef<HTMLDivElement, BorrowMainViewProps>(
	function BorrowMainView(
		{
			tokenImage,
			tokenName,
			tokenSymbol,
			lendAPR,
			borrowAPR,
			maturityDate,
			reactId,
			displayAmount,
			numericAmount,
			transactionFee,
			amountToPay,
			futureAmount,
			submitError,
			selectedCollaterals,
			collateralTokenList,
			healthFactor,
			userHealthFactor,
			healthFactorPercentage,
			newTotalDebt,
			weightedLTV,
			totalPortfolioValue,
			viewMode,
			onAmountChange,
		},
		ref,
	) {
		const stats = [
			{
				label: "Maturity",
				tooltip:
					"The date when your position ends and your funds are returned.",
				value: formatMaturityTimestamp(maturityDate),
			},
			{
				label: "Borrow APR",
				tooltip: "The fixed interest rate you pay when borrowing.",
				value: borrowAPR,
			},
			{
				label: "Lend APR",
				tooltip: "The fixed return you earn when lending your assets.",
				value: lendAPR,
			},
		];

		const displayHF =
			healthFactor > 0 ? healthFactor : userHealthFactor;
		const hasInput =
			numericAmount > 0 && selectedCollaterals.length > 0;
		const effectiveHF = hasInput ? healthFactor : displayHF;
		const hfDisplay =
			effectiveHF > 0
				? getHealthFactorDisplayStatus(effectiveHF)
				: { value: "0.00", status: "Safe", variant: "default" as const };
		const displayPercentage =
			healthFactorPercentage > 0
				? healthFactorPercentage
				: displayHF > 0
					? getHealthFactorPercentage(displayHF)
					: 0;

		return (
			<div
				ref={ref}
				className={
					viewMode === "borrow"
						? "relative"
						: "absolute inset-0 pointer-events-none"
				}
				style={{ opacity: viewMode === "borrow" ? 1 : 0 }}
			>
				<DialogTokenHeader
					tokenImage={tokenImage}
					tokenName={tokenName}
					tokenSymbol={tokenSymbol}
					stats={stats}
				/>

				<div className="mt-4 px-6">
					<form action="">
						<CentuariInput
							id={`amount-${reactId}`}
							label="Amount to Borrow"
							size="large"
							placeholder="1,000"
							leftIcon={
								<Image
									src={tokenImage}
									alt={tokenSymbol}
									width={16}
									height={16}
									className="w-4 h-4"
								/>
							}
							suffix={tokenSymbol}
							value={displayAmount}
							onChange={onAmountChange}
						/>
						<div className="mt-5">
							<Label>Collateral Used</Label>
							<div className="mt-1.5">
								{selectedCollaterals.length > 0 ? (
									<CollateralListDisplay
										selectedCollaterals={selectedCollaterals}
										tokenList={collateralTokenList}
									/>
								) : (
									<CollateralEmptyState />
								)}
							</div>
						</div>

						<div>
							<Label className="mb-2 mt-4">
								Health Factor{" "}
								<CentuariTooltip message="Your health factor shows how safe your borrowed position is. Blue indicates a safe position.">
									<Info size={16} />
								</CentuariTooltip>
								<Badge variant={hfDisplay.variant}>
									{`${hfDisplay.value} ~ ${hfDisplay.status}`}
								</Badge>
							</Label>
							<div className="border border-white/5 rounded-md mt-2 overflow-hidden">
								<div className="px-2 py-5 border-b rounded-b-md border-white/5 bg-white/10 z-50">
									<HealthFactor
										targetValue={displayPercentage}
										healthFactor={
											displayHF > 0 && !isNaN(displayHF)
												? displayHF
												: undefined
										}
									/>
								</div>
								<div className="px-2 py-4 z-20 -mt-2 border-t-0 border-white/5 rounded-b-lg">
									<p className="text-xs text-muted-foreground text-center">
										{healthFactor > 0 && !isNaN(healthFactor) ? (
											<>
												If portfolio value drops{" "}
												<span className="text-white font-medium">
													below{" "}
													{formatCurrency(newTotalDebt / weightedLTV)}
												</span>{" "}
												or total debt exceeds{" "}
												<span className="text-white font-medium">
													{formatCurrency(totalPortfolioValue * weightedLTV)}
												</span>
												, your position could be liquidated.
											</>
										) : (
											<>
												Select collateral from portfolio and enter borrow
												amount to see health factor.
											</>
										)}
									</p>
								</div>
							</div>
						</div>

						{submitError && (
							<CentuariAlert
								variant="destructive"
								text="Transaction failed"
								description={submitError}
								className="mt-3"
							/>
						)}

						<TransactionSummary
							transactionFee={numericAmount > 0 ? transactionFee : 0}
							amountToPay={numericAmount > 0 ? amountToPay : 0}
							futureAmount={numericAmount > 0 ? futureAmount : 0}
							futureLabel="In the future you'll pay"
							tokenSymbol={tokenSymbol}
						/>

						<CentuariTypography
							variant="s4"
							className="mt-2 text-muted-foreground justify-center flex items-center gap-1"
						>
							Withdrawal Unlocks on
							<CentuariTypography variant="s4" className="underline">
								{formatMaturityTimestamp(maturityDate)}
							</CentuariTypography>
						</CentuariTypography>
					</form>
				</div>
			</div>
		);
	},
);
