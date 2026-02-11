"use client";

import { useState, useEffect, useCallback } from "react";
import {
  formatNumberWithSeparator,
  calculateFutureAmount,
} from "@/lib/utils";
import { getBestLendAPR } from "@/lib/positions-adapter.mock";
import {
  getDefaultMaturityTimestamp,
  getAvailableMaturityTimestamps,
  formatMaturityTimestamp,
  normalizeMaturity,
} from "@/lib/maturity";
import { tokenList as portfolioTokenList } from "@/lib/portfolio-data";
import { useSubmitLend } from "@/hooks/use-submit-lend";
import { useAmountInput } from "@/hooks/use-amount-input";
import { useTokenFromList } from "@/hooks/use-token-from-list";
import type { LendPosition } from "@/types/positions";
import type { TokenOption } from "@/types";

export interface UseLendFormParams {
  tokenList: TokenOption[];
  selectedTokenProp?: TokenOption;
  editingPosition?: LendPosition;
  onUpdate?: (updatedPosition: LendPosition) => void;
}

export function useLendForm({
  tokenList,
  selectedTokenProp,
  editingPosition,
  onUpdate,
}: UseLendFormParams) {
  const { submitLimit, submitMarket, isPending } = useSubmitLend();
  const { selectedToken, setSelectedToken } = useTokenFromList(
    tokenList,
    selectedTokenProp,
    "usdc"
  );

  const limitAmountInput = useAmountInput();
  const marketAmountInput = useAmountInput();

  const [limitMaturity, setLimitMaturity] = useState(() =>
    getDefaultMaturityTimestamp()
  );
  const [limitTargetAPR, setLimitTargetAPR] = useState("");
  const [marketMaturity, setMarketMaturity] = useState(() =>
    getDefaultMaturityTimestamp()
  );
  const [autoRollover, setAutoRollover] = useState(true);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successAmount, setSuccessAmount] = useState("");
  const [successTokenSymbol, setSuccessTokenSymbol] = useState("");

  const getTokenInfo = useCallback((value: string) => {
    return portfolioTokenList.find((t) => t.value === value);
  }, []);

  const getAvailableBalance = useCallback((): number => {
    if (typeof window === "undefined") return 1000;
    const stored = localStorage.getItem("centuari_portfolio");
    if (stored) {
      try {
        const portfolio = JSON.parse(stored);
        const tokenInfo = getTokenInfo(selectedToken.value);
        if (tokenInfo) {
          const portfolioValue = portfolio[selectedToken.value] || 0;
          return tokenInfo.price > 0 ? portfolioValue / tokenInfo.price : 1000;
        }
      } catch {
        return 1000;
      }
    }
    return 1000;
  }, [selectedToken.value, getTokenInfo]);

  useEffect(() => {
    if (!editingPosition) return;
    const tokenInfo = getTokenInfo(editingPosition.tokenValue);
    if (!tokenInfo) return;

    const tokenAmount = editingPosition.amount / tokenInfo.price;
    const amountStr = tokenAmount.toString();
    const formattedAmount = formatNumberWithSeparator(amountStr);
    const aprValue = editingPosition.apr ?? 0;
    const aprPercent = (aprValue * 100).toFixed(1).replace(".", ",");

    const token = tokenList.find((t) => t.value === editingPosition.tokenValue);
    if (token) setSelectedToken(token);

    if (editingPosition.orderType === "limit") {
      limitAmountInput.setAmount(amountStr);
      limitAmountInput.setDisplayAmount(formattedAmount);
      setLimitTargetAPR(aprPercent);
      setLimitMaturity(normalizeMaturity(editingPosition.maturity));
    } else {
      marketAmountInput.setAmount(amountStr);
      marketAmountInput.setDisplayAmount(formattedAmount);
      setMarketMaturity(normalizeMaturity(editingPosition.maturity));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingPosition, tokenList]);

  const limitNumericAmount = parseFloat(limitAmountInput.amount) || 0;
  const limitTransactionFee = limitNumericAmount * 0.0001;
  const limitAmountToPay = limitNumericAmount + limitTransactionFee;
  const limitTargetAPRNumeric =
    parseFloat(limitTargetAPR.replace(/,/g, ".")) || 0;
  const limitFutureAmount = calculateFutureAmount(
    limitNumericAmount,
    limitTargetAPRNumeric,
    limitMaturity
  );

  const marketNumericAmount = parseFloat(marketAmountInput.amount) || 0;
  const marketTransactionFee = marketNumericAmount * 0.0001;
  const marketAmountToPay = marketNumericAmount + marketTransactionFee;
  const marketFutureAmount = calculateFutureAmount(
    marketNumericAmount,
    getBestLendAPR(selectedToken?.value ?? "usdc"),
    marketMaturity
  );

  const handleLimitSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const numericAmount = parseFloat(limitAmountInput.amount) || 0;
      if (numericAmount <= 0 || isPending) return;

      const tokenInfo = getTokenInfo(selectedToken.value);
      if (!tokenInfo) return;

      try {
        const amountInUsd = numericAmount * tokenInfo.price;
        const targetAPRNumeric =
          parseFloat(limitTargetAPR.replace(/,/g, ".")) || 0;
        const aprDecimal = targetAPRNumeric / 100;

        const result = await submitLimit({
          tokenValue: selectedToken.value,
          tokenLogo: selectedToken.logo,
          tokenLabel: selectedToken.label,
          amount: numericAmount,
          amountInUsd,
          targetApr: aprDecimal || (4.5 + Math.random() * 3) / 100,
          maturity: limitMaturity,
          editingPosition: editingPosition ?? undefined,
        });

        if (editingPosition && onUpdate) {
          onUpdate(result);
          return;
        }

        setSuccessAmount(formatNumberWithSeparator(numericAmount));
        setSuccessTokenSymbol(selectedToken.label.toUpperCase().slice(0, 4));
        limitAmountInput.reset();
        setLimitTargetAPR("");
        setShowSuccessDialog(true);
      } catch (error) {
        console.error("Transaction failed:", error);
      }
    },
    [
      limitAmountInput,
      limitTargetAPR,
      limitMaturity,
      isPending,
      selectedToken,
      getTokenInfo,
      submitLimit,
      editingPosition,
      onUpdate,
    ]
  );

  const handleMarketSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const numericAmount = parseFloat(marketAmountInput.amount) || 0;
      if (numericAmount <= 0 || isPending) return;

      const tokenInfo = getTokenInfo(selectedToken.value);
      if (!tokenInfo) return;

      try {
        const amountInUsd = numericAmount * tokenInfo.price;

        const result = await submitMarket({
          tokenValue: selectedToken.value,
          tokenLogo: selectedToken.logo,
          tokenLabel: selectedToken.label,
          amount: numericAmount,
          amountInUsd,
          maturity: marketMaturity,
          editingPosition: editingPosition ?? undefined,
        });

        if (editingPosition && onUpdate) {
          onUpdate(result);
          return;
        }

        setSuccessAmount(formatNumberWithSeparator(numericAmount));
        setSuccessTokenSymbol(selectedToken.label.toUpperCase().slice(0, 4));
        marketAmountInput.reset();
        setShowSuccessDialog(true);
      } catch (error) {
        console.error("Transaction failed:", error);
      }
    },
    [
      marketAmountInput,
      marketMaturity,
      isPending,
      selectedToken,
      getTokenInfo,
      submitMarket,
      editingPosition,
      onUpdate,
    ]
  );

  const setLimitMax = useCallback(() => {
    const max = getAvailableBalance();
    limitAmountInput.setMax(max);
  }, [getAvailableBalance, limitAmountInput]);

  const setMarketMax = useCallback(() => {
    const max = getAvailableBalance();
    marketAmountInput.setMax(max);
  }, [getAvailableBalance, marketAmountInput]);

  return {
    selectedToken,
    getTokenInfo,
    getAvailableBalance,
    limitAmount: limitAmountInput.amount,
    limitDisplayAmount: limitAmountInput.displayAmount,
    limitMaturity,
    setLimitMaturity,
    limitTargetAPR,
    setLimitTargetAPR,
    handleLimitAmountChange: limitAmountInput.handleChange,
    handleLimitSubmit,
    limitTransactionFee,
    limitAmountToPay,
    limitFutureAmount,
    marketAmount: marketAmountInput.amount,
    marketDisplayAmount: marketAmountInput.displayAmount,
    marketMaturity,
    setMarketMaturity,
    handleMarketAmountChange: marketAmountInput.handleChange,
    handleMarketSubmit,
    marketTransactionFee,
    marketAmountToPay,
    marketFutureAmount,
    autoRollover,
    setAutoRollover,
    setLimitMax,
    setMarketMax,
    showSuccessDialog,
    setShowSuccessDialog,
    successAmount,
    successTokenSymbol,
    isPending,
    getAvailableMaturityTimestamps,
    formatMaturityTimestamp,
  };
}
