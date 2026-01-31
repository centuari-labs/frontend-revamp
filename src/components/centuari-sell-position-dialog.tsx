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
import { Info, Loader2 } from "lucide-react";
import Image from "next/image";
import { CentuariTypography } from "./centuari-typography";
import { CentuariTooltip } from "./centuari-tooltip";
import { CentuariInput } from "./centuari-input";
import { CentuariButton } from "./centuari-button";
import { Label } from "./ui/label";
import { usePrivy } from "@privy-io/react-auth";
import {
  formatNumberWithSeparator,
  parseNumberFromSeparator,
  formatCurrency,
  parseDateString,
  calculateDaysDifference,
} from "@/lib/utils";
import { tokenList } from "@/lib/portfolio-data";
import { IcCreditCardUpload } from "./icons/ic-credit-card-upload";

interface CentuariSellPositionDialogProps {
  positionId: string;
  token_image: string;
  token_name: string;
  token_symbol: string;
  maturityDate?: string; // Default: "1 Feb 2026"
  availableFunds: number; // Available funds in USD (current position value)
  moneyDeposited: number; // Original deposit amount
  profitReturn: number; // Profit amount
  apr?: number; // APR as decimal (e.g., 0.1 for 10%)
  onSuccess?: () => void; // Callback after successful sell
}

export function CentuariSellPositionDialog({
  positionId,
  token_image,
  token_name,
  token_symbol,
  maturityDate = "1 Feb 2026",
  availableFunds,
  moneyDeposited,
  profitReturn,
  apr = 0.1, // Default 10% APR
  onSuccess,
}: CentuariSellPositionDialogProps) {
  const reactId = useId();
  const { getAccessToken } = usePrivy();

  // State for amount input
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [displayAmount, setDisplayAmount] = useState<string>("");

  // State for transaction processing
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState<boolean>(false);
  const [successAmount, setSuccessAmount] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const isDialogOpenRef = useRef<boolean>(false);
  const isHoveringRef = useRef<boolean>(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Calculate derived values
  const numericAmount = parseFloat(withdrawAmount) || 0;

  // Calculate profit return based on APR formula
  // Formula: moneyDeposited + (moneyDeposited * APR/100/365 * (today+1 - maturity date))
  const calculateProfitReturn = (): number => {
    if (numericAmount <= 0) return 0;

    // Parse maturity date
    const maturityDateObj = parseDateString(maturityDate);
    if (!maturityDateObj) return 0;

    // Get today + 1 day
    const todayPlusOne = new Date();
    todayPlusOne.setDate(todayPlusOne.getDate() + 1);

    // Calculate days difference: (today+1 - maturity date)
    // Using absolute value to ensure positive days
    const days = Math.abs(calculateDaysDifference(maturityDateObj, todayPlusOne));

    // Calculate proportional money deposited for this withdrawal
    const proportionalDeposit = availableFunds > 0
      ? (numericAmount / availableFunds) * moneyDeposited
      : 0;

    // Profit Return = moneyDeposited + (moneyDeposited * APR/100/365 * days)
    // APR is in decimal form (e.g., 0.1 for 10%), so we multiply by 100 to get percentage
    const profit = proportionalDeposit + (proportionalDeposit * apr / 365 * days);

    return profit;
  };

  // Withdraw Shares = the input amount
  const withdrawShares = numericAmount > 0 ? numericAmount : 0;

  // Calculate profit return based on APR formula
  const calculatedProfitReturn = calculateProfitReturn();

  // Total amount after withdraw = Withdraw Shares + Profit Return
  const totalAfterWithdraw = withdrawShares + calculatedProfitReturn;

  // Format available funds with currency and CBT suffix
  const formattedAvailableFunds = `${formatNumberWithSeparator(availableFunds)} CBT`;

  // Format APR for display
  // const formattedAPR = `${(apr * 100).toFixed(1).replace(".", ",")}%`;

  // Handle amount input change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Remove $ prefix and any other non-numeric characters except decimal point
    const cleanValue = inputValue.replace(/^\$/, "").replace(/[^\d.]/g, "");

    // Parse to get clean numeric value (removes thousand separators, keeps decimal point)
    const numericValue = parseNumberFromSeparator(cleanValue);

    // Format for display with thousand separators
    const formattedValue = formatNumberWithSeparator(numericValue);

    // Update both states: numeric value for calculations, formatted value for display
    setWithdrawAmount(numericValue);
    setDisplayAmount(formattedValue);
  };

  // Handle Max button - set amount to available funds
  const handleMaxClick = () => {
    const maxAmount = availableFunds.toString();
    const formattedMax = formatNumberWithSeparator(maxAmount);
    setWithdrawAmount(maxAmount);
    setDisplayAmount(formattedMax);
  };

  const handleDialogChange = (open: boolean) => {
    // Prevent closing if processing
    if (isProcessing && !open) {
      return;
    }

    // Prevent closing if button is being hovered (to avoid flickering)
    if (!open && isHoveringRef.current) {
      // Use setTimeout to allow hover state to update
      setTimeout(() => {
        if (!isHoveringRef.current && !isProcessing) {
          isDialogOpenRef.current = false;
          setIsDialogOpen(false);
          setWithdrawAmount("");
          setDisplayAmount("");
          setIsProcessing(false);
          setShowSuccessDialog(false);
        }
      }, 100);
      return;
    }

    // Update ref immediately to prevent race conditions
    isDialogOpenRef.current = open;
    setIsDialogOpen(open);

    if (!open) {
      setWithdrawAmount("");
      setDisplayAmount("");
      setIsProcessing(false);
      setShowSuccessDialog(false);
    }
  };

  // Auto-close success dialog after 3 seconds
  useEffect(() => {
    if (showSuccessDialog) {
      const timer = setTimeout(() => {
        setShowSuccessDialog(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showSuccessDialog]);

  const handleSell = async () => {
    // Validate amount
    if (numericAmount <= 0) {
      return;
    }

    // Check if amount exceeds available funds
    if (numericAmount > availableFunds) {
      return;
    }

    // Start processing
    setIsProcessing(true);

    try {
      // Simulate transaction processing delay (1.5 seconds)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Get access token (for future API integration)
      const accessToken = await getAccessToken();
      console.log("Access Token:", accessToken);

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Update position in localStorage
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("centuari_positions");
        if (stored) {
          try {
            const positions = JSON.parse(stored);
            const updatedPositions = positions
              .map((pos: any) => {
                if (pos.id === positionId) {
                  // Update position amount (reduce by withdraw amount)
                  const newAmount = Math.max(0, (pos.amount || 0) - numericAmount);

                  // If amount becomes 0 or very small, remove the position
                  if (newAmount < 0.01) {
                    return null; // Mark for removal
                  }

                  return {
                    ...pos,
                    amount: newAmount,
                  };
                }
                return pos;
              })
              .filter((pos: any) => pos !== null); // Remove null positions

            localStorage.setItem("centuari_positions", JSON.stringify(updatedPositions));
          } catch (error) {
            console.error("Error updating position:", error);
          }
        }
      }

      // Update portfolio (add withdrawn amount back to portfolio)
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("centuari_portfolio");
        if (stored) {
          try {
            const portfolio = JSON.parse(stored);
            // Find token in portfolio and add withdrawn amount
            const token = tokenList.find(t =>
              t.label.toUpperCase() === token_symbol.toUpperCase() ||
              t.value.toUpperCase() === token_symbol.toUpperCase()
            );

            if (token) {
              const currentValue = portfolio[token.value] || 0;
              portfolio[token.value] = currentValue + numericAmount;
              localStorage.setItem("centuari_portfolio", JSON.stringify(portfolio));
            }
          } catch (error) {
            console.error("Error updating portfolio:", error);
          }
        }
      }

      // Update total supply (reduce by withdrawn amount for lend positions)
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("centuari_total_supply");
        if (stored) {
          try {
            const currentSupply = parseFloat(stored) || 0;
            const newSupply = Math.max(0, currentSupply - numericAmount);
            localStorage.setItem("centuari_total_supply", newSupply.toString());
          } catch (error) {
            console.error("Error updating total supply:", error);
          }
        }
      }

      // Store success data
      setSuccessAmount(formatNumberWithSeparator(numericAmount));

      // Reset amount input
      setWithdrawAmount("");
      setDisplayAmount("");

      // Log transaction (simulating real transaction)
      console.log(`Sold ${numericAmount} ${token_symbol} from position ${positionId}`);

      // Close main dialog and show success dialog
      setIsDialogOpen(false);
      setIsProcessing(false);
      setShowSuccessDialog(true);

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Transaction failed:", error);
      setIsProcessing(false);
      // In real app, show error dialog here
    }
  };

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
        <IcCreditCardUpload size={16} />
      </button>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent
          className="flex max-h-[min(600px,80vh)] flex-col gap-0 p-0 sm:max-w-md data-[state=open]:!zoom-in-0 data-[state=open]:duration-600"
          onPointerDownOutside={(e) => {
            // Prevent closing if clicking on the button
            if (buttonRef.current && buttonRef.current.contains(e.target as Node)) {
              e.preventDefault();
            }
          }}
          onInteractOutside={(e) => {
            // Prevent closing if interacting with the button
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
                        Maturity Date{" "}
                        <CentuariTooltip message="The date when you can withdraw your funds.">
                          <Info size={16} />
                        </CentuariTooltip>
                      </CentuariTypography>
                      <CentuariTypography variant="h5" className="text-center">
                        {maturityDate}
                      </CentuariTypography>
                    </div>
                    <div>
                      <CentuariTypography
                        className="flex items-center gap-1 text-muted-foreground"
                        variant="b3"
                      >
                        APR{" "}
                        <CentuariTooltip message="Annual Percentage Rate for this position.">
                          <Info size={16} />
                        </CentuariTooltip>
                      </CentuariTypography>
                      <CentuariTypography variant="h5" className="text-center">
                        {apr.toFixed(2).replace(".", ",")}%
                      </CentuariTypography>
                    </div>
                    <div>
                      <CentuariTypography
                        className="flex items-center gap-1 text-muted-foreground"
                        variant="b3"
                      >
                        Available Shares{" "}
                        <CentuariTooltip message="The total amount available for withdrawal including your deposit and profit.">
                          <Info size={16} />
                        </CentuariTooltip>
                      </CentuariTypography>
                      <CentuariTypography variant="h5" className="text-center">
                        {formattedAvailableFunds}
                      </CentuariTypography>
                    </div>
                  </div>
                </div>

                <div className="mt-4 px-6">
                  <form action="">
                    <div className="mb-1.5 flex items-center justify-between">
                      <Label htmlFor={`amount-${reactId}`}>Withdraw Amount</Label>
                      <div className="flex text-xs text-muted-foreground items-center gap-1">
                        Available {formattedAvailableFunds}{" "}
                        <CentuariTooltip message="The maximum amount you can withdraw.">
                          <Info size={12} />
                        </CentuariTooltip>
                      </div>
                    </div>
                    <CentuariInput
                      id={`amount-${reactId}`}
                      size="large"
                      placeholder="Enter amount"
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

                    <div className="bg-white/5 py-3 px-4 text-sm rounded-xl border border-white/5 flex flex-col gap-2 mt-5">
                      <div className="flex items-center justify-between border-b border-dashed pb-2">
                        <p className="text-muted-foreground">Withdraw shares</p>
                        <p>{formatNumberWithSeparator(withdrawShares)} CBT</p>
                      </div>
                      <div className="flex items-center justify-between border-b border-dashed pb-2">
                        <p className="flex text-muted-foreground items-center gap-2">
                          Profit Return{" "}
                          <CentuariTooltip message="The profit earned calculated based on APR and days until maturity.">
                            <Info size={12} />
                          </CentuariTooltip>
                        </p>
                        <p>{formatCurrency(calculatedProfitReturn)}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <p className="flex text-muted-foreground items-center gap-2">
                          You will get after withdraw{" "}
                          <CentuariTooltip message="The total amount you will receive after withdrawal (Withdraw shares + Profit Return).">
                            <Info size={12} />
                          </CentuariTooltip>
                        </p>
                        <span className="text-primary-blue-base font-semibold">
                          {formatCurrency(totalAfterWithdraw)}
                        </span>
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
                onClick={handleSell}
                disabled={
                  isProcessing ||
                  numericAmount <= 0 ||
                  numericAmount > availableFunds
                }
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Withdraw"
                )}
              </CentuariButton>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="flex max-h-[min(600px,80vh)] flex-col gap-0 p-0 sm:max-w-md data-[state=open]:!zoom-in-0 data-[state=open]:duration-600">
          <DialogHeader className="contents space-y-0 text-left">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
              <div className="absolute w-[568px] h-[450px] -top-72 left-0 bg-primary-blue-base/50 blur-[264px] opacity-100 transition-opacity duration-500" />
              <div className="absolute w-[150px] h-[216px] -top-60 left-1/3 bg-white blur-3xl opacity-100 transition-opacity duration-500" />
            </div>
            <div className="mt-6 px-6 flex items-center justify-center flex-col gap-4 pb-6">
              <Image
                src="/assets/tx-success.png"
                alt="Success"
                width={116}
                height={124}
              />
              <CentuariTypography className="text-2xl font-semibold">
                Withdraw Successful!
              </CentuariTypography>
              <CentuariTypography className="text-center text-muted-foreground">
                {successAmount ? (
                  <>
                    You have successfully withdrawn {successAmount} {token_symbol} from
                    your position.
                  </>
                ) : (
                  <>Your {token_symbol} withdraw order has been completed successfully.</>
                )}
              </CentuariTypography>
              <div className="flex items-center gap-2 text-muted-foreground mt-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Closing...</span>
              </div>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
