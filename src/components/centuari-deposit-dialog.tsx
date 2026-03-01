"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { Plus, Loader2 } from "lucide-react";
import Image from "next/image";
import { CentuariTypography } from "./centuari-typography";
import { CentuariInput } from "./centuari-input";
import { TransactionSuccessDialog } from "./transaction-success-dialog";
import {
  formatNumberWithSeparator,
  parseNumberFromSeparator,
} from "@/lib/utils";
import { getTokenLogo } from "@/lib/tokens";
import { useRouter } from "next/navigation";
import { useDeposit } from "@/hooks/use-deposit";
import { useDepositTokens } from "@/hooks/use-deposit-tokens";
import { useDepositBalance } from "@/hooks/use-deposit-balance";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "./ui/label";

export function CentuariDepositDialog() {
  const router = useRouter();
  const { deposit, status: depositStatus, error: depositError, reset: resetDeposit } = useDeposit();
  const { data: tokens, isLoading: tokensLoading } = useDepositTokens();

  const [selectedTokenId, setSelectedTokenId] = useState<string>("");
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [displayAmount, setDisplayAmount] = useState<string>("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [successData, setSuccessData] = useState<{
    symbol: string;
    amount: string;
    txHash: string;
  } | null>(null);

  const selectedToken = useMemo(
    () => tokens?.find((t) => t.id === selectedTokenId),
    [tokens, selectedTokenId],
  );

  // Auto-select first token when tokens load
  useEffect(() => {
    if (tokens && tokens.length > 0 && !selectedTokenId) {
      setSelectedTokenId(tokens[0].id);
    }
  }, [tokens, selectedTokenId]);

  const { data: balanceData } = useDepositBalance(selectedTokenId || undefined);

  const isProcessing = depositStatus === "loading";

  const depositSuccessDescription = successData
    ? `You have successfully deposited ${successData.amount} ${successData.symbol} to your vault.`
    : "Your deposit has been completed successfully.";

  // Handle opening success dialog after deposit dialog closes
  useEffect(() => {
    if (!dialogOpen && successData) {
      const timer = setTimeout(() => {
        setShowSuccessDialog(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [dialogOpen, successData]);

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open && !successData) {
      setDepositAmount("");
      setDisplayAmount("");
      setSelectedTokenId(tokens?.[0]?.id ?? "");
      resetDeposit();
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numericValue = parseNumberFromSeparator(inputValue);
    const formattedValue = formatNumberWithSeparator(numericValue);
    setDepositAmount(numericValue);
    setDisplayAmount(formattedValue);
  };

  const handleMaxClick = () => {
    if (balanceData?.formattedBalance) {
      const balance = balanceData.formattedBalance;
      setDepositAmount(balance);
      setDisplayAmount(formatNumberWithSeparator(balance));
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || !selectedTokenId || isProcessing) return;

    const result = await deposit(selectedTokenId, depositAmount);

    if (result) {
      setSuccessData({
        symbol: selectedToken?.symbol ?? "",
        amount: displayAmount || depositAmount,
        txHash: result.transactionHash,
      });
      setDialogOpen(false);
    }
  };

  // Validate: amount must not exceed balance
  const amountExceedsBalance = useMemo(() => {
    if (!depositAmount || !balanceData?.formattedBalance) return false;
    return Number.parseFloat(depositAmount) > Number.parseFloat(balanceData.formattedBalance);
  }, [depositAmount, balanceData]);

  const isSubmitDisabled =
    isProcessing || !depositAmount || !selectedTokenId || amountExceedsBalance;

  const tokenIcon = selectedToken
    ? getTokenLogo(selectedToken.symbol, selectedToken.imageUrl ?? undefined)
    : "/tokens/usdc-icon.svg";

  const TokenIcon = () => (
    <Image
      src={tokenIcon}
      width={16}
      height={16}
      alt={selectedToken?.symbol ?? "token"}
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
                <div className="w-full space-y-2 mt-3.5">
                  <Label>Select Token</Label>
                  <Select
                    value={selectedTokenId}
                    onValueChange={setSelectedTokenId}
                    disabled={tokensLoading}
                  >
                    <SelectTrigger className="!h-9 border-0 bg-transparent px-2 py-1 focus:ring-0 focus:ring-offset-0 gap-1 w-full">
                      <SelectValue placeholder={tokensLoading ? "Loading..." : "Select Token"} />
                    </SelectTrigger>
                    <SelectContent className="z-[120] bg-white/5 backdrop-blur-[140px]">
                      <SelectGroup>
                        {tokens?.map((token) => (
                          <SelectItem key={token.id} value={token.id}>
                            <Image
                              src={getTokenLogo(token.symbol, token.imageUrl ?? undefined)}
                              width={16}
                              height={16}
                              alt={token.symbol}
                            />
                            {token.symbol}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
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
                  balanceText={
                    balanceData ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        Balance: {Number.parseFloat(balanceData.formattedBalance).toLocaleString(undefined, { maximumFractionDigits: 6 })} {selectedToken?.symbol ?? ""}
                        <button
                          type="button"
                          onClick={handleMaxClick}
                          className="text-primary-blue-base hover:underline font-medium ml-1"
                        >
                          Max
                        </button>
                      </span>
                    ) : null
                  }
                />
                {amountExceedsBalance && (
                  <p className="text-xs text-red-400 mt-1">
                    Amount exceeds available balance
                  </p>
                )}
                {depositError && (
                  <p className="text-xs text-red-400 mt-1">
                    {depositError}
                  </p>
                )}
              </form>
            </div>
          </DialogHeader>
          <DialogFooter className="flex-row items-center justify-end px-6 py-4">
            <Button
              type="button"
              variant="primary"
              className="flex-1"
              onClick={handleDeposit}
              disabled={isSubmitDisabled}
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

      <TransactionSuccessDialog
        open={showSuccessDialog}
        onOpenChange={(open) => {
          setShowSuccessDialog(open);
          if (!open) {
            setDepositAmount("");
            setDisplayAmount("");
            setSelectedTokenId(tokens?.[0]?.id ?? "");
            setSuccessData(null);
            resetDeposit();
          }
        }}
        title="Deposit Complete"
        description={depositSuccessDescription}
        primaryActionLabel="Start Earning"
        onPrimaryAction={() => router.push("/")}
        secondaryActionLabel="Done"
      />
    </>
  );
}
