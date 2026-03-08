"use client";

import { gsap } from "gsap";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CentuariAlert } from "./centuari-alert";
import { CentuariButton } from "./centuari-button";
import { CentuariTypography } from "./centuari-typography";
import { Button } from "./ui/button";
import { IcCreditCardUploadCentuari } from "./icons/ic-credit-card-upload-centuari";
import { TransactionSuccessDialog } from "./transaction-success-dialog";
import { cn } from "@/lib/utils";
import { getChainIcon } from "@/lib/chains";
import { useMyAssets } from "@/hooks/use-my-assets";
import { useWithdraw } from "@/hooks/use-withdraw";
import type { MyAssetItem } from "@/lib/api";

const ARBITRUM_ICON = getChainIcon("arbitrum");

type Step = "select-token" | "enter-amount";

export function CentuariWithdrawDialog() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("select-token");
  const [selectedAsset, setSelectedAsset] = useState<MyAssetItem | null>(null);
  const selectTokenViewRef = useRef<HTMLDivElement>(null);
  const enterAmountViewRef = useRef<HTMLDivElement>(null);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const { assets, isLoading: assetsLoading } = useMyAssets();
  const {
    withdraw,
    status: withdrawStatus,
    error: withdrawError,
    txHash,
    reset: resetWithdraw,
  } = useWithdraw();

  const isProcessing =
    withdrawStatus === "withdrawing" || withdrawStatus === "confirming";

  // Filter to assets with positive non-collateral balance
  const withdrawableAssets = assets.filter(
    (a) => a.walletBalance > 0 && !a.isCollateral,
  );

  const amountNum = Number(withdrawAmount) || 0;
  const exceedsBalance =
    selectedAsset != null && amountNum > selectedAsset.walletBalance;
  const tokenPrice =
    selectedAsset && selectedAsset.walletBalance > 0
      ? selectedAsset.amountInUsd / selectedAsset.walletBalance
      : 0;

  const handleTokenSelect = (asset: MyAssetItem) => {
    setSelectedAsset(asset);
    setStep("enter-amount");
  };

  const handleBackToSelectToken = () => {
    setStep("select-token");
    setWithdrawAmount("");
    resetWithdraw();
  };

  const handleDialogChange = (open: boolean) => {
    // Prevent closing during processing
    if (!open && isProcessing) return;

    setDialogOpen(open);
    if (!open && withdrawStatus !== "success") {
      setStep("select-token");
      setSelectedAsset(null);
      setWithdrawAmount("");
      resetWithdraw();
    }
  };

  // Handle opening success dialog after withdraw dialog closes
  useEffect(() => {
    if (!dialogOpen && withdrawStatus === "success") {
      const timer = setTimeout(() => {
        setShowSuccessDialog(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [dialogOpen, withdrawStatus]);

  // Animate in when step changes
  useEffect(() => {
    const timeline = gsap.timeline();

    if (
      step === "select-token" &&
      selectTokenViewRef.current &&
      enterAmountViewRef.current
    ) {
      timeline
        .to(enterAmountViewRef.current, {
          x: 100,
          opacity: 0,
          duration: 0.3,
          ease: "power2.in",
        })
        .fromTo(
          selectTokenViewRef.current,
          { x: -100, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.3, ease: "power2.out" },
          "-=0.15"
        );
    } else if (
      step === "enter-amount" &&
      selectTokenViewRef.current &&
      enterAmountViewRef.current
    ) {
      timeline
        .to(selectTokenViewRef.current, {
          x: -100,
          opacity: 0,
          duration: 0.3,
          ease: "power2.in",
        })
        .fromTo(
          enterAmountViewRef.current,
          { x: 100, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.3, ease: "power2.out" },
          "-=0.15"
        );
    }
  }, [step]);

  const handleWithdraw = async () => {
    if (isProcessing || !withdrawAmount || !selectedAsset) return;
    await withdraw(selectedAsset.assetId, withdrawAmount);
  };

  // Close dialog on successful withdrawal (triggers success dialog via effect)
  useEffect(() => {
    if (withdrawStatus === "success") {
      setDialogOpen(false);
    }
  }, [withdrawStatus]);

  const handleQuickFill = (pct: number) => {
    if (!selectedAsset) return;
    const val = selectedAsset.walletBalance * pct;
    // Use full precision for max, reasonable precision otherwise
    setWithdrawAmount(
      pct === 1 ? val.toString() : val.toFixed(6).replace(/\.?0+$/, ""),
    );
  };

  return (
    <>
    <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="flex-1" size={"lg"}>
          Withdraw <IcCreditCardUploadCentuari />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="flex max-h-[min(600px,80vh)] flex-col gap-0 p-0 sm:max-w-md data-[state=open]:!zoom-in-0 data-[state=open]:duration-600"
        onInteractOutside={(e) => { if (isProcessing) e.preventDefault(); }}
        onEscapeKeyDown={(e) => { if (isProcessing) e.preventDefault(); }}
      >
        <DialogHeader className="contents space-y-0 text-left">
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
            <div className="absolute w-[568px] h-[450px] -top-72 left-0 bg-primary-blue-base/50 blur-[264px] opacity-100 transition-opacity duration-500" />
            <div className="absolute w-[150px] h-[216px] -top-60 left-1/3 bg-white blur-3xl opacity-100 transition-opacity duration-500" />
          </div>
          <ScrollArea className="flex max-h-full flex-col overflow-hidden pb-2">
            <div className="relative overflow-hidden min-h-[400px]">
              {/* Step 1: Select Token */}
              <div
                ref={selectTokenViewRef}
                className={
                  step === "select-token"
                    ? "relative"
                    : "absolute inset-0 pointer-events-none"
                }
                style={{ opacity: step === "select-token" ? 1 : 0 }}
              >
                <div className="flex flex-col items-center justify-center gap-2 mt-6 px-6">
                  <Image
                    src={"/centuari-logo.png"}
                    width={48}
                    height={48}
                    alt="centuari-logo"
                    className="mb-8"
                  />
                  <CentuariTypography variant="h1">
                    Choose asset to withdraw
                  </CentuariTypography>
                  <CentuariTypography
                    variant="b3"
                    className="text-muted-foreground text-center w-2/3"
                  >
                    Select a token and enter the amount you want to withdraw.
                  </CentuariTypography>
                </div>

                <div className="mt-8 px-6">
                  <div className="flex items-center gap-2 mb-3">
                    <img
                      src={ARBITRUM_ICON}
                      alt="Arbitrum Sepolia"
                      width={20}
                      height={20}
                      className="size-5 rounded-full object-cover"
                    />
                    <CentuariTypography variant="b2" className="text-muted-foreground">
                      Arbitrum Sepolia
                    </CentuariTypography>
                  </div>
                  <CentuariTypography
                    variant="s3"
                    className="text-muted-foreground mb-3"
                  >
                    Available Assets
                  </CentuariTypography>

                  {assetsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : withdrawableAssets.length === 0 ? (
                    <div className="text-center py-8">
                      <CentuariTypography variant="b3" className="text-muted-foreground">
                        No withdrawable assets found
                      </CentuariTypography>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-white/5 bg-white/5">
                      {withdrawableAssets.map((asset, index) => (
                        <button
                          key={asset.assetId}
                          onClick={() => handleTokenSelect(asset)}
                          className={cn(
                            "w-full flex items-center justify-between hover:bg-white/5 transition-all duration-200 group px-2 py-1",
                            index === withdrawableAssets.length - 1 &&
                            "rounded-b-xl",
                            index === 0 && "rounded-t-xl"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 flex items-center justify-center">
                                {asset.imageUrl ? (
                                  <Image
                                    src={asset.imageUrl}
                                    alt={asset.name}
                                    width={24}
                                    height={24}
                                  />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-white/10" />
                                )}
                              </div>
                              <CentuariTypography variant="b2">
                                {asset.symbol}
                              </CentuariTypography>
                              <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                              <CentuariTypography
                                variant="b2"
                                className="text-muted-foreground"
                              >
                                {asset.walletBalance.toLocaleString("en-US", {
                                  maximumFractionDigits: 6,
                                })}
                              </CentuariTypography>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <ArrowRight size={18} />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Enter Amount */}
              <div
                ref={enterAmountViewRef}
                className={
                  step === "enter-amount"
                    ? "relative"
                    : "absolute inset-0 pointer-events-none"
                }
                style={{ opacity: step === "enter-amount" ? 1 : 0 }}
              >
                <div className="mt-6 px-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToSelectToken}
                    className="mb-4 -ml-2"
                    type="button"
                    disabled={isProcessing}
                  >
                    <ArrowLeft size={16} />
                  </Button>

                  <div className="flex flex-col items-center justify-center gap-2">
                    {selectedAsset && (
                      <>
                        <CentuariTypography variant="h1">
                          Enter the amount you
                        </CentuariTypography>
                        <CentuariTypography variant="h1">
                          want to withdraw
                        </CentuariTypography>

                        <div className="flex items-center gap-2 mt-2 bg-white/5 px-3 py-1.5 rounded-full border">
                          {selectedAsset.imageUrl ? (
                            <Image
                              src={selectedAsset.imageUrl}
                              alt={selectedAsset.symbol}
                              width={20}
                              height={20}
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-white/10" />
                          )}
                          <CentuariTypography variant="b2">
                            {selectedAsset.symbol}
                          </CentuariTypography>
                          <div className="w-1 h-1 bg-white/10 rounded-full"></div>
                          <CentuariTypography
                            variant="b3"
                            className="text-muted-foreground"
                          >
                            {selectedAsset.walletBalance.toLocaleString("en-US", {
                              maximumFractionDigits: 6,
                            })}
                          </CentuariTypography>
                          <div className="w-1 h-1 bg-white/10 rounded-full"></div>
                          <img
                            src={ARBITRUM_ICON}
                            alt="Arbitrum Sepolia"
                            width={16}
                            height={16}
                            className="size-4 rounded-full object-cover"
                          />
                          <CentuariTypography
                            variant="b3"
                            className="text-muted-foreground"
                          >
                            Arbitrum Sepolia
                          </CentuariTypography>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="mt-8">
                    <div className="relative mb-8">
                      <label htmlFor="withdraw-amount" className="sr-only">
                        Withdraw Amount
                      </label>
                      <input
                        id="withdraw-amount"
                        type="text"
                        placeholder="0.00"
                        className="w-full text-center text-4xl font-bold bg-transparent border-white/10 focus:outline-none focus:border-white/20 pb-2"
                        inputMode="decimal"
                        pattern="[0-9]*\.?[0-9]*"
                        value={withdrawAmount}
                        disabled={isProcessing}
                        onChange={(e) => {
                          const rawValue = e.target.value.replace(
                            /[^0-9.]/g,
                            ""
                          );
                          if (rawValue === "" || /^\d*\.?\d*$/.test(rawValue)) {
                            setWithdrawAmount(rawValue);
                          }
                        }}
                      />
                      {withdrawAmount && tokenPrice > 0 && (
                        <p className="text-muted-foreground mt-1 text-center text-sm">
                          ~${(amountNum * tokenPrice).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })} USD
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {[
                        { label: "25%", pct: 0.25 },
                        { label: "50%", pct: 0.5 },
                        { label: "75%", pct: 0.75 },
                        { label: "Max", pct: 1 },
                      ].map(({ label, pct }) => (
                        <button
                          key={label}
                          onClick={() => handleQuickFill(pct)}
                          disabled={isProcessing}
                          className="flex-1 py-2 px-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all duration-200 disabled:opacity-50"
                        >
                          <CentuariTypography variant="b3">
                            {label}
                          </CentuariTypography>
                        </button>
                      ))}
                    </div>

                    {exceedsBalance && (
                      <CentuariAlert
                        variant="destructive"
                        text="Insufficient balance"
                        description={`Available: ${selectedAsset?.walletBalance.toLocaleString("en-US", { maximumFractionDigits: 6 })} ${selectedAsset?.symbol}`}
                        className="mt-4"
                      />
                    )}

                    {withdrawError && (
                      <CentuariAlert
                        variant="destructive"
                        text="Withdrawal failed"
                        description={withdrawError}
                        className="mt-4"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogHeader>
        <DialogFooter className="flex-row items-center justify-end px-6 pb-4">
          {step === "enter-amount" && (
            <CentuariButton
              type="button"
              variant={"primary"}
              className="flex-1"
              onClick={handleWithdraw}
              disabled={
                isProcessing ||
                !withdrawAmount ||
                amountNum <= 0 ||
                exceedsBalance
              }
            >
              {isProcessing ? (
                <>
                  Processing... <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                </>
              ) : (
                "Confirm Withdrawal"
              )}
            </CentuariButton>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <TransactionSuccessDialog
      open={showSuccessDialog}
      onOpenChange={(open) => {
        setShowSuccessDialog(open);
        if (!open) {
          resetWithdraw();
          setWithdrawAmount("");
          setStep("select-token");
          setSelectedAsset(null);
        }
      }}
      title="Withdrawal Complete"
      description={
        txHash
          ? `Your funds have been successfully withdrawn. Transaction: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`
          : "Your funds have been successfully withdrawn and sent to your connected wallet."
      }
      primaryActionLabel="Start Earning"
      onPrimaryAction={() => router.push("/")}
      secondaryActionLabel="Done"
    />
    </>
  );
}
