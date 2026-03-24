"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { formatNumberWithSeparator, calculateFutureAmount } from "@/lib/utils";
import {
  getDefaultMaturityTimestamp,
  getAvailableMaturityTimestamps,
  normalizeMaturity,
} from "@/lib/maturity";
import { useSubmitBorrow } from "@/hooks/use-submit-borrow";
import { useAmountInput } from "@/hooks/use-amount-input";
import { useTokenFromList } from "@/hooks/use-token-from-list";
import { useBorrowPortfolioData } from "@/hooks/use-borrow-portfolio-data";
import { useBorrowCalculations } from "@/hooks/use-borrow-calculations";
import { useAuthToken } from "@/hooks/use-auth-token";
import { useMarketDetail } from "@/hooks/use-market-detail";
import { useOrderbook } from "@/hooks/use-orderbook";
import { useTokenPrice } from "@/contexts/price-context";
import type { BorrowPosition } from "@/types/positions";
import type { TokenOption } from "@/types";

export interface UseBorrowFormParams {
  tokenList: TokenOption[];
  selectedTokenProp?: TokenOption;
  editingPosition?: BorrowPosition;
  onUpdate?: (updatedPosition: BorrowPosition) => void;
  maturityOptions?: number[];
  assetId?: string;
}

export function useBorrowForm({
  tokenList,
  selectedTokenProp,
  editingPosition,
  onUpdate,
  maturityOptions,
  assetId: assetIdProp,
}: UseBorrowFormParams) {
  const { upcomingMaturities } = useMarketDetail(assetIdProp);
  const { lendOrders } = useOrderbook({ assetId: assetIdProp });
  const { getToken } = useAuthToken();
  const { submitLimit, submitMarket, isPending } = useSubmitBorrow();
  const { selectedToken, setSelectedToken } = useTokenFromList(
    tokenList,
    selectedTokenProp,
    "usdt"
  );
  const { portfolio, totalDebt, collateralStatus, collateralTokenList, userHealthFactor, apiCollateralUsd, apiSettledDebtUsd, apiWeightedLtv, isLoading: portfolioLoading } = useBorrowPortfolioData();
  const borrowTokenPrice = useTokenPrice(assetIdProp) ?? 0;

  const limitAmountInput = useAmountInput();
  const marketAmountInput = useAmountInput();

  const availableMaturities = useMemo(() => {
    if (maturityOptions && maturityOptions.length > 0) {
      return maturityOptions;
    }
    return getAvailableMaturityTimestamps();
  }, [maturityOptions]);

  const defaultMaturity = availableMaturities[0] ?? getDefaultMaturityTimestamp();

  const [limitMaturity, setLimitMaturity] = useState(defaultMaturity);
  const [limitTargetAPR, setLimitTargetAPR] = useState("");
  const [limitSelectedCollaterals, setLimitSelectedCollaterals] = useState<
    string[]
  >([]);
  const [marketMaturity, setMarketMaturity] = useState(defaultMaturity);
  const [marketSelectedCollaterals, setMarketSelectedCollaterals] = useState<
    string[]
  >([]);
  const [autoRefinance, setAutoRefinance] = useState(true);

  // Sync default maturity when backend data loads
  useEffect(() => {
    if (availableMaturities.length > 0) {
      setLimitMaturity((prev) => {
        const isLocal = !availableMaturities.includes(prev);
        return isLocal ? availableMaturities[0] : prev;
      });
      setMarketMaturity((prev) => {
        const isLocal = !availableMaturities.includes(prev);
        return isLocal ? availableMaturities[0] : prev;
      });
    }
  }, [availableMaturities]);

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successAmount, setSuccessAmount] = useState("");
  const [successTokenSymbol, setSuccessTokenSymbol] = useState("");

  const SETTLEMENT_FEE_BPS = 1;
  const SETTLEMENT_FEE_MAX_USD = 0.05;
  const MAKER_FEE_BPS = 10;
  const TAKER_FEE_BPS = 20;

  const limitNumericAmount = parseFloat(limitAmountInput.amount) || 0;
  const marketNumericAmount = parseFloat(marketAmountInput.amount) || 0;

  const limitTargetAPRNumeric = parseFloat(limitTargetAPR.replace(/,/g, ".")) || 0;

  // Limit = maker fee
  const limitSettlementFee = Math.min(limitNumericAmount * (SETTLEMENT_FEE_BPS / 10000), SETTLEMENT_FEE_MAX_USD);
  const limitTradeFee = limitNumericAmount * (MAKER_FEE_BPS / 10000);
  const limitTransactionFee = limitSettlementFee + limitTradeFee;
  const limitAmountToPay = limitNumericAmount + limitTransactionFee;
  const limitFutureAmount = calculateFutureAmount(limitNumericAmount, limitTargetAPRNumeric, limitMaturity);

  // Market = taker fee
  const marketSettlementFee = Math.min(marketNumericAmount * (SETTLEMENT_FEE_BPS / 10000), SETTLEMENT_FEE_MAX_USD);
  const marketTradeFee = marketNumericAmount * (TAKER_FEE_BPS / 10000);
  const marketTransactionFee = marketSettlementFee + marketTradeFee;
  const marketAmountToPay = marketNumericAmount + marketTransactionFee;
  const bestBorrowRate = (lendOrders[0]?.apr ?? 0) * 100;
  const marketFutureAmount = calculateFutureAmount(marketNumericAmount, bestBorrowRate, marketMaturity);

  const limitCalcs = useBorrowCalculations(
    portfolio,
    totalDebt,
    limitNumericAmount,
    limitSelectedCollaterals,
    collateralTokenList,
    apiCollateralUsd,
    apiSettledDebtUsd,
    apiWeightedLtv,
    borrowTokenPrice,
  );
  const marketCalcs = useBorrowCalculations(
    portfolio,
    totalDebt,
    marketNumericAmount,
    marketSelectedCollaterals,
    collateralTokenList,
    apiCollateralUsd,
    apiSettledDebtUsd,
    apiWeightedLtv,
    borrowTokenPrice,
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

    const autoSelected = collateralTokenList
      .filter(
        (token) =>
          portfolio[token.value] &&
          portfolio[token.value] > 0 &&
          collateralStatus[token.value] === true
      )
      .map((token) => token.value);

    if (limitSelectedCollaterals.length === 0 && autoSelected.length > 0) {
      setLimitSelectedCollaterals(autoSelected);
    }
    if (marketSelectedCollaterals.length === 0 && autoSelected.length > 0) {
      setMarketSelectedCollaterals(autoSelected);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    collateralStatus,
    collateralTokenList,
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
      if (numericAmount * borrowTokenPrice > limitCalcs.availableQuota) return;
      if (limitSelectedCollaterals.length === 0) return;
      if (limitCalcs.totalPortfolioValue === 0) return;
      if (limitCalcs.healthFactor < 1.0) return;

      try {
        const targetAPRNumeric =
          parseFloat(limitTargetAPR.replace(/,/g, ".")) || 0;
        const aprDecimal = targetAPRNumeric / 100;

        const token = await getToken();
        const resolvedMarketId = upcomingMaturities.find(m => m.maturity === limitMaturity)?.marketId;
        const result = await submitLimit(
          {
            tokenValue: selectedToken.value,
            tokenLogo: selectedToken.logo,
            tokenLabel: selectedToken.label,
            amount: numericAmount,
            maturity: limitMaturity,
            targetApr: aprDecimal,
            collateralTokens: limitSelectedCollaterals,
            autoRollover: autoRefinance,
            editingPosition: editingPosition ?? undefined,
          },
          assetIdProp && resolvedMarketId ? { token: token!, marketIds: { assetId: assetIdProp, marketId: resolvedMarketId, tokenSymbol: selectedToken.label } } : undefined,
        );

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
        const message =
          error instanceof Error ? error.message : "Transaction failed";
        toast.error(message);
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
      getToken,
      assetIdProp,
      upcomingMaturities,
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
      if (numericAmount * borrowTokenPrice > marketCalcs.availableQuota) return;
      if (marketSelectedCollaterals.length === 0) return;
      if (marketCalcs.totalPortfolioValue === 0) return;
      if (marketCalcs.healthFactor < 1.0) return;

      try {
        const token = await getToken();
        const resolvedMarketId = upcomingMaturities.find(m => m.maturity === marketMaturity)?.marketId;
        const result = await submitMarket(
          {
            tokenValue: selectedToken.value,
            tokenLogo: selectedToken.logo,
            tokenLabel: selectedToken.label,
            amount: numericAmount,
            maturity: marketMaturity,
            collateralTokens: marketSelectedCollaterals,
            autoRollover: autoRefinance,
            editingPosition: editingPosition ?? undefined,
          },
          assetIdProp && resolvedMarketId ? { token: token!, marketIds: { assetId: assetIdProp, marketId: resolvedMarketId, tokenSymbol: selectedToken.label } } : undefined,
        );

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
        const message =
          error instanceof Error ? error.message : "Transaction failed";
        toast.error(message);
      }
    },
    [
      marketAmountInput,
      marketMaturity,
      marketSelectedCollaterals,
      marketCalcs,
      isPending,
      selectedToken,
      getToken,
      assetIdProp,
      upcomingMaturities,
      submitMarket,
      editingPosition,
      onUpdate,
    ]
  );

  const handleLimitMaxClick = useCallback(() => {
    const maxAmount = borrowTokenPrice > 0 ? Math.max(0, limitCalcs.availableQuota / borrowTokenPrice) : 0;
    limitAmountInput.setMax(maxAmount);
  }, [limitCalcs.availableQuota, limitAmountInput, borrowTokenPrice]);

  const handleMarketMaxClick = useCallback(() => {
    const maxAmount = borrowTokenPrice > 0 ? Math.max(0, marketCalcs.availableQuota / borrowTokenPrice) : 0;
    marketAmountInput.setMax(maxAmount);
  }, [marketCalcs.availableQuota, marketAmountInput, borrowTokenPrice]);

  return {
    selectedToken,
    portfolio,
    totalDebt,
    collateralStatus,
    collateralTokenList,
    portfolioLoading,
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
    limitTransactionFee,
    limitAmountToPay,
    limitFutureAmount,
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
    marketTransactionFee,
    marketAmountToPay,
    marketFutureAmount,
    userHealthFactor,
    autoRefinance,
    setAutoRefinance,
    showSuccessDialog,
    setShowSuccessDialog,
    successAmount,
    successTokenSymbol,
    isPending,
    availableMaturities,
    borrowTokenPrice,
  };
}
