"use client";

import { useState, useEffect, useId, useRef } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
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
  calculateFutureAmount,
  calculateProfitAmount,
} from "@/lib/utils";
import { normalizeMaturity, formatMaturityTimestamp } from "@/lib/maturity";
import { tokenList } from "@/lib/portfolio-data";
import { useWithdrawLendPosition } from "@/hooks/use-withdraw-lend-position";
import { IcCreditCardUpload } from "./icons/ic-credit-card-upload";
import { TransactionSuccessDialog } from "./transaction-success-dialog";
import { useRouter } from "next/navigation";

/** When provided, the parent shows the success dialog (avoids unmount before dialog shows). */
export type WithdrawSuccessMessage = { title: string; description: string };

interface CentuariSellPositionDialogProps {
  positionId: string;
  token_image: string;
  token_name: string;
  token_symbol: string;
  maturityDate?: number;
  startDate?: number; // Position start as Unix timestamp (ms); when set, profit uses elapsed time
  availableFunds: number; // Available funds in USD (current position value)
  moneyDeposited: number; // Original deposit amount
  profitReturn: number; // Profit amount
  apr?: number; // APR as percentage (e.g., 10 for 10%)
  onSuccess?: () => void; // Callback after successful sell
  /** When set, parent shows success dialog; use when row may unmount (e.g. full withdraw). */
  onWithdrawComplete?: (message: WithdrawSuccessMessage) => void;
}

export function CentuariSellPositionDialog({
  positionId,
  token_image,
  token_name,
  token_symbol,
  maturityDate,
  startDate,
  availableFunds,
  moneyDeposited,
  profitReturn,
  apr = 10, // Default 10% APR
  onSuccess,
  onWithdrawComplete,
}: CentuariSellPositionDialogProps) {
  const reactId = useId();
  const router = useRouter();
  const { getAccessToken } = usePrivy();
  const { withdraw, isPending, isSuccess, resetSuccess } = useWithdrawLendPosition();

  const getTokenValue = () => {
    const token = tokenList.find(
      (t) =>
        t.label.toUpperCase() === token_symbol?.toUpperCase() ||
        t.value.toUpperCase() === token_symbol?.toUpperCase()
    );
    return token?.value ?? "usdc";
  };

  // State for amount input
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [displayAmount, setDisplayAmount] = useState<string>("");

  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const isDialogOpenRef = useRef<boolean>(false);
  const isHoveringRef = useRef<boolean>(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Calculate derived values
  const numericAmount = parseFloat(withdrawAmount) || 0;

  // Withdraw Shares = the input amount
  const withdrawShares = numericAmount > 0 ? numericAmount : 0;

  // Calculate profit: elapsed (startDate → now) when startDate set, else future (now → maturity)
  const normalizedMaturity = normalizeMaturity(maturityDate);
  const calculatedProfitReturn =
    startDate != null
      ? calculateProfitAmount(withdrawShares, apr, startDate)
      : calculateFutureAmount(withdrawShares, apr, normalizedMaturity) - withdrawShares;

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
    if (isPending && !open) {
      return;
    }

    // Prevent closing if button is being hovered (to avoid flickering)
    if (!open && isHoveringRef.current) {
      // Use setTimeout to allow hover state to update
      setTimeout(() => {
        if (!isHoveringRef.current && !isPending) {
          isDialogOpenRef.current = false;
          setIsDialogOpen(false);
          setWithdrawAmount("");
          setDisplayAmount("");
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
    }
  };

  const handleSell = async () => {
    if (numericAmount <= 0) return;
    if (numericAmount > availableFunds) return;

    if (!positionId) {
      toast.error("Position ID is missing. Cannot withdraw.");
      return;
    }

    try {
      await getAccessToken();
      await withdraw(positionId);

      if (onWithdrawComplete) {
        onWithdrawComplete({
          title: "Withdrawal Complete",
          description: "Your lend position have been successfully withdrawn",
        });
      }

      setWithdrawAmount("");
      setDisplayAmount("");
      setIsDialogOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Transaction failed";
      toast.error(message);
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
                        {formatMaturityTimestamp(normalizedMaturity)}
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
                        {apr.toFixed(1).replace(".", ",")}%
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
                  isPending ||
                  numericAmount <= 0 ||
                  numericAmount > availableFunds
                }
              >
                {isPending ? (
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

      {!onWithdrawComplete && (
        <TransactionSuccessDialog
          open={isSuccess}
          onOpenChange={(open) => {
            if (!open) {
              resetSuccess();
              onSuccess?.();
            }
          }}
          title="Withdrawal Complete"
          description="Your lend position have been successfully withdrawn"
          primaryActionLabel="Start Earning"
          onPrimaryAction={() => router.push("/")}
          secondaryActionLabel="Done"
        />
      )}
    </>
  );
}
