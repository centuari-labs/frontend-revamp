import { forwardRef } from "react";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { CentuariTypography } from "./centuari-typography";
import { CentuariInput } from "./centuari-input";
import { Button } from "./ui/button";
import { SelectToken } from "./select-token";
import { IcDollarCentuari } from "./icons/ic-dollar-centuari";

interface BorrowDepositViewProps {
	viewMode: string;
	onBack: () => void;
}

export const BorrowDepositView = forwardRef<
	HTMLDivElement,
	BorrowDepositViewProps
>(function BorrowDepositView({ viewMode, onBack }, ref) {
	return (
		<div
			ref={ref}
			className={
				viewMode === "deposit-collateral"
					? "relative mt-6 px-6"
					: "absolute inset-0 pointer-events-none mt-6 px-6"
			}
			style={{ opacity: viewMode === "deposit-collateral" ? 1 : 0 }}
		>
			<Button
				variant="ghost"
				size="sm"
				onClick={onBack}
				className="mb-4 -ml-2"
				type="button"
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
			<form>
				<SelectToken />
				<CentuariInput
					id="amount"
					label="Deposit Amount"
					showTooltip={false}
					size="large"
					placeholder="Amount"
					leftIcon={<IcDollarCentuari size={16} />}
					className="mt-0"
					containerClassName="mt-3.5"
				/>
			</form>
		</div>
	);
});
