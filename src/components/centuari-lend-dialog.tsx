"use client";

import { gsap } from "gsap";
import { ArrowLeft, Info } from "lucide-react";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CentuariAlert } from "./centuari-alert";
import { CentuariButton } from "./centuari-button";
import { CentuariInput } from "./centuari-input";
import { CentuariTooltip } from "./centuari-tooltip";
import { CentuariTypography } from "./centuari-typography";
import { IcDollarCentuari } from "./icons/ic-dollar-centuari";
import { Button } from "./ui/button";
import { SelectToken } from "./select-token";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TransactionSuccessDialog } from "./transaction-success-dialog";
import { formatNumberWithSeparator, parseNumberFromSeparator, formatCurrency, calculateFutureAmount } from "@/lib/utils";
import { getDefaultMaturityTimestamp, formatMaturityTimestamp } from "@/lib/maturity";
import { Loader2 } from "lucide-react";
import { useSubmitLend } from "@/hooks/use-submit-lend";
import { useLendDialogData } from "@/hooks/use-lend-dialog-data";
import { useMarketData } from "@/hooks/use-market-data";
import { useAuthToken } from "@/hooks/use-auth-token";
import { useQueryClient } from "@tanstack/react-query";

type ViewMode = "lend" | "deposit-lend";

interface CentuariLendDialogProps {
  token_image: string;
  token_name: string;
  token_symbol: string;
  lendAPR: string; // Format: "6,5%"
  borrowAPR: string;
  collateralFactor: string;
  vaultTotal: number;
}

export function CentuariLendDialog({
  token_image,
  token_name,
  token_symbol,
  lendAPR,
  borrowAPR,
  collateralFactor,
  vaultTotal,
}: CentuariLendDialogProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("lend");
  const lendViewRef = useRef<HTMLDivElement>(null);
  const collateralViewRef = useRef<HTMLDivElement>(null);

  const reactId = useId();
  const router = useRouter();
  const { submitMarket, isPending } = useSubmitLend();
  const { getToken } = useAuthToken();
  const { markets } = useMarketData();
  const queryClient = useQueryClient();

  // Bridge hook: reads localStorage in mock mode, API in real mode
  const {
    availableBalance,
    tokenPrice,
    isLoading: dataLoading,
  } = useLendDialogData(token_symbol);

  // State for amount input
  const [amountToLend, setAmountToLend] = useState<string>("");
  const [displayAmount, setDisplayAmount] = useState<string>("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const tokenValue = token_symbol.toLowerCase();

  // State for success dialog
  const [showSuccessDialog, setShowSuccessDialog] = useState<boolean>(false);
  const [successAmount, setSuccessAmount] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  // Parse Lend APR from format "6,5%" to number (6.5)
  const parseLendAPR = (aprString: string): number => {
    // Remove % and replace comma with dot
    const cleaned = aprString.replace("%", "").replace(",", ".");
    return parseFloat(cleaned) || 0;
  };

  const lendAPRNumeric = parseLendAPR(lendAPR);

  // Calculate derived values
  const numericAmount = parseFloat(amountToLend) || 0;
  const transactionFee = Math.min(numericAmount * 0.0001, 0.05); // 0.01% capped at $0.05
  const amountToPay = numericAmount + transactionFee;

  // Format vault total with currency
  const formattedVaultTotal = formatCurrency(vaultTotal);

  // Maturity date - withdrawal unlocks on the same date
  const maturityDate = getDefaultMaturityTimestamp();

  const futureAmount = calculateFutureAmount(numericAmount, lendAPRNumeric, maturityDate);

  // Handle amount input change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = parseNumberFromSeparator(value);
    const formattedValue = formatNumberWithSeparator(numericValue);

    setAmountToLend(numericValue);
    setDisplayAmount(formattedValue);
  };

  const handleAddCollateralClick = () => {
    setViewMode("deposit-lend");
  };

  const handleBackToLend = () => {
    setViewMode("lend");
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setViewMode("lend");
      setAmountToLend("");
      setDisplayAmount("");
      setShowSuccessDialog(false);
      setSubmitError(null);
    }
  };

  // Handle Max button - set amount to available balance
  const handleMaxClick = () => {
    const maxAmount = availableBalance.toString();
    const formattedMax = formatNumberWithSeparator(maxAmount);
    setAmountToLend(maxAmount);
    setDisplayAmount(formattedMax);
  };

  // Animate in when view changes
  useEffect(() => {
    const timeline = gsap.timeline();

    if (
      viewMode === "lend" &&
      lendViewRef.current &&
      collateralViewRef.current
    ) {
      timeline
        .to(collateralViewRef.current, {
          x: 100,
          opacity: 0,
          duration: 0.3,
          ease: "power2.in",
        })
        .fromTo(
          lendViewRef.current,
          { x: -100, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.3, ease: "power2.out" },
          "-=0.15"
        );
    } else if (
      viewMode === "deposit-lend" &&
      lendViewRef.current &&
      collateralViewRef.current
    ) {
      timeline
        .to(collateralViewRef.current, {
          x: -100,
          opacity: 0,
          duration: 0.3,
          ease: "power2.in",
        })
        .fromTo(
          collateralViewRef.current,
          { x: 100, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.3, ease: "power2.out" },
          "-=0.15"
        );
    }
  }, [viewMode]);

  const handleLend = async () => {
    if (viewMode === "lend") {
      if (numericAmount <= 0 || numericAmount > availableBalance) return;
      if (tokenPrice <= 0) return;

      setSubmitError(null);

      try {
        const authToken = await getToken();
        const amountInUsd = numericAmount * tokenPrice;

        await submitMarket(
          {
            tokenValue,
            tokenLogo: token_image,
            tokenLabel: token_name,
            amount: numericAmount,
            amountInUsd,
            maturity: maturityDate,
            autoRollover: true,
          },
          authToken && markets.length > 0
            ? { token: authToken, markets }
            : undefined,
        );

        // Invalidate portfolio-related queries so balances refresh
        queryClient.invalidateQueries({ queryKey: ["my-assets"] });
        queryClient.invalidateQueries({ queryKey: ["my-portfolio"] });
        queryClient.invalidateQueries({ queryKey: ["lend-borrow-assets"] });

        setSuccessAmount(formatNumberWithSeparator(numericAmount));
        setAmountToLend("");
        setDisplayAmount("");
        setIsDialogOpen(false);
        setShowSuccessDialog(true);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Transaction failed. Please try again.";
        setSubmitError(message);
      }
    } else if (viewMode === "deposit-lend") {
      // Deposit logic placeholder - not yet implemented
    }
  };

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogTrigger asChild>
          <Button variant="primary-dark" className="flex-1">
            Start Earning
          </Button>
        </DialogTrigger>
        <DialogContent className="flex max-h-[min(600px,80vh)] flex-col gap-0 p-0 sm:max-w-md data-[state=open]:!zoom-in-0 data-[state=open]:duration-600">
          <DialogHeader className="contents space-y-0 text-left">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
              <div className="absolute w-[568px] h-[450px] -top-72 left-0 bg-primary-blue-base/50 blur-[264px] opacity-100 transition-opacity duration-500" />
              <div className="absolute w-[150px] h-[216px] -top-60 left-1/3 bg-white blur-3xl opacity-100 transition-opacity duration-500" />
            </div>
            <ScrollArea className="flex max-h-full flex-col overflow-hidden pb-2">
              <div className="relative overflow-hidden">
                <div
                  ref={lendViewRef}
                  className={
                    viewMode === "lend"
                      ? "relative"
                      : "absolute inset-0 pointer-events-none"
                  }
                  style={{ opacity: viewMode === "lend" ? 1 : 0 }}
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
                          Vault Total{" "}
                          <CentuariTooltip message={`The total amount of ${token_symbol} in the vault.`}>
                            <Info size={16} />
                          </CentuariTooltip>
                        </CentuariTypography>
                        <CentuariTypography variant="h5" className="text-center">
                          {formattedVaultTotal}
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
                  <div className="text-sm mt-3 text-primary-blue-20 bg-primary-blue-base/10 border border-primary-blue-base/10 py-2 text-center mx-6 self-stretch rounded-md">
                    Go to{" "}
                    <Link href="/market" className="font-medium !underline">
                      Market View
                    </Link>{" "}
                    to select other maturities.
                  </div>
                  <div className="mt-4 px-6">
                    <CentuariInput
                      id={`amount-${reactId}`}
                      label="Amount to Lend"
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
                          variant={"link"}
                          className="px-0"
                          type="button"
                          onClick={handleMaxClick}
                        >
                          Max
                        </Button>
                      }
                      balanceText={dataLoading ? "Loading..." : `${token_symbol} ${formatNumberWithSeparator(availableBalance)}`}
                      value={displayAmount}
                      onChange={handleAmountChange}
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
                            onClick={handleAddCollateralClick}
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

                    {/* <CentuariAlert
                    variant="destructive"
                    text="Insufficient balance"
                    description="Deposit now to continue your order"
                    className="mt-1.5"
                    action={
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleAddCollateralClick}
                        type="button"
                      >
                        Deposit
                      </Button>
                    }
                  /> */}

                    {/* <div>
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

                    {/* <div>
										<Label className="mb-2 mt-4">
											Health Factor{" "}
											<CentuariTooltip message="Your health factor indicates the safety of your borrowed position.">
												<Info size={16} />
											</CentuariTooltip>
											<Badge variant={"success"}>0.0 ~ Safe</Badge>
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
									</div> */}

                    <div className="bg-white/5 py-3 px-4 text-sm rounded-xl rounded-b-none border border-white/5 flex flex-col gap-2 mt-5">
                      <div className="flex items-center justify-between border-b border-dashed pb-2">
                        <p className="flex text-muted-foreground items-center gap-2">
                          Transaction Fee{" "}
                          <CentuariTooltip message="Coming Soon">
                            <Info size={12} />
                          </CentuariTooltip>
                        </p>
                        <div className="flex items-center gap-1">
                          <p>{numericAmount > 0 ? formatCurrency(transactionFee) : "$0.00"}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="flex text-muted-foreground items-center gap-2">
                          Amount to Pay Now
                          <CentuariTooltip message="Coming Soon">
                            <Info size={12} />
                          </CentuariTooltip>
                        </p>
                        <div className="flex items-center gap-1">
                          <p>{numericAmount > 0 ? formatCurrency(amountToPay) : "$0.00"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="py-3 px-4 text-sm border border-white/5 rounded-b-lg border-t-0 text-muted-foreground bg-white/5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          In the future you'll get{" "}
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
                  </div>
                </div>

                {/* Funds Payment */}
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
                  onClick={handleBackToLend}
                  className="mb-4 -ml-2"
                  type="button"
                >
                  <ArrowLeft size={16} />
                </Button>
                <CentuariTypography variant="h1" className="mb-1">
                  Add funds to your Centuari wallet
                </CentuariTypography>
                <div className="grid grid-cols-3 gap-1.5 mt-6">
                  {[
                    { desc: "Pay with Card", icon: <CreditCard /> },
                    { desc: "Add from Wallet", icon: <CreditCard /> },
                    { desc: "Receive Funds", icon: <CreditCard /> },
                  ].map(({ desc, icon }) => (
                    <div
                      key={desc}
                      className="rounded-xl relative text-white text-sm hover:shadow-white/10 transition duration-200 border h-[106px] flex items-center justify-center flex-col bg-white/5 border-white/5 hover:bg-white/10 p-4 cursor-pointer"
                    >
                      <div className="bg-white/5 border h-12 w-12 flex items-center justify-center border-white/5 rounded-lg relative">
                        <div className="absolute inset-x-0 h-px w-1/2 mx-auto -top-px shadow-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        {icon}
                      </div>
                      <CentuariTypography className="text-xs mt-2 font-semibold">
                        {desc}
                      </CentuariTypography>
                    </div>
                  ))}
                </div>
              </div> */}
                {/* Deposit */}
                <div
                  ref={collateralViewRef}
                  className={
                    viewMode === "deposit-lend"
                      ? "relative mt-6 px-6"
                      : "absolute inset-0 pointer-events-none mt-6 px-6"
                  }
                  style={{ opacity: viewMode === "deposit-lend" ? 1 : 0 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToLend}
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
          <DialogFooter className="flex !flex-col gap-2 px-6">
            <div className="flex items-center gap-4">
              <DialogClose asChild>
                <CentuariButton variant="secondary">Cancel</CentuariButton>
              </DialogClose>
              <CentuariButton
                type="button"
                variant={"primary"}
                className="flex-1"
                onClick={handleLend}
                disabled={
                  isPending ||
                  dataLoading ||
                  (viewMode === "lend" &&
                    (numericAmount <= 0 || numericAmount > availableBalance))
                }
              >
                {isPending || dataLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {dataLoading ? "Loading..." : "Processing..."}
                  </>
                ) : viewMode === "lend" ? (
                  "Confirm Lend"
                ) : viewMode === "deposit-lend" ? (
                  "Confirm Deposit"
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
        title="Lend Complete"
        description={successAmount ? `You have successfully lent ${successAmount} ${token_symbol} to the vault.` : `Your ${token_symbol} lend has been completed successfully.`}
        primaryActionLabel="Start Earning"
        onPrimaryAction={() => router.push("/")}
        secondaryActionLabel="Done"
      />
    </>
  );
}
