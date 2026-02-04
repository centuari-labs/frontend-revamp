"use client";

import { useState, useEffect, useId, useRef } from "react";
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
import { HandCoins, Info, Loader2 } from "lucide-react";
import Image from "next/image";
import { CentuariTypography } from "./centuari-typography";
import { CentuariTooltip } from "./centuari-tooltip";
import { CentuariInput } from "./centuari-input";
import { CentuariButton } from "./centuari-button";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { usePrivy } from "@privy-io/react-auth";
import {
  formatNumberWithSeparator,
  parseNumberFromSeparator,
  formatCurrency,
  calculateFutureAmount,
} from "@/lib/utils";
import { normalizeMaturity, formatMaturityTimestamp } from "@/lib/maturity";
import { tokenList, defaultPortfolio, getLiquidationThreshold } from "@/lib/portfolio-data";
import { useRepay } from "@/hooks/use-repay";
import HealthFactor from "./centuari-health-factor";
import { TransactionSuccessDialog } from "./transaction-success-dialog";
import { useRouter } from "next/navigation";

interface CentuariRepayDialogProps {
  positionId: string;
  token_image: string;
  token_name: string;
  token_symbol: string;
  amountBorrowed: number; // Amount borrowed in USD
  apr: number; // APR as number (e.g., 4.9 for 4.9%)
  maturityDate?: number;
  onSuccess?: () => void; // Callback after successful repay
}

export function CentuariRepayDialog({
  positionId,
  token_image,
  token_name,
  token_symbol,
  amountBorrowed,
  apr,
  maturityDate,
  onSuccess,
}: CentuariRepayDialogProps) {
  const reactId = useId();
  const router = useRouter();
  const { getAccessToken } = usePrivy();
  const { repay, isPending } = useRepay();

  // State for amount input
  const [repayAmount, setRepayAmount] = useState<string>("");
  const [displayAmount, setDisplayAmount] = useState<string>("");

  // State for success dialog
  const [showSuccessDialog, setShowSuccessDialog] = useState<boolean>(false);
  const [successAmount, setSuccessAmount] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const isDialogOpenRef = useRef<boolean>(false);
  const isHoveringRef = useRef<boolean>(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Get token value from symbol
  const getTokenValue = (symbol: string): string => {
    const token = tokenList.find(t =>
      t.label.toUpperCase() === symbol.toUpperCase() ||
      t.value.toUpperCase() === symbol.toUpperCase()
    );
    return token?.value || symbol.toLowerCase();
  };

  const tokenValue = getTokenValue(token_symbol);

  // State for portfolio - sync with localStorage
  const [portfolio, setPortfolio] = useState<Record<string, number>>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("centuari_portfolio");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return defaultPortfolio;
        }
      }
    }
    return defaultPortfolio;
  });

  // State for total debt
  const [totalDebt, setTotalDebt] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("centuari_total_debt");
      if (stored) {
        try {
          return parseFloat(stored) || 0;
        } catch {
          return 0;
        }
      }
    }
    return 0;
  });

  // State for collateral status
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

  // Get available balance from portfolio for the token
  const token = tokenList.find(t => t.value === tokenValue);
  const availableBalance = token && token.price > 0
    ? (portfolio[tokenValue] || 0) / token.price
    : portfolio[tokenValue] || 0;

  // Calculate derived values
  const numericAmount = parseFloat(repayAmount) || 0;

  const normalizedMaturity = normalizeMaturity(maturityDate);
  const futureAmount = calculateFutureAmount(numericAmount, apr, normalizedMaturity);

  // Calculate new total debt after repayment
  const newTotalDebt = Math.max(0, totalDebt - numericAmount);

  // Calculate total portfolio value from collateral tokens
  const totalPortfolioValue = Object.entries(portfolio).reduce((total, [tokenValue, value]) => {
    if (collateralStatus[tokenValue] === true && value > 0) {
      return total + value;
    }
    return total;
  }, 0);

  // Calculate weighted Liquidation Threshold
  const weightedLT = totalPortfolioValue > 0
    ? Object.entries(portfolio).reduce((sum, [tokenValue, value]) => {
      if (collateralStatus[tokenValue] === true && value > 0) {
        const token = tokenList.find(t => t.value === tokenValue);
        if (token) {
          const lt = getLiquidationThreshold(token);
          return sum + (lt * value);
        }
      }
      return sum;
    }, 0) / totalPortfolioValue
    : 0;

  // Health Factor calculation: (Total Collateral Value × Liquidation Threshold) / Total Debt
  const currentHealthFactor = totalDebt > 0 && totalPortfolioValue > 0 && !isNaN(weightedLT) && weightedLT > 0
    ? Math.min((totalPortfolioValue * weightedLT) / totalDebt, 10)
    : 0;

  const newHealthFactor = newTotalDebt > 0 && totalPortfolioValue > 0 && !isNaN(weightedLT) && weightedLT > 0
    ? Math.min((totalPortfolioValue * weightedLT) / newTotalDebt, 10)
    : totalPortfolioValue > 0 ? 999 : 0; // If debt is 0, health factor is very high

  // Convert health factor to percentage for display
  const getHealthFactorPercentage = (hf: number): number => {
    if (hf <= 0 || isNaN(hf)) return 0;
    if (hf >= 2.5) return 100;
    if (hf >= 1.5) return 75 + ((hf - 1.5) / 1.0) * 25;
    if (hf >= 1.2) return 50 + ((hf - 1.2) / 0.3) * 25;
    if (hf >= 1.0) return 25 + ((hf - 1.0) / 0.2) * 25;
    return (hf / 1.0) * 25;
  };

  const currentHealthFactorPercentage = getHealthFactorPercentage(currentHealthFactor);
  const newHealthFactorPercentage = getHealthFactorPercentage(newHealthFactor);

  // Format APR with comma as decimal separator
  const formattedAPR = apr.toFixed(1).replace(".", ",") + "%";

  // Format amount borrowed
  const formattedAmountBorrowed = formatCurrency(amountBorrowed);

  // Format available balance
  const formattedAvailableBalance = formatCurrency(availableBalance * (token?.price || 1));

  // Handle amount input change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Remove $ prefix and any other non-numeric characters except decimal point
    const cleanValue = inputValue.replace(/^\$/, "").replace(/[^\d.]/g, "");

    // Parse to get clean numeric value
    const numericValue = parseNumberFromSeparator(cleanValue);

    // Format for display with thousand separators
    const formattedValue = formatNumberWithSeparator(numericValue);

    // Update both states
    setRepayAmount(numericValue);
    setDisplayAmount(formattedValue);
  };

  // Handle Max button - set amount to minimum of available balance or amount borrowed
  const handleMaxClick = () => {
    const maxAmount = Math.min(availableBalance * (token?.price || 1), amountBorrowed).toString();
    const formattedMax = formatNumberWithSeparator(maxAmount);
    setRepayAmount(maxAmount);
    setDisplayAmount(formattedMax);
  };

  const handleDialogChange = (open: boolean) => {
    // Prevent closing if processing
    if (isPending && !open) {
      return;
    }

    // Prevent closing if button is being hovered
    if (!open && isHoveringRef.current) {
      setTimeout(() => {
        if (!isHoveringRef.current && !isPending) {
          isDialogOpenRef.current = false;
          setIsDialogOpen(false);
          setRepayAmount("");
          setDisplayAmount("");
          setShowSuccessDialog(false);
        }
      }, 100);
      return;
    }

    isDialogOpenRef.current = open;
    setIsDialogOpen(open);

    if (!open) {
      setRepayAmount("");
      setDisplayAmount("");
      setShowSuccessDialog(false);
    } else {
      // Load latest data when dialog opens
      if (typeof window !== "undefined") {
        const storedPortfolio = localStorage.getItem("centuari_portfolio");
        if (storedPortfolio) {
          try {
            setPortfolio(JSON.parse(storedPortfolio));
          } catch { }
        }

        const storedDebt = localStorage.getItem("centuari_total_debt");
        if (storedDebt) {
          try {
            const parsed = parseFloat(storedDebt);
            if (!isNaN(parsed)) {
              setTotalDebt(parsed);
            }
          } catch { }
        }

        const storedCollateral = localStorage.getItem("centuari_collateral");
        if (storedCollateral) {
          try {
            setCollateralStatus(JSON.parse(storedCollateral));
          } catch { }
        }
      }
    }
  };

  // Sync portfolio, debt, and collateral from localStorage (listen for changes)
  useEffect(() => {
    const handleStorageChange = () => {
      if (typeof window !== "undefined") {
        const storedPortfolio = localStorage.getItem("centuari_portfolio");
        if (storedPortfolio) {
          try {
            setPortfolio(JSON.parse(storedPortfolio));
          } catch { }
        }

        const storedDebt = localStorage.getItem("centuari_total_debt");
        if (storedDebt) {
          try {
            const parsed = parseFloat(storedDebt);
            if (!isNaN(parsed)) {
              setTotalDebt(parsed);
            }
          } catch { }
        }

        const storedCollateral = localStorage.getItem("centuari_collateral");
        if (storedCollateral) {
          try {
            setCollateralStatus(JSON.parse(storedCollateral));
          } catch { }
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    const interval = setInterval(handleStorageChange, 500);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleRepay = async () => {
    if (numericAmount <= 0) return;

    const availableInUsd = availableBalance * (token?.price || 1);
    if (futureAmount > availableInUsd) return;
    if (numericAmount > amountBorrowed) return;

    try {
      await getAccessToken();

      await repay({
        positionId,
        amount: numericAmount,
        futureAmount,
        tokenValue,
      });

      setSuccessAmount(formatNumberWithSeparator(futureAmount));
      setRepayAmount("");
      setDisplayAmount("");
      setIsDialogOpen(false);
      setShowSuccessDialog(true);
      onSuccess?.();
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  };

  // Get health factor status text
  const getHealthFactorStatus = (hf: number): string => {
    if (hf <= 0 || isNaN(hf)) return "Safe";
    if (hf >= 2.5) return "Excellent";
    if (hf >= 1.5) return "Good";
    if (hf >= 1.2) return "Warning";
    if (hf >= 1.0) return "Critical";
    return "Danger";
  };

  const healthFactorChange = newHealthFactor - currentHealthFactor;
  const healthFactorChangeText = healthFactorChange > 0
    ? `+${healthFactorChange.toFixed(2)}`
    : healthFactorChange < 0
      ? healthFactorChange.toFixed(2)
      : "0.0";

  return (
    <>
      <button
        ref={buttonRef}
        className="text-white/80 hover:text-white transition-colors hover:bg-white/10 rounded-lg p-2"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setIsDialogOpen(true);
          isDialogOpenRef.current = true;
        }}
        onMouseEnter={() => {
          isHoveringRef.current = true;
        }}
        onMouseLeave={() => {
          isHoveringRef.current = false;
        }}
        type="button"
      >
        <HandCoins size={16} />
      </button>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent
          className="flex max-h-[min(600px,80vh)] flex-col gap-0 p-0 sm:max-w-md data-[state=open]:!zoom-in-0 data-[state=open]:duration-600"
          onPointerDownOutside={(e) => {
            if (buttonRef.current && buttonRef.current.contains(e.target as Node)) {
              e.preventDefault();
            }
          }}
          onInteractOutside={(e) => {
            if (buttonRef.current && buttonRef.current.contains(e.target as Node)) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader className="contents space-y-0 text-left">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
              <div className="absolute w-[568px] h-[450px] -top-72 left-0 bg-primary-blue-base/50 blur-[264px] opacity-100 transition-opacity duration-500" />
              <div className="absolute w-[150px] h-[216px] -top-60 left-1/3 bg-white blur-3xl opacity-100 transition-opacity duration-500" />
            </div>
            <ScrollArea className="flex max-h-full flex-col overflow-hidden pb-2">
              <div className="relative overflow-hidden min-h-[400px]">
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
                        Amount borrowed{" "}
                        <CentuariTooltip message="The total amount you have borrowed.">
                          <Info size={16} />
                        </CentuariTooltip>
                      </CentuariTypography>
                      <CentuariTypography variant="h5" className="text-center">
                        {formattedAmountBorrowed}
                      </CentuariTypography>
                    </div>
                    <div>
                      <CentuariTypography
                        className="flex items-center gap-1 text-muted-foreground"
                        variant="b3"
                      >
                        APR{" "}
                          <CentuariTooltip message="The annual percentage rate for this borrow position.">
                            <Info size={16} />
                          </CentuariTooltip>
                        </CentuariTypography>
                      <CentuariTypography variant="h5" className="text-center">
                        {formattedAPR}
                      </CentuariTypography>
                    </div>
                  </div>
                </div>

                <div className="mt-4 px-6">
                  <form action="">
                    <div className="mb-1.5 flex items-center justify-between">
                      <Label htmlFor={`amount-${reactId}`}>Enter amount to repay</Label>
                      <div className="flex text-xs text-muted-foreground items-center gap-1">
                        Available {formattedAvailableBalance}{" "}
                        <CentuariTooltip message="The maximum amount you can repay from your available balance.">
                          <Info size={12} />
                        </CentuariTooltip>
                      </div>
                    </div>
                    <CentuariInput
                      id={`amount-${reactId}`}
                      size="large"
                      placeholder="800,00"
                      leftIcon={
                        <span className="text-muted-foreground">$</span>
                      }
                      rightIcon={
                        <Button
                          variant="link"
                          className="px-0"
                          type="button"
                          onClick={handleMaxClick}
                        >
                          Max
                        </Button>
                      }
                      value={displayAmount}
                      onChange={handleAmountChange}
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      You can repay partially or fully
                    </p>

                    {/* Future Amount Section */}
                    {numericAmount > 0 && (
                      <div className="bg-white/5 py-3 px-4 text-sm rounded-xl border border-white/5 flex flex-col gap-2 mt-5">
                        <div className="flex items-center justify-between">
                          <p className="flex text-muted-foreground items-center gap-2">
                            Amount to repay{" "}
                            <CentuariTooltip message="The amount you will repay including interest calculated until maturity date.">
                              <Info size={12} />
                            </CentuariTooltip>
                          </p>
                          <span className="text-transparent font-semibold bg-clip-text bg-gradient-to-r from-primary-blue-base via-white to-primary-blue-base">
                            {formatCurrency(futureAmount)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-t border-dashed pt-2 mt-1">
                          <p className="text-muted-foreground text-xs">
                            Principal: {formatCurrency(numericAmount)}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            Interest: {formatCurrency(futureAmount - numericAmount)}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="mt-5">
                      <div className="mb-2 flex items-center justify-between">
                        <Label>
                          Changes in health factors{" "}
                          <CentuariTooltip message="Your health factor indicates the safety of your borrowed position. A higher number means lower liquidation risk.">
                            <Info size={16} />
                          </CentuariTooltip>
                        </Label>
                        <Badge
                          variant={
                            newHealthFactor <= 0 || isNaN(newHealthFactor)
                              ? "default"
                              : newHealthFactor >= 2.5
                                ? "success"
                                : newHealthFactor >= 1.5
                                  ? "default"
                                  : newHealthFactor >= 1.2
                                    ? "warning"
                                    : newHealthFactor >= 1.0
                                      ? "warning"
                                      : "destructive"
                          }
                        >
                          {numericAmount > 0
                            ? `${healthFactorChangeText} - ${getHealthFactorStatus(newHealthFactor)}`
                            : `${currentHealthFactor.toFixed(2)} - ${getHealthFactorStatus(currentHealthFactor)}`}
                        </Badge>
                      </div>
                      <div className="border border-white/5 rounded-lg mt-2">
                        <div className="px-2 py-5 rounded-lg border-b border-white/5 bg-white/10 z-50">
                          <HealthFactor
                            targetValue={numericAmount > 0 ? newHealthFactorPercentage : currentHealthFactorPercentage}
                            healthFactor={numericAmount > 0 ? newHealthFactor : currentHealthFactor}
                          />
                        </div>
                        <div className="px-2 py-4 z-20 -mt-2 border-t-0 border-white/5 rounded-b-lg">
                          <p className="text-xs text-muted-foreground text-center">
                            A higher number means lower liquidation risk.
                          </p>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </ScrollArea>
          </DialogHeader>
          <DialogFooter className="flex !flex-col gap-2 py-2 px-6">
            <div className="flex items-center gap-4">
              <DialogClose asChild>
                <CentuariButton variant="secondary">Cancel</CentuariButton>
              </DialogClose>
              <CentuariButton
                type="button"
                variant="primary"
                className="flex-1"
                onClick={handleRepay}
                disabled={
                  isPending ||
                  numericAmount <= 0 ||
                  futureAmount > availableBalance * (token?.price || 1) ||
                  numericAmount > amountBorrowed
                }
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Repay"
                )}
              </CentuariButton>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TransactionSuccessDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        title="Repay Complete"
        description={successAmount ? `You have successfully repaid ${successAmount} ${token_symbol} from your borrow position.` : `Your ${token_symbol} repay has been completed successfully.`}
        primaryActionLabel="Start Earning"
        onPrimaryAction={() => router.push("/")}
        secondaryActionLabel="Done"
      />
    </>
  );
}
