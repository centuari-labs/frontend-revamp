"use client";

import { useState, useRef, useEffect } from "react";
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
import { Info, ArrowLeft, Plus, Loader2 } from "lucide-react";
import Image from "next/image";
import { CentuariTypography } from "./centuari-typography";
import { CentuariTooltip } from "./centuari-tooltip";
import { CentuariInput } from "./centuari-input";
import { IcDollarCentuari } from "./icons/ic-dollar-centuari";
import { MaturityToggle } from "./maturity-toggle";
import { Label } from "./ui/label";
import { SelectSingleToken } from "./select-single-token";
import HealthFactor from "./centuari-health-factor";
import { Badge } from "./ui/badge";
import { CentuariAlert } from "./centuari-alert";
import { SelectToken } from "./select-token";
import { SelectChain } from "./select-chain";
import { CentuariDepositSuccessDialog } from "./centuari-deposit-success-dialog";
import {
  formatNumberWithSeparator,
  parseNumberFromSeparator,
} from "@/lib/utils";
import { TokenValue, getTokenIcon } from "@/lib/tokens";
import { ChainValue } from "@/lib/chains";

export function CentuariDepositDialog() {
  const [selectedChain, setSelectedChain] = useState<ChainValue>("eth");
  const [selectedToken, setSelectedToken] = useState<TokenValue>("usdt");
  const [depositAmount, setDepositAmount] = useState<string>(""); // Stored as numeric value (without separator)
  const [displayAmount, setDisplayAmount] = useState<string>(""); // Display value (with separator)
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [successData, setSuccessData] = useState<{
    token: TokenValue;
    amount: string;
    chain?: ChainValue;
  } | null>(null);

  // Handle opening success dialog after deposit dialog closes
  useEffect(() => {
    if (!dialogOpen && successData) {
      // Wait for deposit dialog to close completely, then open success dialog
      const timer = setTimeout(() => {
        setShowSuccessDialog(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [dialogOpen, successData]);

  // Reset form when dialog closes
  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open && !successData) {
      // Normal close - reset everything (only if not a successful deposit)
      setDepositAmount("");
      setDisplayAmount("");
      setSelectedChain("eth");
      setSelectedToken("usdt");
      setIsProcessing(false);
      setShowSuccessDialog(false);
    }
  };

  // Handle amount input change with separator formatting
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Parse to get clean numeric value
    const numericValue = parseNumberFromSeparator(inputValue);
    
    // Format for display
    const formattedValue = formatNumberWithSeparator(numericValue);
    
    // Update both states
    setDepositAmount(numericValue);
    setDisplayAmount(formattedValue);
  };

  // Simulate deposit function
  const handleDeposit = async () => {
    if (!depositAmount || isProcessing) return;

    setIsProcessing(true);

    // Simulate deposit delay (1-2 seconds)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Store success data before closing deposit dialog
    const success = {
      token: selectedToken,
      amount: displayAmount || depositAmount,
      chain: selectedChain,
    };
    
    setSuccessData(success);
    setIsProcessing(false);
    setDialogOpen(false); // Close deposit dialog, useEffect will handle opening success dialog
  };

  const TokenIcon = () => (
    <Image
      src={getTokenIcon(selectedToken)}
      width={16}
      height={16}
      alt={selectedToken.toUpperCase()}
    />
  );

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
        <DialogTrigger asChild>
          <Button variant="primary" className="flex-1" size={"lg"}>
            Deposit <Plus size={16} />
          </Button>
        </DialogTrigger>
        <DialogContent className="flex max-h-[min(600px,80vh)] flex-col gap-0 p-0 sm:max-w-md data-[state=open]:zoom-in-0! data-[state=open]:duration-600">
          <DialogHeader className="contents space-y-0 text-left">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
              <div className="absolute w-[568px] h-[450px] -top-72 left-0 bg-primary-blue-base/50 blur-[264px] opacity-100 transition-opacity duration-500" />
              <div className="absolute w-[150px] h-[216px] -top-60 left-1/3 bg-white blur-3xl opacity-100 transition-opacity duration-500" />
            </div>
            <div className="relative mt-6 px-6">
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
                  Select the asset and amount you want to add, and power up your
                  Centuari balance.
                </CentuariTypography>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleDeposit();
                }}
              >
                <SelectChain
                  value={selectedChain}
                  onValueChange={(value) =>
                    setSelectedChain(value as ChainValue)
                  }
                />
                <SelectToken
                  value={selectedToken}
                  onValueChange={(value) =>
                    setSelectedToken(value as TokenValue)
                  }
                />
                <CentuariInput
                  id="amount"
                  label="Deposit Amount"
                  size="large"
                  placeholder="0"
                  leftIcon={<TokenIcon />}
                  className="mt-0"
                  containerClassName="mt-3.5"
                  value={displayAmount}
                  onChange={handleAmountChange}
                  disabled={isProcessing}
                  type="text"
                  inputMode="decimal"
                />
              </form>
            </div>
          </DialogHeader>
          <DialogFooter className="flex-row items-center justify-end px-6 py-4">
            <Button
              type="button"
              variant="primary"
              className="flex-1"
              onClick={handleDeposit}
              disabled={isProcessing || !depositAmount}
            >
              {isProcessing ? (
                <>
                  Processing... <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                </>
              ) : (
                "Confirm Deposit"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CentuariDepositSuccessDialog
        open={showSuccessDialog}
        onOpenChange={(open) => {
          setShowSuccessDialog(open);
          if (!open) {
            // Reset everything when success dialog closes
            setDepositAmount("");
            setDisplayAmount("");
            setSelectedChain("eth");
            setSelectedToken("usdt");
            setSuccessData(null);
          }
        }}
        token={successData?.token || selectedToken}
        amount={successData?.amount || displayAmount || depositAmount}
        chain={successData?.chain ?? selectedChain}
      />
    </>
  );
}
