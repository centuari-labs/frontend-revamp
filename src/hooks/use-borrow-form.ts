"use client";

import { useState, useEffect, useCallback } from "react";
import { formatNumberWithSeparator } from "@/lib/utils";
import {
  getDefaultMaturityTimestamp,
  normalizeMaturity,
} from "@/lib/maturity";
import { tokenList as portfolioTokenList } from "@/lib/portfolio-data";
import { useSubmitBorrow } from "@/hooks/use-submit-borrow";
import { useAmountInput } from "@/hooks/use-amount-input";
import { useTokenFromList } from "@/hooks/use-token-from-list";
import { usePortfolioFromStorage } from "@/hooks/use-portfolio-from-storage";
import { useBorrowCalculations } from "@/hooks/use-borrow-calculations";
import type { BorrowPosition } from "@/types/positions";
import type { TokenOption } from "@/types";

export interface UseBorrowFormParams {
  tokenList: TokenOption[];
  selectedTokenProp?: TokenOption;
  editingPosition?: BorrowPosition;
  onUpdate?: (updatedPosition: BorrowPosition) => void;
}

export function useBorrowForm({
  tokenList,
  selectedTokenProp,
  editingPosition,
  onUpdate,
}: UseBorrowFormParams) {
  const { submitLimit, submitMarket, isPending } = useSubmitBorrow();
  const { selectedToken, setSelectedToken } = useTokenFromList(
    tokenList,
    selectedTokenProp,
    "usdt"
  );
  const { portfolio, totalDebt, collateralStatus } = usePortfolioFromStorage();

  const limitAmountInput = useAmountInput();
  const marketAmountInput = useAmountInput();

  const [limitMaturity, setLimitMaturity] = useState(() =>
    getDefaultMaturityTimestamp()
  );
  const [limitTargetAPR, setLimitTargetAPR] = useState("");
  const [limitSelectedCollaterals, setLimitSelectedCollaterals] = useState<
    string[]
  >([]);
  const [marketMaturity, setMarketMaturity] = useState(() =>
    getDefaultMaturityTimestamp()
  );
  const [marketSelectedCollaterals, setMarketSelectedCollaterals] = useState<
    string[]
  >([]);
  const [autoRefinance, setAutoRefinance] = useState(true);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successAmount, setSuccessAmount] = useState("");
  const [successTokenSymbol, setSuccessTokenSymbol] = useState("");

  const limitNumericAmount = parseFloat(limitAmountInput.amount) || 0;
  const marketNumericAmount = parseFloat(marketAmountInput.amount) || 0;

  const limitCalcs = useBorrowCalculations(
    portfolio,
    totalDebt,
    limitNumericAmount,
    limitSelectedCollaterals
  );
  const marketCalcs = useBorrowCalculations(
    portfolio,
    totalDebt,
    marketNumericAmount,
    marketSelectedCollaterals
  );

  useEffect(() => {
    if (!editingPosition) return;

    const aprPercent = ((editingPosition.apr ?? 0) * 100)
      .toFixed(1)
      .replace(".", ",");
    const token = tokenList.find((t) => t.value === editingPosition.tokenValue);
    if (token) setSelectedToken(token);

    if (editingPosition.orderType === "limit") {
      limitAmountInput.setAmount(editingPosition.amount.toString());
      limitAmountInput.setDisplayAmount(
        formatNumberWithSeparator(editingPosition.amount.toString())
      );
      setLimitTargetAPR(aprPercent);
      setLimitMaturity(normalizeMaturity(editingPosition.maturity));
      setLimitSelectedCollaterals(editingPosition.collateralTokens || []);
    } else {
      marketAmountInput.setAmount(editingPosition.amount.toString());
      marketAmountInput.setDisplayAmount(
        formatNumberWithSeparator(editingPosition.amount.toString())
      );
      setMarketMaturity(normalizeMaturity(editingPosition.maturity));
      setMarketSelectedCollaterals(editingPosition.collateralTokens || []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingPosition, tokenList]);

  useEffect(() => {
    if (editingPosition) return;

    const autoSelected = portfolioTokenList
      .filter(
        (token) =>
          portfolio[token.value] &&
          portfolio[token.value] > 0 &&
          collateralStatus[token.value] === true
      )
      .map((token) => token.value);

    if (limitSelectedCollaterals.length === 0) {
      setLimitSelectedCollaterals(autoSelected);
    }
    if (marketSelectedCollaterals.length === 0) {
      setMarketSelectedCollaterals(autoSelected);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    collateralStatus,
    portfolio,
    editingPosition,
    limitSelectedCollaterals.length,
    marketSelectedCollaterals.length,
  ]);

  const handleLimitSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const numericAmount = parseFloat(limitAmountInput.amount) || 0;

      if (numericAmount <= 0 || isPending) return;
      if (numericAmount > limitCalcs.availableQuota) return;
      if (limitSelectedCollaterals.length === 0) return;
      if (limitCalcs.totalPortfolioValue === 0) return;
      if (limitCalcs.healthFactor < 1.0) return;

      try {
        const targetAPRNumeric =
          parseFloat(limitTargetAPR.replace(/,/g, ".")) || 0;
        const aprDecimal = targetAPRNumeric / 100;

        const result = await submitLimit({
          tokenValue: selectedToken.value,
          tokenLogo: selectedToken.logo,
          tokenLabel: selectedToken.label,
          amount: numericAmount,
          maturity: limitMaturity,
          targetApr: aprDecimal,
          collateralTokens: limitSelectedCollaterals,
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
        setLimitSelectedCollaterals([]);
        setShowSuccessDialog(true);
      } catch (error) {
        console.error("Transaction failed:", error);
      }
    },
    [
      limitAmountInput,
      limitTargetAPR,
      limitMaturity,
      limitSelectedCollaterals,
      limitCalcs,
      isPending,
      selectedToken,
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
      if (numericAmount > marketCalcs.availableQuota) return;
      if (marketSelectedCollaterals.length === 0) return;
      if (marketCalcs.totalPortfolioValue === 0) return;
      if (marketCalcs.healthFactor < 1.0) return;

      try {
        const result = await submitMarket({
          tokenValue: selectedToken.value,
          tokenLogo: selectedToken.logo,
          tokenLabel: selectedToken.label,
          amount: numericAmount,
          maturity: marketMaturity,
          collateralTokens: marketSelectedCollaterals,
          editingPosition: editingPosition ?? undefined,
        });

        if (editingPosition && onUpdate) {
          onUpdate(result);
          return;
        }

        setSuccessAmount(formatNumberWithSeparator(numericAmount));
        setSuccessTokenSymbol(selectedToken.label.toUpperCase().slice(0, 4));
        marketAmountInput.reset();
        setMarketSelectedCollaterals([]);
        setShowSuccessDialog(true);
      } catch (error) {
        console.error("Transaction failed:", error);
      }
    },
    [
      marketAmountInput,
      marketMaturity,
      marketSelectedCollaterals,
      marketCalcs,
      isPending,
      selectedToken,
      submitMarket,
      editingPosition,
      onUpdate,
    ]
  );

  const handleLimitMaxClick = useCallback(() => {
    const maxAmount = Math.max(0, limitCalcs.availableQuota);
    limitAmountInput.setMax(maxAmount);
  }, [limitCalcs.availableQuota, limitAmountInput]);

  const handleMarketMaxClick = useCallback(() => {
    const maxAmount = Math.max(0, marketCalcs.availableQuota);
    marketAmountInput.setMax(maxAmount);
  }, [marketCalcs.availableQuota, marketAmountInput]);

  return {
    selectedToken,
    portfolio,
    totalDebt,
    collateralStatus,
    limitAmount: limitAmountInput.amount,
    limitDisplayAmount: limitAmountInput.displayAmount,
    limitMaturity,
    setLimitMaturity,
    limitTargetAPR,
    setLimitTargetAPR,
    limitSelectedCollaterals,
    setLimitSelectedCollaterals,
    handleLimitAmountChange: limitAmountInput.handleChange,
    handleLimitSubmit,
    handleLimitMaxClick,
    limitHealthFactor: limitCalcs.healthFactor,
    limitHealthFactorPercentage: limitCalcs.healthFactorPercentage,
    limitTotalPortfolioValue: limitCalcs.totalPortfolioValue,
    limitAvailableQuota: limitCalcs.availableQuota,
    limitNumericAmount,
    getLiquidationThresholdDisplay: limitCalcs.getLiquidationThresholdDisplay,
    marketAmount: marketAmountInput.amount,
    marketDisplayAmount: marketAmountInput.displayAmount,
    marketMaturity,
    setMarketMaturity,
    marketSelectedCollaterals,
    setMarketSelectedCollaterals,
    handleMarketAmountChange: marketAmountInput.handleChange,
    handleMarketSubmit,
    handleMarketMaxClick,
    marketHealthFactor: marketCalcs.healthFactor,
    marketHealthFactorPercentage: marketCalcs.healthFactorPercentage,
    marketTotalPortfolioValue: marketCalcs.totalPortfolioValue,
    marketAvailableQuota: marketCalcs.availableQuota,
    marketNumericAmount,
    autoRefinance,
    setAutoRefinance,
    showSuccessDialog,
    setShowSuccessDialog,
    successAmount,
    successTokenSymbol,
    isPending,
  };
}
