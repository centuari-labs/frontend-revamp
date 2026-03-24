"use client";

import { useState, useId, useRef } from "react";
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
  getHealthFactorPercentage,
  handleNumberInputChange,
  getHealthFactorDisplayStatus,
} from "@/lib/utils";
import { useUserDetailsContext } from "@/contexts/user-details-context";
import { useRepay } from "@/hooks/use-repay";
import HealthFactor from "./centuari-health-factor";
import { TransactionSuccessDialog } from "./transaction-success-dialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface CentuariRepayDialogProps {
  marketId: string;
  token_image: string;
  token_name: string;
  token_symbol: string;
  apr: number; // APR as number (e.g., 4.9 for 4.9%)
  maturityDate?: number;
  shares?: number; // Debt from position shares
  baseAmount?: number; // Original borrowed amount
  onSuccess?: () => void; // Callback after successful repay
}

export function CentuariRepayDialog({
  marketId,
  token_image,
  token_name,
  token_symbol,
  apr,
  maturityDate,
  shares,
  baseAmount,
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

  // Get user details for available balance and health factor
  const { userDetails } = useUserDetailsContext();

  const tokenValue = token_symbol.toLowerCase();
  const userAsset = userDetails?.assets.find(a => a.symbol.toLowerCase() === tokenValue);
  const availableBalance = userAsset?.availableBalance ?? 0;

  // Look up debt amount from user details (already in token units)
  const userDebt = userDetails?.debts.find(d => {
    const debtAsset = userDetails?.assets.find(a => a.assetId === d.assetId);
    return debtAsset?.symbol.toLowerCase() === tokenValue;
  });
  const debtAmount = userDebt?.debtAmount ?? 0;

  // Derive token price for health factor calculation
  const tokenPrice = userAsset && userAsset.availableBalance > 0 && userAsset.availableBalanceUsd > 0
    ? userAsset.availableBalanceUsd / userAsset.availableBalance
    : 0;

  // Health factor from backend
  const currentHealthFactor = userDetails?.healthFactor ?? 0;
  const totalDebtUsd = userDetails?.totalDebtUsd ?? 0;
  const collateralUsd = userDetails?.collateralUsd ?? 0;
  const weightedLtv = userDetails?.weightedLtv ?? 0;

  // Calculate derived values
  const numericAmount = parseFloat(repayAmount) || 0;

  // Total debt from shares (includes accrued interest)
  const debt = shares ?? debtAmount;

  // Proportional principal/interest breakdown (clamped to prevent baseAmount > debt after partial repays)
  const ratio = debt > 0 && baseAmount != null
    ? Math.min(baseAmount / debt, 1)
    : 1;
  const principal = numericAmount * ratio;
  const interest = numericAmount - principal;

  // Calculate new health factor after repayment
  const repayAmountUsd = numericAmount * tokenPrice;
  const newTotalDebtUsd = Math.max(0, totalDebtUsd - repayAmountUsd);

  const isFullRepayment = numericAmount >= debt && debt > 0;
  const newHealthFactor = isFullRepayment
    ? Infinity
    : newTotalDebtUsd > 0 && collateralUsd > 0 && weightedLtv > 0
      ? ((collateralUsd - totalDebtUsd) * weightedLtv) / newTotalDebtUsd
      : collateralUsd > 0 ? Infinity : 0;

  const currentHealthFactorPercentage =
    currentHealthFactor <= 0 || isNaN(currentHealthFactor)
      ? 0
      : getHealthFactorPercentage(currentHealthFactor);
  const newHealthFactorPercentage =
    newHealthFactor <= 0 || isNaN(newHealthFactor)
      ? 0
      : getHealthFactorPercentage(newHealthFactor);

  // Format APR with comma as decimal separator
  const formattedAPR = apr.toFixed(1).replace(".", ",") + "%";

  // Format debt from shares
  const formattedDebt = shares != null ? formatNumberWithSeparator(shares.toFixed(3)) : formatNumberWithSeparator(debtAmount.toFixed(3));

  // Format original borrowed amount
  const formattedAmountBorrowed = baseAmount != null ? formatNumberWithSeparator(baseAmount.toFixed(3)) : formatNumberWithSeparator(debtAmount.toFixed(3));

  // Format available balance in token units
  const formattedAvailableBalance = formatNumberWithSeparator(availableBalance.toFixed(3));

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanValue = e.target.value;
    handleNumberInputChange(cleanValue, (display, numeric) => {
      setDisplayAmount(display);
      setRepayAmount(numeric);
    });
  };

  // Handle Max button - set amount to minimum of available balance or total debt (both in token units)
  const handleMaxClick = () => {
    const maxAmount = Math.min(availableBalance, debt).toString();
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
    }
  };

  const handleRepay = async () => {
    if (numericAmount <= 0) return;

    if (numericAmount > availableBalance) return;
    if (numericAmount > debt) return;

    try {
      await getAccessToken();

      await repay({
        marketId,
        amount: numericAmount,
        futureAmount: numericAmount,
        tokenValue,
      });

      setSuccessAmount(formatNumberWithSeparator(numericAmount.toFixed(3)));
      setRepayAmount("");
      setDisplayAmount("");
      setIsDialogOpen(false);
      setShowSuccessDialog(true);
      onSuccess?.();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Repay failed. Please try again.";
      toast.error(message);
    }
  };

  const healthFactorChange = newHealthFactor - currentHealthFactor;
  const healthFactorChangeText = isFullRepayment
    ? "Debt Free"
    : healthFactorChange > 0
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
                        Debt{" "}
                        <CentuariTooltip message="The total debt including accrued interest, calculated from your position shares.">
                          <Info size={16} />
                        </CentuariTooltip>
                      </CentuariTypography>
                      <CentuariTypography variant="h5" className="text-center">
                        {formattedDebt} {token_symbol}
                      </CentuariTypography>
                    </div>
                    <div>
                      <CentuariTypography
                        className="flex items-center gap-1 text-muted-foreground"
                        variant="b3"
                      >
                        Amount borrowed{" "}
                        <CentuariTooltip message="The original amount you borrowed.">
                          <Info size={16} />
                        </CentuariTooltip>
                      </CentuariTypography>
                      <CentuariTypography variant="h5" className="text-center">
                        {formattedAmountBorrowed} {token_symbol}
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

                    {/* Repay Amount Breakdown */}
                    {numericAmount > 0 && (
                      <div className="bg-white/5 py-3 px-4 text-sm rounded-xl border border-white/5 flex flex-col gap-2 mt-5">
                        <div className="flex items-center justify-between">
                          <p className="flex text-muted-foreground items-center gap-2">
                            Amount to repay{" "}
                            <CentuariTooltip message="The total amount that will be deducted from your available balance.">
                              <Info size={12} />
                            </CentuariTooltip>
                          </p>
                          <span className="text-transparent font-semibold bg-clip-text bg-gradient-to-r from-primary-blue-base via-white to-primary-blue-base">
                            {formatNumberWithSeparator(numericAmount.toFixed(3))} {token_symbol}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-t border-dashed pt-2 mt-1">
                          <p className="text-muted-foreground text-xs">
                            Principal
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {formatNumberWithSeparator(principal.toFixed(3))} {token_symbol}
                          </p>
                        </div>
                        <div className="flex items-center justify-between border-t border-dashed pt-2 mt-1">
                          <p className="text-muted-foreground text-xs">
                            Interest
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {formatNumberWithSeparator(interest.toFixed(3))} {token_symbol}
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
                            (numericAmount > 0 ? newHealthFactor : currentHealthFactor) <= 0 ||
                            isNaN(numericAmount > 0 ? newHealthFactor : currentHealthFactor)
                              ? "default"
                              : getHealthFactorDisplayStatus(
                                  numericAmount > 0 ? newHealthFactor : currentHealthFactor,
                                ).variant
                          }
                        >
                          {numericAmount > 0
                            ? isFullRepayment
                              ? "Debt Free"
                              : `${healthFactorChangeText} - ${getHealthFactorDisplayStatus(newHealthFactor).status}`
                            : `${currentHealthFactor.toFixed(2)} - ${getHealthFactorDisplayStatus(currentHealthFactor).status}`}
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
                  numericAmount > availableBalance ||
                  numericAmount > debt
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
