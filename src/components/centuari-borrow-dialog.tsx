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
import { Button } from "./ui/button";
import { Info, Loader2 } from "lucide-react";
import Image from "next/image";
import { CentuariTypography } from "./centuari-typography";
import { CentuariTooltip } from "./centuari-tooltip";
import { CentuariInput } from "./centuari-input";
import { CentuariButton } from "./centuari-button";
import { Label } from "./ui/label";
import HealthFactor from "./centuari-health-factor";
import { Badge } from "./ui/badge";
import { CentuariAlert } from "./centuari-alert";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TransactionSuccessDialog } from "./transaction-success-dialog";
import {
  formatNumberWithSeparator,
  parseNumberFromSeparator,
  formatCurrency,
  calculateFutureAmount,
} from "@/lib/utils";
import {
  getDefaultMaturityTimestamp,
  formatMaturityTimestamp,
} from "@/lib/maturity";
import { getLiquidationThreshold } from "@/lib/portfolio-data";
import { useSubmitBorrow } from "@/hooks/use-submit-borrow";
import { useBorrowDialogData } from "@/hooks/use-borrow-dialog-data";
import { useMarketData } from "@/hooks/use-market-data";
import { useAuthToken } from "@/hooks/use-auth-token";
import { useQueryClient } from "@tanstack/react-query";
import { CollateralListDisplay } from "./collateral-list-display";
import { CollateralEmptyState } from "./collateral-empty-state";

interface CentuariBorrowDialogProps {
  token_image: string;
  token_name: string;
  token_symbol: string;
  lendAPR: string; // Format: "6,5%"
  borrowAPR: string;
  collateralFactor: string;
  vaultTotal: number;
}

export function CentuariBorrowDialog({
  token_image,
  token_name,
  token_symbol,
  lendAPR,
  borrowAPR,
  collateralFactor,
  vaultTotal,
}: CentuariBorrowDialogProps) {
  const borrowViewRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const router = useRouter();
  const { submitMarket, isPending } = useSubmitBorrow();
  const { getToken } = useAuthToken();
  const { markets } = useMarketData();
  const queryClient = useQueryClient();

  // Bridge hook: reads localStorage in mock mode, API in real mode
  const {
    portfolio,
    totalDebt,
    collateralStatus,
    collateralTokenList,
    isLoading: dataLoading,
  } = useBorrowDialogData();

  // State for amount input
  const [amountToBorrow, setAmountToBorrow] = useState<string>("");
  const [displayAmount, setDisplayAmount] = useState<string>("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  // State for collateral selection (only select, no amount input)
  const [selectedCollaterals, setSelectedCollaterals] = useState<string[]>([]);

  // State for success dialog
  const [showSuccessDialog, setShowSuccessDialog] = useState<boolean>(false);
  const [successAmount, setSuccessAmount] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  // Note: portfolio, totalDebt, and collateralStatus are now managed by useBorrowDialogData hook
  // In mock mode: reads from localStorage; in API mode: fetches from backend

  // Parse Lend APR and Borrow APR from format "6,5%" to number (6.5)
  const parseAPR = (aprString: string): number => {
    const cleaned = aprString.replace("%", "").replace(",", ".");
    return parseFloat(cleaned) || 0;
  };

  const lendAPRNumeric = parseAPR(lendAPR);
  const borrowAPRNumeric = parseAPR(borrowAPR);
  const collateralFactorNumeric = parseAPR(collateralFactor) / 100; // Convert to decimal

  // Calculate derived values - support decimal amounts like 0.1
  const numericAmount = parseFloat(amountToBorrow) || 0;

  // Transaction fee: 0.01% of amount (supports decimal amounts)
  const transactionFee = Math.min(numericAmount * 0.0001, 0.05); // 0.01% capped at $0.05

  // Amount to pay: borrow amount + transaction fee
  const amountToPay = numericAmount + transactionFee;

  // Maturity date - withdrawal unlocks on the same date
  const maturityDate = getDefaultMaturityTimestamp();

  const futureAmount = calculateFutureAmount(
    numericAmount,
    borrowAPRNumeric,
    maturityDate,
  );

  // Calculate total portfolio value from selected collaterals
  const totalPortfolioValue = selectedCollaterals.reduce(
    (total, collateralValue) => {
      const portfolioValue = portfolio[collateralValue] || 0;
      return total + portfolioValue;
    },
    0,
  );

  // Calculate weighted LTV (average LTV of selected collaterals)
  const weightedLTV =
    selectedCollaterals.length > 0 && totalPortfolioValue > 0
      ? selectedCollaterals.reduce((sum, collateralValue) => {
          const token = collateralTokenList.find(
            (t) => t.value === collateralValue,
          );
          const portfolioValue = portfolio[collateralValue] || 0;
          if (token && portfolioValue > 0) {
            return sum + token.ltv * portfolioValue;
          }
          return sum;
        }, 0) / totalPortfolioValue
      : parseAPR(collateralFactor) / 100; // Use collateralFactor as LTV if no selection

  // Calculate weighted Liquidation Threshold (average LT of selected collaterals)
  const weightedLT =
    selectedCollaterals.length > 0 && totalPortfolioValue > 0
      ? selectedCollaterals.reduce((sum, collateralValue) => {
          const token = collateralTokenList.find(
            (t) => t.value === collateralValue,
          );
          const portfolioValue = portfolio[collateralValue] || 0;
          if (token && portfolioValue > 0) {
            const lt = getLiquidationThreshold(token);
            return sum + lt * portfolioValue;
          }
          return sum;
        }, 0) / totalPortfolioValue
      : weightedLTV * 0.92; // Default: 92% of LTV

  // Calculate max borrow capacity = (Total Portfolio Value × LTV)
  const maxBorrowCapacity = totalPortfolioValue * weightedLTV;

  // Calculate available quota = Max Borrow Capacity - Total Debt
  const availableQuota = maxBorrowCapacity - totalDebt;

  // Calculate new total debt after this borrow (current debt + new borrow amount)
  const newTotalDebt = totalDebt + numericAmount;

  // Health Factor calculation (More realistic Aave/Morpho-like formula)
  // Health Factor = (Total Collateral Value × Liquidation Threshold) / Total Debt
  // Using Liquidation Threshold instead of LTV for more accurate calculation
  // After borrow: HF = (Portfolio × LT) / (Current Debt + New Borrow)
  // Only calculate if we have collateral selected and borrow amount
  // Ensure health factor is a reasonable number (typically 0-10 range)
  const healthFactor =
    newTotalDebt > 0 &&
    totalPortfolioValue > 0 &&
    !isNaN(weightedLT) &&
    selectedCollaterals.length > 0
      ? (() => {
          const calculatedHF =
            (totalPortfolioValue * weightedLT) / newTotalDebt;
          // Cap at 10 for display, but log if it's unreasonably large (likely a bug)
          if (calculatedHF > 10) {
            console.warn(
              `Health factor is unusually high: ${calculatedHF}. Portfolio: ${totalPortfolioValue}, LT: ${weightedLT}, Debt: ${newTotalDebt}`,
            );
          }
          return Math.min(calculatedHF, 10);
        })()
      : 0;

  // Convert health factor to percentage for display (0-100 scale)
  // More realistic mapping:
  // - HF >= 2.5: Excellent (100%)
  // - HF >= 1.5: Good (75%)
  // - HF >= 1.2: Warning (50%)
  // - HF >= 1.0: Critical (25%)
  // - HF < 1.0: Danger (0%)
  // Show 0 (empty) if no collateral selected or no borrow amount
  const healthFactorPercentage =
    healthFactor > 0 &&
    !isNaN(healthFactor) &&
    selectedCollaterals.length > 0 &&
    numericAmount > 0
      ? healthFactor >= 2.5
        ? 100
        : healthFactor >= 1.5
          ? 75 + ((healthFactor - 1.5) / 1.0) * 25 // 75-100%
          : healthFactor >= 1.2
            ? 50 + ((healthFactor - 1.2) / 0.3) * 25 // 50-75%
            : healthFactor >= 1.0
              ? 25 + ((healthFactor - 1.0) / 0.2) * 25 // 25-50%
              : (healthFactor / 1.0) * 25 // 0-25%
      : 0;

  // Format vault total with currency
  const formattedVaultTotal = formatCurrency(vaultTotal);

  // Handle amount input change - support decimal values like 0.1
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Parse to get clean numeric value (removes thousand separators, keeps decimal point)
    const numericValue = parseNumberFromSeparator(inputValue);

    // Format for display with thousand separators
    const formattedValue = formatNumberWithSeparator(numericValue);

    // Update both states: numeric value for calculations, formatted value for display
    setAmountToBorrow(numericValue);
    setDisplayAmount(formattedValue);
  };

  // Handle collateral selection change (only select, no amount input)
  // This only updates selectedCollaterals for THIS borrow, does NOT affect "As Collateral" checkbox
  const handleCollateralChange = (values: string[]) => {
    setSelectedCollaterals(values);
    // Do NOT update collateralStatus here - that's controlled by "As Collateral" checkbox in portfolio
  };

  // Handle Max button - set amount to available quota
  const handleMaxClick = () => {
    const maxAmount = Math.max(0, availableQuota);
    // Format to preserve decimals if needed
    const maxAmountStr = maxAmount.toString();
    const formattedMax = formatNumberWithSeparator(maxAmountStr);
    setAmountToBorrow(maxAmountStr);
    setDisplayAmount(formattedMax);
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (open) {
      // Auto-select all tokens that are marked as collateral and have balance
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
      setAmountToBorrow("");
      setDisplayAmount("");
      setShowSuccessDialog(false);
      setSubmitError(null);
      setSelectedCollaterals([]);
    }
  };

  const handleBorrow = async () => {
    if (numericAmount <= 0 || numericAmount > availableQuota) return;
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
        authToken && markets.length > 0
          ? { token: authToken, markets }
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
          <Button variant="secondary" className="flex-1">
            Borrow
          </Button>
        </DialogTrigger>
        <DialogContent className="flex max-h-[min(600px,80vh)] flex-col gap-0 p-0 sm:max-w-md data-[state=open]:!zoom-in-0 data-[state=open]:duration-600">
          <DialogHeader className="contents space-y-0 text-left">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
              <div className="absolute w-[568px] h-[450px] -top-72 left-0 bg-primary-blue-base/50 blur-[264px] opacity-100 transition-opacity duration-500" />
              <div className="absolute w-[150px] h-[216px] -top-60 left-1/3 bg-white blur-3xl opacity-100 transition-opacity duration-500" />
            </div>
            <ScrollArea className="flex max-h-full flex-col overflow-hidden pb-2">
              <div className="relative overflow-hidden min-h-[400px]">
                {/* Borrow View */}
                <div
                  ref={borrowViewRef}
                  className="relative"
                >
                  <div className="flex flex-col items-center justify-center gap-2 mt-6">
                    <Image
                      src={token_image}
                      alt={token_name}
                      width={76.5}
                      height={76.5}
                    />
                    <CentuariTypography variant="h4">
                      {token_symbol}
                    </CentuariTypography>
                    <div className="flex w-full items-center justify-around mt-4 px-6">
                      <div>
                        <CentuariTypography
                          className="flex items-center gap-1 text-muted-foreground"
                          variant="b3"
                        >
                          Maturity{" "}
                          <CentuariTooltip message="The date when the loan will be repaid.">
                            <Info size={16} />
                          </CentuariTooltip>
                        </CentuariTypography>
                        <CentuariTypography
                          variant="h5"
                          className="text-center"
                        >
                          {formatMaturityTimestamp(maturityDate)}
                        </CentuariTypography>
                      </div>
                      <div>
                        <CentuariTypography
                          className="flex items-center gap-1 text-muted-foreground"
                          variant="b3"
                        >
                          Borrow APR{" "}
                          <CentuariTooltip
                            message={`The interest rate at which you can borrow ${token_symbol}.`}
                          >
                            <Info size={16} />
                          </CentuariTooltip>
                        </CentuariTypography>
                        <CentuariTypography
                          variant="h5"
                          className="text-center"
                        >
                          {borrowAPR}
                        </CentuariTypography>
                      </div>
                      <div>
                        <CentuariTypography
                          className="flex items-center gap-1 text-muted-foreground"
                          variant="b3"
                        >
                          Lend APR{" "}
                          <CentuariTooltip
                            message={`The annual percentage rate for borrowing ${token_symbol} after fees.`}
                          >
                            <Info size={16} />
                          </CentuariTooltip>
                        </CentuariTypography>
                        <CentuariTypography
                          variant="h5"
                          className="text-center"
                        >
                          {lendAPR}
                        </CentuariTypography>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm mt-3 text-primary-blue-20 bg-primary-blue-base/10 border border-primary-blue-base/10 py-2 text-center mx-6 self-stretch rounded-md">
                    Go to{" "}
                    <Link href="/market" className="font-medium !underline">
                      Market View
                    </Link>{" "}
                    to select other maturities.
                  </div>

                  <div className="mt-4 px-6">
                    <form action="">
                      <CentuariInput
                        id={`amount-${reactId}`}
                        label="Amount to Borrow"
                        size="large"
                        placeholder="1,000"
                        leftIcon={
                          <Image
                            src={token_image}
                            alt={token_symbol}
                            width={16}
                            height={16}
                            className="w-4 h-4"
                          />
                        }
                        value={displayAmount}
                        onChange={handleAmountChange}
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
                          <CentuariTooltip message="Your health factor indicates the safety of your borrowed position. Health Factor = (Total Collateral Value × Collateral Factor) / Total Borrowed Value">
                            <Info size={16} />
                          </CentuariTooltip>
                          <Badge
                            variant={
                              healthFactor === 0 ||
                              selectedCollaterals.length === 0 ||
                              numericAmount === 0
                                ? "default"
                                : healthFactor >= 2.5
                                  ? "success"
                                  : healthFactor >= 1.5
                                    ? "default"
                                    : healthFactor >= 1.2
                                      ? "warning"
                                      : healthFactor >= 1.0
                                        ? "warning"
                                        : "destructive"
                            }
                          >
                            {(() => {
                              // Ensure we're displaying the actual health factor value, not other values
                              if (
                                healthFactor > 0 &&
                                !isNaN(healthFactor) &&
                                selectedCollaterals.length > 0 &&
                                numericAmount > 0
                              ) {
                                // Format health factor with 2 decimal places
                                // Health factor should be in range 0-10 typically
                                // Ensure health factor is a reasonable number (not thousands)
                                let hfValue = healthFactor;

                                // If health factor is unreasonably large (likely a calculation error), cap it
                                if (hfValue > 10) {
                                  hfValue = 10;
                                }

                                const hfDisplay = parseFloat(
                                  hfValue.toFixed(2),
                                );
                                let status: string;

                                if (hfDisplay >= 2.5) {
                                  status = "Excellent";
                                } else if (hfDisplay >= 1.5) {
                                  status = "Good";
                                } else if (hfDisplay >= 1.2) {
                                  status = "Warning";
                                } else if (hfDisplay >= 1.0) {
                                  status = "Critical";
                                } else {
                                  status = "Danger";
                                }

                                // Return formatted health factor (e.g., "2.50 ~ Excellent", "1.50 ~ Good")
                                return `${hfDisplay.toFixed(2)} ~ ${status}`;
                              }
                              return "0.00 ~ Safe";
                            })()}
                          </Badge>
                        </Label>
                        <div className="border border-white/5 rounded-lg mt-2">
                          <div className="px-2 py-5 rounded-lg border-b border-white/5 bg-white/10 z-50">
                            <HealthFactor
                              targetValue={healthFactorPercentage}
                              healthFactor={
                                healthFactor > 0 && !isNaN(healthFactor)
                                  ? healthFactor
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
                                    {formatCurrency(newTotalDebt / weightedLT)}
                                  </span>{" "}
                                  or total debt exceeds{" "}
                                  <span className="text-white font-medium">
                                    {formatCurrency(
                                      totalPortfolioValue * weightedLT,
                                    )}
                                  </span>
                                  , your position could be liquidated.
                                </>
                              ) : (
                                <>
                                  Select collateral from portfolio and enter
                                  borrow amount to see health factor.
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

                      <div className="bg-white/5 py-3 px-4 text-sm rounded-xl rounded-b-none border border-white/5 flex flex-col gap-2 mt-5">
                        <div className="flex items-center justify-between border-b border-dashed pb-2">
                          <p className="flex text-muted-foreground items-center gap-2">
                            Transaction Fee{" "}
                            <CentuariTooltip message="Coming Soon">
                              <Info size={12} />
                            </CentuariTooltip>
                          </p>
                          <div className="flex items-center gap-1">
                            <p>
                              {numericAmount > 0
                                ? formatCurrency(transactionFee)
                                : "$0.00"}{" "}
                              (0.01%)
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="flex text-muted-foreground items-center gap-2">
                            Amount to Pay Now
                          </p>
                          <div className="flex items-center gap-1">
                            <p>
                              {numericAmount > 0
                                ? formatCurrency(amountToPay)
                                : "$0.00"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="py-3 px-4 text-sm border border-white/5 rounded-b-lg border-t-0 text-muted-foreground bg-white/5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            In the future you'll pay{" "}
                            <CentuariTooltip message="Coming Soon">
                              <Info size={12} />
                            </CentuariTooltip>{" "}
                          </div>
                          <span className="text-transparent font-semibold bg-clip-text bg-gradient-to-r from-primary-blue-base via-white to-primary-blue-base">
                            {numericAmount > 0
                              ? formatCurrency(futureAmount)
                              : "$0.00"}
                          </span>
                        </div>
                      </div>

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
                  numericAmount <= 0 ||
                  numericAmount > availableQuota ||
                  selectedCollaterals.length === 0 ||
                  totalPortfolioValue === 0 ||
                  healthFactor < 1.0
                }
              >
                {isPending || dataLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {dataLoading ? "Loading..." : "Processing..."}
                  </>
                ) : (
                  "Confirm Borrow"
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
        primaryActionLabel="Start Earning"
        onPrimaryAction={() => router.push("/")}
        secondaryActionLabel="Done"
      />
    </>
  );
}
