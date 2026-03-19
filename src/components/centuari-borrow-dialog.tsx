"use client";

import { useState, useRef, useEffect, useId } from "react";
import { gsap } from "gsap";
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
import { Info, ArrowLeft, Loader2 } from "lucide-react";
import Image from "next/image";
import { CentuariTypography } from "./centuari-typography";
import { CentuariTooltip } from "./centuari-tooltip";
import { CentuariInput } from "./centuari-input";
import { CentuariButton } from "./centuari-button";
import { Label } from "./ui/label";
import HealthFactor from "./centuari-health-factor";
import { Badge } from "./ui/badge";
import { CentuariAlert } from "./centuari-alert";
import { SelectToken } from "./select-token";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TransactionSuccessDialog } from "./transaction-success-dialog";
import {
  formatNumberWithSeparator,
  parseNumberFromSeparator,
  formatCurrency,
  calculateFutureAmount,
  getHealthFactorPercentage,
  getHealthFactorDisplayStatus,
} from "@/lib/utils";
import {
  getDefaultMaturityTimestamp,
  formatMaturityTimestamp,
} from "@/lib/maturity";
import { IcDollarCentuari } from "./icons/ic-dollar-centuari";
import { useSubmitBorrow } from "@/hooks/use-submit-borrow";
import { useBorrowDialogData } from "@/hooks/use-borrow-dialog-data";
import { useAuthToken } from "@/hooks/use-auth-token";
import { useQueryClient } from "@tanstack/react-query";
import { CollateralListDisplay } from "./collateral-list-display";
import { CollateralEmptyState } from "./collateral-empty-state";

type ViewMode = "borrow" | "deposit-collateral";

interface CentuariBorrowDialogProps {
  token_image: string;
  token_name: string;
  token_symbol: string;
  lendAPR: string; // Format: "6,5%"
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
  const router = useRouter();
  const { submitMarket, isPending } = useSubmitBorrow();
  const { getToken } = useAuthToken();
  const queryClient = useQueryClient();

  // Bridge hook: reads localStorage in mock mode, API in real mode
  const {
    portfolio,
    totalDebt,
    collateralStatus,
    collateralTokenList,
    userHealthFactor,
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

  // Calculate max borrow capacity = (Total Portfolio Value × LTV)
  const maxBorrowCapacity = totalPortfolioValue * weightedLTV;

  // Calculate available quota = Max Borrow Capacity - Total Debt
  const availableQuota = maxBorrowCapacity - totalDebt;

  // Calculate new total debt after this borrow (current debt + new borrow amount)
  const newTotalDebt = totalDebt + numericAmount;

  // Health Factor — matches backend formula (health-factor.helpers.ts):
  // HF = ((collateralUsd - existingDebtUsd) × weightedLTV) / totalDebtUsd
  const healthFactor =
    newTotalDebt > 0 &&
    totalPortfolioValue > 0 &&
    !isNaN(weightedLTV) &&
    selectedCollaterals.length > 0
      ? (() => {
          const numerator =
            (totalPortfolioValue - totalDebt) * weightedLTV;
          const calculatedHF = numerator / newTotalDebt;
          if (!Number.isFinite(calculatedHF) || calculatedHF < 0) return 0;
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

  const handleAddCollateralClick = () => setViewMode("deposit-collateral");
  const handleBackToBorrow = () => setViewMode("borrow");

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
      setViewMode("borrow");
      setAmountToBorrow("");
      setDisplayAmount("");
      setShowSuccessDialog(false);
      setSubmitError(null);
      setSelectedCollaterals([]);
    }
  };

  // Animate transitions between views
  useEffect(() => {
    const tl = gsap.timeline();

    if (
      viewMode === "borrow" &&
      borrowViewRef.current &&
      collateralViewRef.current
    ) {
      tl.to(collateralViewRef.current, {
        x: 100,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
      }).fromTo(
        borrowViewRef.current,
        { x: -100, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.3, ease: "power2.out" },
        "-=0.15",
      );
    } else if (
      viewMode === "deposit-collateral" &&
      borrowViewRef.current &&
      collateralViewRef.current
    ) {
      tl.to(borrowViewRef.current, {
        x: -100,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
      }).fromTo(
        collateralViewRef.current,
        { x: 100, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.3, ease: "power2.out" },
        "-=0.15",
      );
    }
  }, [viewMode]);

  const handleBorrow = async () => {
    if (viewMode === "borrow") {
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
          error instanceof Error
            ? error.message
            : "Transaction failed. Please try again.";
        setSubmitError(message);
      }
    } else if (viewMode === "deposit-collateral") {
      // Deposit logic placeholder - not yet implemented
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
                  className={
                    viewMode === "borrow"
                      ? "relative"
                      : "absolute inset-0 pointer-events-none"
                  }
                  style={{ opacity: viewMode === "borrow" ? 1 : 0 }}
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
                        // rightIcon={
                        //   <Button
                        //     variant="link"
                        //     className="px-0"
                        //     type="button"
                        //     onClick={handleMaxClick}
                        //   >
                        //     Max
                        //   </Button>
                        // }
                        // balanceText={`Available Quota: ${formatCurrency(availableQuota)}`}
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
                      {/* 
                    <div>
                      <Label className="mb-2 mt-4">
                        Maturity{" "}
                        <CentuariTooltip message="Select the maturity period for your borrowed USDT.">
                          <Info size={16} />
                        </CentuariTooltip>
                      </Label>
                      <MaturityToggle />
                      <CentuariTypography
                        variant="s4"
                        className="mt-2 text-muted-foreground flex items-center gap-1"
                      >
                        Withdrawal Unlocks on
                        <CentuariTypography variant="s4">
                          21 Oct 2026
                        </CentuariTypography>
                      </CentuariTypography>
                    </div> */}

                      {/* <SelectSingleToken /> */}

                      {/* {(numericAmount > availableQuota || selectedCollaterals.length === 0 || totalPortfolioValue === 0 || healthFactor < 1.0) && (
                      <CentuariAlert
                        variant="destructive"
                        text={
                          numericAmount > availableQuota
                            ? "Exceeds available quota"
                            : selectedCollaterals.length === 0
                            ? "No collateral selected"
                            : totalPortfolioValue === 0
                            ? "No portfolio value"
                            : "Health factor too low"
                        }
                        description={
                          numericAmount > availableQuota
                            ? `Available quota: ${formatCurrency(availableQuota)}. Select more collateral or repay debt.`
                            : selectedCollaterals.length === 0
                            ? "Select collateral from your portfolio to borrow"
                            : totalPortfolioValue === 0
                            ? "Selected collateral has no value in portfolio"
                            : "Increase collateral or reduce borrow amount to improve health factor"
                        }
                        className="mt-1.5"
                        action={
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleAddCollateralClick}
                            type="button"
                          >
                            {selectedCollaterals.length === 0 ? "Add Collateral" : "Deposit"}
                          </Button>
                        }
                      />
                    )} */}

                      <div>
                        <Label className="mb-2 mt-4">
                          Health Factor{" "}
                          <CentuariTooltip message="Your health factor indicates the safety of your borrowed position. Health Factor = (Total Collateral Value × Collateral Factor) / Total Borrowed Value">
                            <Info size={16} />
                          </CentuariTooltip>
                          {(() => {
                            const displayHF = healthFactor > 0 ? healthFactor : userHealthFactor;
                            const hasInput = numericAmount > 0 && selectedCollaterals.length > 0;
                            const effectiveHF = hasInput ? healthFactor : displayHF;
                            const { value, status, variant } = effectiveHF > 0
                              ? getHealthFactorDisplayStatus(effectiveHF)
                              : { value: "0.00", status: "Safe", variant: "default" as const };
                            return (
                              <Badge variant={variant}>
                                {`${value} ~ ${status}`}
                              </Badge>
                            );
                          })()}
                        </Label>
                        <div className="border border-white/5 rounded-lg mt-2">
                          <div className="px-2 py-5 rounded-lg border-b border-white/5 bg-white/10 z-50">
                            {(() => {
                              const displayHF = healthFactor > 0 ? healthFactor : userHealthFactor;
                              const displayPercentage = healthFactorPercentage > 0 ? healthFactorPercentage : (displayHF > 0 ? getHealthFactorPercentage(displayHF) : 0);
                              return (
                                <HealthFactor
                                  targetValue={displayPercentage}
                                  healthFactor={
                                    displayHF > 0 && !isNaN(displayHF)
                                      ? displayHF
                                      : undefined
                                  }
                                />
                              );
                            })()}
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
                                    {formatCurrency(
                                      totalPortfolioValue * weightedLTV,
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

                {/* Add-Collateral View */}
                {/* <div
                ref={collateralViewRef}
                className={
                  viewMode === "add-collateral"
                    ? "relative mt-6 px-6"
                    : "absolute inset-0 pointer-events-none mt-6 px-6"
                }
                style={{ opacity: viewMode === "add-collateral" ? 1 : 0 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToBorrow}
                  className="mb-4 -ml-2"
                  type="button"
                >
                  <ArrowLeft size={16} />
                </Button>
                <CentuariTypography variant="h1" className="mb-1">
                  Add Collateral
                </CentuariTypography>
                <span className="text-sm text-muted-foreground">
                  Increase your borrowing limit and keep your position safe.
                </span>
                <form action="">
                  <SelectSingleToken />
                  <div>
                    <Label className="mb-2 mt-4">
                      Est. Health Factor{" "}
                      <CentuariTooltip message="Your health factor indicates the safety of your borrowed position.">
                        <Info size={16} />
                      </CentuariTooltip>
                      {(() => {
                        const { value, status, variant } = userHealthFactor > 0
                          ? getHealthFactorDisplayStatus(userHealthFactor)
                          : { value: "0.00", status: "Safe", variant: "default" as const };
                        return <Badge variant={variant}>{`${value} ~ ${status}`}</Badge>;
                      })()}
                    </Label>
                    <div className="border border-white/5 rounded-lg mt-2">
                      <div className="px-2 py-5 rounded-lg border-b border-white/5 bg-white/10 z-50">
                        <HealthFactor
                          targetValue={userHealthFactor > 0 ? getHealthFactorPercentage(userHealthFactor) : 0}
                          healthFactor={userHealthFactor > 0 ? userHealthFactor : undefined}
                        />
                      </div>
                      <div className="px-2 py-4 z-20 -mt-2 border-t-0 border-white/5 rounded-b-lg">
                        <p className="text-xs text-muted-foreground">
                          If USDC drops{" "}
                          <span className="text-white font-medium">
                            below $000
                          </span>
                          , your position could be liquidated.
                        </p>
                      </div>
                    </div>
                  </div>
                </form>
              </div> */}

                {/* Deposit */}
                <div
                  ref={collateralViewRef}
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
                    onClick={handleBackToBorrow}
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
                      Select the asset and amount you want to add, and power up
                      your Centuari balance.
                    </CentuariTypography>
                  </div>
                  <form>
                    <SelectToken />
                    <CentuariInput
                      id="amount"
                      label="Deposit Amount"
                      size="large"
                      placeholder="Amount"
                      leftIcon={<IcDollarCentuari size={16} />}
                      className="mt-0"
                      containerClassName="mt-3.5"
                    />
                  </form>
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
                  (viewMode === "borrow" &&
                    (numericAmount <= 0 ||
                      numericAmount > availableQuota ||
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
        primaryActionLabel="Start Earning"
        onPrimaryAction={() => router.push("/")}
        secondaryActionLabel="Done"
      />
    </>
  );
}
