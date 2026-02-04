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
import { MultiSelect } from "./ui/multi-select";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { TransactionSuccessDialog } from "./transaction-success-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatNumberWithSeparator, parseNumberFromSeparator, formatCurrency, calculateFutureAmount } from "@/lib/utils";
import { getDefaultMaturityTimestamp, formatMaturityTimestamp } from "@/lib/maturity";
import { IcDollarCentuari } from "./icons/ic-dollar-centuari";
import { tokenList, defaultPortfolio, getLiquidationThreshold } from "@/lib/portfolio-data";
import { useSubmitBorrow } from "@/hooks/use-submit-borrow";

type ViewMode = "borrow" | "deposit-collateral";

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
  const [viewMode, setViewMode] = useState<ViewMode>("borrow");
  const borrowViewRef = useRef<HTMLDivElement>(null);
  const collateralViewRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const router = useRouter();
  const { getAccessToken } = usePrivy();
  const { submitMarket, isPending } = useSubmitBorrow();

  // State for amount input
  const [amountToBorrow, setAmountToBorrow] = useState<string>("");
  const [displayAmount, setDisplayAmount] = useState<string>("");

  // State for collateral selection (only select, no amount input)
  // This is for selecting which tokens to use for THIS borrow, NOT for "As Collateral" checkbox
  // Should start empty and user selects manually
  const [selectedCollaterals, setSelectedCollaterals] = useState<string[]>([]);

  // State for portfolio (dummy data - in real app from API/state)
  const [portfolio, setPortfolio] = useState<Record<string, number>>(() => {
    // Load from localStorage if available; merge with defaultPortfolio so new tokens (e.g. XSGD, IDRX) get default balances
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("centuari_portfolio");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Migrate old AAVE data to XAUT if exists
          if (parsed.aave && !parsed.xaut) {
            parsed.xaut = parsed.aave;
            delete parsed.aave;
          }
          // Merge with defaultPortfolio so missing keys (e.g. xsgd, idrx) get defaults
          const merged = { ...defaultPortfolio, ...parsed };
          localStorage.setItem("centuari_portfolio", JSON.stringify(merged));
          return merged;
        } catch {
          return defaultPortfolio;
        }
      }
    }
    return defaultPortfolio;
  });

  // State for total debt (all borrows combined)
  // Default to a realistic debt amount that allows various health factor statuses
  // With default portfolio ~$200k, default debt of $80k allows HF to vary:
  // - Small borrows -> Good/Warning status
  // - Medium borrows -> Critical status  
  // - Large borrows -> Danger status
  const [totalDebt, setTotalDebt] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("centuari_total_debt");
      if (stored) {
        try {
          const parsed = parseFloat(stored);
          // Use stored value if it's valid and > 0; otherwise use default for realistic HF scenarios
          // This ensures users see various HF statuses instead of always Excellent
          return !isNaN(parsed) && parsed > 0 ? parsed : 80000;
        } catch {
          return 80000; // Default: $80k debt for realistic HF scenarios
        }
      }
    }
    return 80000; // Default: $80k debt for realistic HF scenarios
  });

  // State for collateral status (which tokens are marked as collateral)
  const [collateralStatus, setCollateralStatus] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("centuari_collateral");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return {};
        }
      }
    }
    return {};
  });

  // State for success dialog
  const [showSuccessDialog, setShowSuccessDialog] = useState<boolean>(false);
  const [successAmount, setSuccessAmount] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  // Sync portfolio to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("centuari_portfolio", JSON.stringify(portfolio));
    }
  }, [portfolio]);

  // Do NOT sync selectedCollaterals to collateralStatus
  // collateralStatus is controlled by "As Collateral" checkbox in portfolio, not by MultiSelect

  // Sync total debt to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("centuari_total_debt", totalDebt.toString());
    }
  }, [totalDebt]);

  // Do NOT auto-sync selectedCollaterals with collateralStatus
  // selectedCollaterals is for selecting tokens for THIS borrow (user selects manually)
  // collateralStatus is for determining which tokens CAN be used as collateral (from "As Collateral" checkbox)

  // Sync collateral status from localStorage (listen for changes)
  useEffect(() => {
    const handleStorageChange = () => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("centuari_collateral");
        if (stored) {
          try {
            const collateralStatusData = JSON.parse(stored);
            setCollateralStatus(collateralStatusData);
          } catch {
            // If parsing fails, keep current state
          }
        }
      }
    };

    // Listen for storage changes (from other tabs/components)
    window.addEventListener("storage", handleStorageChange);

    // Also check periodically (for same-tab updates)
    const interval = setInterval(handleStorageChange, 500);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []); // Only run once on mount

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
  const transactionFee = numericAmount * 0.0001; // 0.01%

  // Amount to pay: borrow amount + transaction fee
  const amountToPay = numericAmount + transactionFee;

  // Maturity date - withdrawal unlocks on the same date
  const maturityDate = getDefaultMaturityTimestamp();

  const futureAmount = calculateFutureAmount(numericAmount, borrowAPRNumeric, maturityDate);

  // Calculate total portfolio value from selected collaterals
  const totalPortfolioValue = selectedCollaterals.reduce((total, collateralValue) => {
    const portfolioValue = portfolio[collateralValue] || 0;
    return total + portfolioValue;
  }, 0);

  // Calculate weighted LTV (average LTV of selected collaterals)
  const weightedLTV = selectedCollaterals.length > 0 && totalPortfolioValue > 0
    ? selectedCollaterals.reduce((sum, collateralValue) => {
      const token = tokenList.find(t => t.value === collateralValue);
      const portfolioValue = portfolio[collateralValue] || 0;
      if (token && portfolioValue > 0) {
        return sum + (token.ltv * portfolioValue);
      }
      return sum;
    }, 0) / totalPortfolioValue
    : parseAPR(collateralFactor) / 100; // Use collateralFactor as LTV if no selection

  // Calculate weighted Liquidation Threshold (average LT of selected collaterals)
  const weightedLT = selectedCollaterals.length > 0 && totalPortfolioValue > 0
    ? selectedCollaterals.reduce((sum, collateralValue) => {
      const token = tokenList.find(t => t.value === collateralValue);
      const portfolioValue = portfolio[collateralValue] || 0;
      if (token && portfolioValue > 0) {
        const lt = getLiquidationThreshold(token);
        return sum + (lt * portfolioValue);
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
  const healthFactor = newTotalDebt > 0 && totalPortfolioValue > 0 && !isNaN(weightedLT) && selectedCollaterals.length > 0
    ? (() => {
      const calculatedHF = (totalPortfolioValue * weightedLT) / newTotalDebt;
      // Cap at 10 for display, but log if it's unreasonably large (likely a bug)
      if (calculatedHF > 10) {
        console.warn(`Health factor is unusually high: ${calculatedHF}. Portfolio: ${totalPortfolioValue}, LT: ${weightedLT}, Debt: ${newTotalDebt}`);
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
  const healthFactorPercentage = healthFactor > 0 && !isNaN(healthFactor) && selectedCollaterals.length > 0 && numericAmount > 0
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
      // Load collateralStatus from localStorage when dialog opens
      // This determines which tokens CAN be used as collateral (from "As Collateral" checkbox)
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("centuari_collateral");
        if (stored) {
          try {
            const collateralStatusData = JSON.parse(stored);
            setCollateralStatus(collateralStatusData);

            // Auto-select all tokens that are set as collateral
            const autoSelected = tokenList
              .filter(token =>
                portfolio[token.value] &&
                portfolio[token.value] > 0 &&
                collateralStatusData[token.value] === true
              )
              .map(token => token.value);

            setSelectedCollaterals(autoSelected);
          } catch {
            // If parsing fails, keep current state
            setSelectedCollaterals([]);
          }
        } else {
          // No collateral status, reset to empty
          setSelectedCollaterals([]);
        }
      }
    } else {
      setViewMode("borrow");
      setAmountToBorrow("");
      setDisplayAmount("");
      setShowSuccessDialog(false);
      // Clear selectedCollaterals when dialog closes
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
        "-=0.15"
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
        "-=0.15"
      );
    }
  }, [viewMode]);

  const handleBorrow = async () => {
    if (viewMode === "borrow") {
      if (numericAmount <= 0 || numericAmount > availableQuota) return;
      if (selectedCollaterals.length === 0 || totalPortfolioValue === 0) return;
      if (healthFactor < 1.0) return;

      const borrowedToken = tokenList.find(
        (t) =>
          t.label.toUpperCase() === token_symbol?.toUpperCase() ||
          t.value.toUpperCase() === token_symbol?.toUpperCase()
      );
      if (!borrowedToken) return;

      try {
        await getAccessToken();

        await submitMarket({
          tokenValue: borrowedToken.value,
          tokenLogo: borrowedToken.logo,
          tokenLabel: borrowedToken.label,
          amount: numericAmount,
          maturity: maturityDate,
          collateralTokens: selectedCollaterals,
        });

        setSuccessAmount(formatNumberWithSeparator(numericAmount));
        setAmountToBorrow("");
        setDisplayAmount("");
        setSelectedCollaterals([]);
        setIsDialogOpen(false);
        setShowSuccessDialog(true);
      } catch (error) {
        console.error("Transaction failed:", error);
      }
    } else if (viewMode === "deposit-collateral") {
      try {
        await getAccessToken();
        // Deposit logic placeholder - no hook yet
      } catch (error) {
        console.error("Deposit failed:", error);
      }
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
                    <CentuariTypography variant="h4">{token_symbol}</CentuariTypography>
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
                        <CentuariTypography variant="h5" className="text-center">
                          {formatMaturityTimestamp(maturityDate)}
                        </CentuariTypography>
                      </div>
                      <div>
                        <CentuariTypography
                          className="flex items-center gap-1 text-muted-foreground"
                          variant="b3"
                        >
                          Borrow APR{" "}
                          <CentuariTooltip message={`The interest rate at which you can borrow ${token_symbol}.`}>
                            <Info size={16} />
                          </CentuariTooltip>
                        </CentuariTypography>
                        <CentuariTypography variant="h5" className="text-center">
                          {borrowAPR}
                        </CentuariTypography>
                      </div>
                      <div>
                        <CentuariTypography
                          className="flex items-center gap-1 text-muted-foreground"
                          variant="b3"
                        >
                          Lend APR{" "}
                          <CentuariTooltip message={`The annual percentage rate for borrowing ${token_symbol} after fees.`}>
                            <Info size={16} />
                          </CentuariTooltip>
                        </CentuariTypography>
                        <CentuariTypography variant="h5" className="text-center">
                          {lendAPR}
                        </CentuariTypography>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm mt-3 text-primary-blue-20 bg-primary-blue-base/20 border border-primary-blue-base/10 py-2 text-center mx-6 self-stretch rounded-md">
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
                          {/* Custom Display for Selected Collaterals */}
                          {selectedCollaterals.length > 0 ? (
                            <div className="flex items-center justify-between gap-3 p-0.5 rounded-md border bg-white/5 hover:bg-white/5">
                              <div className="flex items-center gap-2 flex-1 min-w-0 px-2">
                                {/* Display max 4 token icons */}
                                <div className="flex items-center -space-x-2">
                                  {selectedCollaterals.slice(0, 4).map((tokenValue, index) => {
                                    const token = tokenList.find(t => t.value === tokenValue);
                                    if (!token) return null;
                                    return (
                                      <div
                                        key={tokenValue}
                                        className="relative"
                                        style={{ zIndex: 10 - index }}
                                      >
                                        <Image
                                          src={token.logo}
                                          alt={token.label}
                                          width={24}
                                          height={24}
                                        // className="rounded-full border-2 border-white/10 bg-white/5"
                                        />
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Badge for remaining tokens */}
                                {selectedCollaterals.length > 4 && (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <button
                                        type="button"
                                        className="flex items-center justify-center px-2.5 py-1 rounded-full bg-blue-600/20 border border-blue-600/30 text-blue-400 text-xs font-medium hover:bg-blue-600/30 transition-colors cursor-pointer"
                                      >
                                        {selectedCollaterals.length - 4 === 1
                                          ? "+1 asset"
                                          : `+${selectedCollaterals.length - 4} assets`}
                                      </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-56 p-3 border-white/10">
                                      <div className="flex flex-col gap-2">
                                        <p className="text-xs font-medium text-white/60 mb-1">Additional Assets:</p>
                                        {selectedCollaterals.slice(4).map((tokenValue) => {
                                          const token = tokenList.find(t => t.value === tokenValue);
                                          if (!token) return null;
                                          return (
                                            <div
                                              key={tokenValue}
                                              className="flex items-center gap-2 py-1"
                                            >
                                              <Image
                                                src={token.logo}
                                                alt={token.label}
                                                width={20}
                                                height={20}
                                                className="rounded-full"
                                              />
                                              <span className="text-sm text-white">{token.label}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                )}
                              </div>

                              {/* Change Button */}
                              <Link href="/portfolio">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="hover:underline hover:!bg-transparent hover:cursor-pointer"
                                >
                                  Change
                                </Button>
                              </Link>
                            </div>
                          ) : (
                            /* MultiSelect for selecting when no collateral selected */
                            <MultiSelect
                              options={tokenList.filter(token =>
                                portfolio[token.value] &&
                                portfolio[token.value] > 0 &&
                                collateralStatus[token.value] === true
                              )}
                              onValueChange={handleCollateralChange}
                              placeholder="Select Coins"
                              variant="default"
                              maxCount={4}
                              hideSelectAll={true}
                              defaultValue={selectedCollaterals}
                              resetOnDefaultValueChange={true}
                            />
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
                          <Badge
                            variant={
                              healthFactor === 0 || selectedCollaterals.length === 0 || numericAmount === 0
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
                              if (healthFactor > 0 && !isNaN(healthFactor) && selectedCollaterals.length > 0 && numericAmount > 0) {
                                // Format health factor with 2 decimal places
                                // Health factor should be in range 0-10 typically
                                // Ensure health factor is a reasonable number (not thousands)
                                let hfValue = healthFactor;

                                // If health factor is unreasonably large (likely a calculation error), cap it
                                if (hfValue > 10) {
                                  hfValue = 10;
                                }

                                const hfDisplay = parseFloat(hfValue.toFixed(2));
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
                              healthFactor={healthFactor > 0 && !isNaN(healthFactor) ? healthFactor : undefined}
                            />
                          </div>
                          <div className="px-2 py-4 z-20 -mt-2 border-t-0 border-white/5 rounded-b-lg">
                            <p className="text-xs text-muted-foreground text-center">
                              {healthFactor > 0 && !isNaN(healthFactor) ? (
                                <>
                                  If portfolio value drops{" "}
                                  <span className="text-white font-medium">
                                    below {formatCurrency(newTotalDebt / weightedLT)}
                                  </span>
                                  {" "}or total debt exceeds{" "}
                                  <span className="text-white font-medium">
                                    {formatCurrency(totalPortfolioValue * weightedLT)}
                                  </span>
                                  , your position could be liquidated.
                                </>
                              ) : (
                                <>Select collateral from portfolio and enter borrow amount to see health factor.</>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/5 py-3 px-4 text-sm rounded-xl rounded-b-none border border-white/5 flex flex-col gap-2 mt-5">
                        <div className="flex items-center justify-between border-b border-dashed pb-2">
                          <p className="flex text-muted-foreground items-center gap-2">
                            Transaction Fee{" "}
                            <CentuariTooltip message="Coming Soon">
                              <Info size={12} />
                            </CentuariTooltip>
                          </p>
                          <div className="flex items-center gap-1">
                            <p>{numericAmount > 0 ? formatCurrency(transactionFee) : "$0.00"} (0.01%)</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="flex text-muted-foreground items-center gap-2">
                            Amount to Pay Now
                          </p>
                          <div className="flex items-center gap-1">
                            <p>{numericAmount > 0 ? formatCurrency(amountToPay) : "$0.00"}</p>
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
                            {numericAmount > 0 ? formatCurrency(futureAmount) : "$0.00"}
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
                      <Badge variant="success">0.0 ~ Safe</Badge>
                    </Label>
                    <div className="border border-white/5 rounded-lg mt-2">
                      <div className="px-2 py-5 rounded-lg border-b border-white/5 bg-white/10 z-50">
                        <HealthFactor />
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
                  (viewMode === "borrow" &&
                    (numericAmount <= 0 ||
                      numericAmount > availableQuota ||
                      selectedCollaterals.length === 0 ||
                      totalPortfolioValue === 0 ||
                      healthFactor < 1.0))
                }
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : viewMode === "borrow" ? (
                  "Confirm Borrow"
                ) : (
                  "Confirm Add Collateral"
                )}
              </CentuariButton>
            </div>
            <p className="text-xs text-muted-foreground text-center leading-relaxed mb-2">
              This position is automatically refinanced. At maturity, it will roll
              over to the next available term unless you take action.
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TransactionSuccessDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        title="Borrow Complete"
        description={successAmount ? `You have successfully borrowed ${successAmount} ${token_symbol} from the vault.` : `Your ${token_symbol} borrow has been completed successfully.`}
        primaryActionLabel="Start Earning"
        onPrimaryAction={() => router.push("/")}
        secondaryActionLabel="Done"
      />
    </>
  );
}
