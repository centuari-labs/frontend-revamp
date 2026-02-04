"use client";

import { usePrivy } from "@privy-io/react-auth";
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
import { CentuariButton } from "./centuari-button";
import { CentuariTypography } from "./centuari-typography";
import { Button } from "./ui/button";
import { IcCreditCardUploadCentuari } from "./icons/ic-credit-card-upload-centuari";
import { SelectChain } from "./select-chain";
import { TransactionSuccessDialog } from "./transaction-success-dialog";
import { ChainValue, getChainByValue, getChainIcon } from "@/lib/chains";
import { cn } from "@/lib/utils";

type Token = {
  id: string;
  name: string;
  icon: string;
  balance: string;
};

const availableTokens: Token[] = [
  {
    id: "ethereum",
    name: "Ethereum",
    icon: "/tokens/eth-icon.svg",
    balance: "$12,000.00",
  },
  {
    id: "usdc",
    name: "USDC",
    icon: "/tokens/usdc-icon.svg",
    balance: "$12,000.00",
  },
  {
    id: "solana",
    name: "Solana",
    icon: "/tokens/sol-icon.svg",
    balance: "$12,000.00",
  },
  {
    id: "bitcoin",
    name: "Bitcoin",
    icon: "/tokens/btc-icon.svg",
    balance: "$12,000.00",
  },
];

type Step = "select-token" | "enter-amount";

export function CentuariWithdrawDialog() {
  const router = useRouter();
  const [selectedChain, setSelectedChain] = useState<ChainValue>("eth");
  const [step, setStep] = useState<Step>("select-token");
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const selectTokenViewRef = useRef<HTMLDivElement>(null);
  const enterAmountViewRef = useRef<HTMLDivElement>(null);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successData, setSuccessData] = useState<boolean | null>(null);

  const { getAccessToken } = usePrivy();

  const handleTokenSelect = (token: Token) => {
    setSelectedToken(token);
    setStep("enter-amount");
  };

  const handleBackToSelectToken = () => {
    setStep("select-token");
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open && !successData) {
      setSelectedChain("eth");
      setStep("select-token");
      setSelectedToken(null);
      setWithdrawAmount("");
      setIsProcessing(false);
      setShowSuccessDialog(false);
    }
  };

  // Handle opening success dialog after withdraw dialog closes
  useEffect(() => {
    if (!dialogOpen && successData) {
      const timer = setTimeout(() => {
        setShowSuccessDialog(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [dialogOpen, successData]);

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
    if (isProcessing || !withdrawAmount) return;

    setIsProcessing(true);
    try {
      const accessToken = await getAccessToken();
      // TODO: Add actual withdraw API call using accessToken
      // Simulate processing for now
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSuccessData(true);
      setDialogOpen(false);
    } catch {
      // Handle error - user can add toast/alert
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
    <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="flex-1" size={"lg"}>
          Withdraw <IcCreditCardUploadCentuari />
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
                  <SelectChain
                    value={selectedChain}
                    onValueChange={(value) =>
                      setSelectedChain(value as ChainValue)
                    }
                  />
                  <CentuariTypography
                    variant="s3"
                    className="text-muted-foreground mb-3 mt-3.5"
                  >
                    Available Assets
                  </CentuariTypography>
                  <div className="rounded-xl border border-white/5 bg-white/5">
                    {availableTokens.map((token, index) => (
                      <button
                        key={token.id}
                        onClick={() => handleTokenSelect(token)}
                        className={cn(
                          "w-full flex items-center justify-between hover:bg-white/5 transition-all duration-200 group px-2 py-1",
                          index === availableTokens.length - 1 &&
                          "rounded-b-xl",
                          index === 0 && "rounded-t-xl"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 flex items-center justify-center">
                              <Image
                                src={token.icon}
                                alt={token.name}
                                width={24}
                                height={24}
                              />
                            </div>
                            <CentuariTypography variant="b2">
                              {token.name}
                            </CentuariTypography>
                            <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                            <CentuariTypography
                              variant="b2"
                              className="text-muted-foreground"
                            >
                              {token.balance}
                            </CentuariTypography>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <ArrowRight size={18} />
                        </div>
                      </button>
                    ))}
                  </div>
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
                  >
                    <ArrowLeft size={16} />
                  </Button>

                  <div className="flex flex-col items-center justify-center gap-2">
                    {selectedToken && (
                      <>
                        <CentuariTypography variant="h1">
                          Enter the amount you
                        </CentuariTypography>
                        <CentuariTypography variant="h1">
                          want to withdraw
                        </CentuariTypography>

                        <div className="flex items-center gap-2 mt-2 bg-white/5 px-3 py-1.5 rounded-full border">
                          <Image
                            src={selectedToken.icon}
                            alt={selectedToken.name}
                            width={20}
                            height={20}
                          />
                          <CentuariTypography variant="b2">
                            {selectedToken.name}
                          </CentuariTypography>
                          <div className="w-1 h-1 bg-white/10 rounded-full"></div>
                          <CentuariTypography
                            variant="b3"
                            className="text-muted-foreground"
                          >
                            {selectedToken.balance}
                          </CentuariTypography>
                          <div className="w-1 h-1 bg-white/10 rounded-full"></div>
                          <img
                            src={getChainIcon(selectedChain)}
                            alt=""
                            width={16}
                            height={16}
                            className="size-4 rounded-full object-cover"
                          />
                          <CentuariTypography
                            variant="b3"
                            className="text-muted-foreground"
                          >
                            {getChainByValue(selectedChain)?.label ?? selectedChain}
                          </CentuariTypography>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="mt-8">
                    <div className="relative mb-8">
                      <p className="text-muted-foreground mb-2 text-center text-sm">
                        Min. to withdraw: $10.00
                      </p>
                      <label htmlFor="withdraw-amount" className="sr-only">
                        Withdraw Amount
                      </label>
                      <input
                        id="withdraw-amount"
                        type="text"
                        placeholder="$10.00"
                        className="w-full text-center text-4xl font-bold bg-transparent border-white/10 focus:outline-none focus:border-white/20 pb-2"
                        inputMode="decimal"
                        pattern="[0-9]*\.?[0-9]*"
                        value={
                          withdrawAmount
                            ? `$${parseFloat(withdrawAmount).toLocaleString(
                              "en-US",
                              {
                                minimumFractionDigits:
                                  withdrawAmount.includes(".")
                                    ? withdrawAmount.split(".")[1].length
                                    : 0,
                                maximumFractionDigits: 20, // Allow many decimal places for input, then truncate later if needed
                              }
                            )}`
                            : ""
                        }
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
                    </div>

                    <div className="flex gap-2">
                      {["$100.00", "$500.00", "$1,000", "$5,000"].map(
                        (amount) => (
                          <button
                            key={amount}
                            className="flex-1 py-2 px-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all duration-200"
                          >
                            <CentuariTypography variant="b3">
                              {amount}
                            </CentuariTypography>
                          </button>
                        )
                      )}
                    </div>
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
              disabled={isProcessing || !withdrawAmount}
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
          setSuccessData(null);
          setWithdrawAmount("");
          setSelectedChain("eth");
          setStep("select-token");
          setSelectedToken(null);
        }
      }}
      title="Withdrawal Complete"
      description="Your funds have been successfully withdrawn and sent to your connected wallet."
      primaryActionLabel="Start Earning"
      onPrimaryAction={() => router.push("/")}
      secondaryActionLabel="Done"
    />
    </>
  );
}
