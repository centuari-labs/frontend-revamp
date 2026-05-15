import { forwardRef } from "react";
import Image from "next/image";
import { Button } from "./ui/button";
import { CentuariInput } from "./centuari-input";
import { CentuariAlert } from "./centuari-alert";
import { CentuariTypography } from "./centuari-typography";
import { TransactionSummary } from "./market/transaction-summary";
import { DialogTokenHeader } from "./dialog-token-header";
import { formatNumberWithSeparator } from "@/lib/utils";
import { formatMaturityTimestamp } from "@/lib/maturity";

interface LendMainViewProps {
	tokenImage: string;
	tokenName: string;
	tokenSymbol: string;
	lendAPR: string;
	formattedVaultTotal: string;
	maturityDate: number;
	reactId: string;
	displayAmount: string;
	numericAmount: number;
	availableBalance: number;
	dataLoading: boolean;
	transactionFee: number;
	amountToPay: number;
	futureAmount: number;
	submitError: string | null;
	viewMode: string;
	onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onMaxClick: () => void;
	onDepositClick: () => void;
}

export const LendMainView = forwardRef<HTMLDivElement, LendMainViewProps>(
	function LendMainView(
		{
			tokenImage,
			tokenName,
			tokenSymbol,
			lendAPR,
			formattedVaultTotal,
			maturityDate,
			reactId,
			displayAmount,
			numericAmount,
			availableBalance,
			dataLoading,
			transactionFee,
			amountToPay,
			futureAmount,
			submitError,
			viewMode,
			onAmountChange,
			onMaxClick,
			onDepositClick,
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
				label: "Vault Total",
				tooltip: `The total amount of ${tokenSymbol} in the vault.`,
				value: formattedVaultTotal,
			},
			{
				label: "Lend APR",
				tooltip: "The fixed return you earn when lending your assets.",
				value: lendAPR,
			},
		];

		return (
			<div
				ref={ref}
				className={
					viewMode === "lend"
						? "relative"
						: "absolute inset-0 pointer-events-none"
				}
				style={{ opacity: viewMode === "lend" ? 1 : 0 }}
			>
				<DialogTokenHeader
					tokenImage={tokenImage}
					tokenName={tokenName}
					tokenSymbol={tokenSymbol}
					stats={stats}
				/>

				<div className="mt-4 px-6">
					<CentuariInput
						id={`amount-${reactId}`}
						label="Amount to Lend"
						size="large"
						placeholder="1,000"
						tooltipMessage="The amount you currently have that is available to use."
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
						rightIcon={
							<Button
								variant="link"
								className="px-0"
								type="button"
								onClick={onMaxClick}
							>
								Max
							</Button>
						}
						balanceText={
							dataLoading
								? "Loading..."
								: `${tokenSymbol} ${formatNumberWithSeparator(availableBalance)}`
						}
						value={displayAmount}
						onChange={onAmountChange}
					/>

					{numericAmount > availableBalance && (
						<CentuariAlert
							variant="destructive"
							text="Insufficient balance"
							description="Deposit now to continue your order"
							className="mt-1.5"
							action={
								<Button
									variant="destructive"
									size="sm"
									onClick={onDepositClick}
									type="button"
								>
									Deposit
								</Button>
							}
						/>
					)}

					{submitError && (
						<CentuariAlert
							variant="destructive"
							text="Transaction failed"
							description={submitError}
							className="mt-1.5"
						/>
					)}

					<TransactionSummary
						transactionFee={numericAmount > 0 ? transactionFee : 0}
						amountToPay={numericAmount > 0 ? amountToPay : 0}
						futureAmount={numericAmount > 0 ? futureAmount : 0}
						futureLabel="In the future you'll get"
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
				</div>
			</div>
		);
	},
);
