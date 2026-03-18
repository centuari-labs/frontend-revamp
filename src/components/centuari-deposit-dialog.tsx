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
import { Plus, Loader2, AlertTriangle } from "lucide-react";
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
import { toast } from "sonner";
import { CentuariAlert } from "./centuari-alert";
import { useDeposit } from "@/hooks/use-deposit";
import { useDepositTokens } from "@/hooks/use-deposit-tokens";
import { useOnChainBalance } from "@/hooks/use-on-chain-balance";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "./ui/label";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { ACTIVE_CHAIN, ACTIVE_CHAIN_LABEL } from "@/lib/chain-config";

const EXPECTED_CAIP2 = `eip155:${ACTIVE_CHAIN.id}`;

export function CentuariDepositDialog() {
  const router = useRouter();
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const { deposit, status: depositStatus, reset: resetDeposit } = useDeposit();
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

  const { balance: onChainBalance, isLoading: balanceLoading } = useOnChainBalance(selectedToken?.symbol ?? "");

  // ─── Network detection ───────────────────────────────────────────────
  const linkedAddress = user?.wallet?.address?.toLowerCase();
  const loginWallet = linkedAddress
    ? wallets.find(
        (w) =>
          w.walletClientType !== "privy" &&
          w.address.toLowerCase() === linkedAddress,
      )
    : undefined;
  const isWrongNetwork = loginWallet != null && loginWallet.chainId !== EXPECTED_CAIP2;
  const [switchingChain, setSwitchingChain] = useState(false);

  const handleSwitchChain = async () => {
    if (!loginWallet || switchingChain) return;
    setSwitchingChain(true);
    try {
      await loginWallet.switchChain(ACTIVE_CHAIN.id);
    } catch {
      toast.error("Failed to switch network");
    } finally {
      setSwitchingChain(false);
    }
  };

  const isProcessing =
    depositStatus === "checkingAllowance" ||
    depositStatus === "approving" ||
    depositStatus === "waitingApproval" ||
    depositStatus === "depositing" ||
    depositStatus === "confirming";

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
    if (onChainBalance > 0) {
      const balance = String(onChainBalance);
      setDepositAmount(balance);
      setDisplayAmount(formatNumberWithSeparator(balance));
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || !selectedTokenId || isProcessing) return;

    try {
      const result = await deposit(selectedTokenId, depositAmount, selectedToken);

      if (result) {
        setSuccessData({
          symbol: selectedToken?.symbol ?? "",
          amount: displayAmount || depositAmount,
          txHash: result.transactionHash,
        });
        setDialogOpen(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Deposit failed";
      toast.error(message);
    }
  };

  // Validate: amount must not exceed balance
  const amountExceedsBalance = useMemo(() => {
    if (!depositAmount || onChainBalance <= 0) return false;
    return Number.parseFloat(depositAmount) > onChainBalance;
  }, [depositAmount, onChainBalance]);

  const isSubmitDisabled =
    isProcessing || !depositAmount || !selectedTokenId || amountExceedsBalance || isWrongNetwork;

  const tokenIcon = selectedToken
    ? getTokenLogo(selectedToken.symbol, selectedToken.imageUrl ?? undefined)
    : "/tokens/usdc-icon.webp";

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
        <DialogContent
          className="flex max-h-[min(600px,80vh)] flex-col gap-0 p-0 sm:max-w-md data-[state=open]:zoom-in-0! data-[state=open]:duration-600"
          onInteractOutside={(e) => { if (isProcessing) e.preventDefault(); }}
          onEscapeKeyDown={(e) => { if (isProcessing) e.preventDefault(); }}
        >
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
                  <Label>Select Chain</Label>
                  {isWrongNetwork ? (
                    <button
                      type="button"
                      onClick={handleSwitchChain}
                      disabled={switchingChain}
                      className="flex w-full items-center gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-400 transition-colors hover:bg-yellow-500/20 disabled:opacity-50"
                    >
                      {switchingChain ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <AlertTriangle className="h-4 w-4" />
                      )}
                      <span className="flex-1 text-left">
                        {switchingChain ? "Switching..." : `Switch to ${ACTIVE_CHAIN_LABEL}`}
                      </span>
                      <img
                        src="https://assets.coingecko.com/coins/images/16547/standard/arb.jpg?1721358242"
                        alt={ACTIVE_CHAIN_LABEL}
                        width={20}
                        height={20}
                        className="size-5 rounded-full object-cover"
                      />
                    </button>
                  ) : (
                    <Select value={String(ACTIVE_CHAIN.id)} disabled>
                      <SelectTrigger className="!h-9 border-0 bg-transparent px-2 py-1 focus:ring-0 focus:ring-offset-0 gap-1 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[120] bg-white/5 backdrop-blur-[140px]">
                        <SelectGroup>
                          <SelectItem value={String(ACTIVE_CHAIN.id)}>
                            <img
                              src="https://assets.coingecko.com/coins/images/16547/standard/arb.jpg?1721358242"
                              alt={ACTIVE_CHAIN_LABEL}
                              width={16}
                              height={16}
                              className="size-4 rounded-full object-cover"
                            />
                            {ACTIVE_CHAIN_LABEL}
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                </div>
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
                    !balanceLoading && onChainBalance != null ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        Balance: {onChainBalance.toLocaleString(undefined, { maximumFractionDigits: 6 })} {selectedToken?.symbol ?? ""}
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
                  <CentuariAlert
                    variant="destructive"
                    text="Insufficient wallet balance"
                    description="Get testnet tokens from the faucet"
                    className="mt-1.5"
                    action={
                      <Button
                        variant="destructive"
                        size="sm"
                        type="button"
                        onClick={() => {
                          setDialogOpen(false);
                          router.push("/faucet");
                        }}
                      >
                        Deposit
                      </Button>
                    }
                  />
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
              {depositStatus === "checkingAllowance" ? (
                <>
                  Checking allowance... <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                </>
              ) : depositStatus === "approving" ? (
                <>
                  Approve in wallet... <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                </>
              ) : depositStatus === "waitingApproval" ? (
                <>
                  Waiting for approval... <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                </>
              ) : depositStatus === "depositing" ? (
                <>
                  Confirm deposit in wallet... <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                </>
              ) : depositStatus === "confirming" ? (
                <>
                  Confirming deposit... <Loader2 className="w-4 h-4 ml-2 animate-spin" />
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
