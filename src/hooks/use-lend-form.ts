"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  formatNumberWithSeparator,
  calculateFutureAmount,
  getTokenPrice,
} from "@/lib/utils";
import {
  getDefaultMaturityTimestamp,
  getAvailableMaturityTimestamps,
  formatMaturityTimestamp,
  normalizeMaturity,
} from "@/lib/maturity";
import { useSubmitLend } from "@/hooks/use-submit-lend";
import { useAmountInput } from "@/hooks/use-amount-input";
import { useTokenFromList } from "@/hooks/use-token-from-list";
import { useAuthToken } from "@/hooks/use-auth-token";
import { useMyAssets } from "@/hooks/use-my-assets";
import { useMarketDetail } from "@/hooks/use-market-detail";
import { useOrderbook } from "@/hooks/use-orderbook";
import { useTransactionFees } from "@/hooks/use-transaction-fees";
import { useSuccessDialog } from "@/hooks/use-success-dialog";
import type { LendPosition } from "@/types/positions";
import type { TokenOption } from "@/types";

export interface UseLendFormParams {
  tokenList: TokenOption[];
  selectedTokenProp?: TokenOption;
  editingPosition?: LendPosition;
  onUpdate?: (updatedPosition: LendPosition) => void;
  maturityOptions?: number[];
  assetId?: string;
}

export function useLendForm({
  tokenList,
  selectedTokenProp,
  editingPosition,
  onUpdate,
  maturityOptions,
  assetId: assetIdProp,
}: UseLendFormParams) {
  const { upcomingMaturities } = useMarketDetail(assetIdProp);
  const { borrowOrders } = useOrderbook({ assetId: assetIdProp });
  const { authFetch } = useAuthToken();
  const { submitLimit, submitMarket, isPending } = useSubmitLend();
  const { selectedToken, setSelectedToken } = useTokenFromList(
    tokenList,
    selectedTokenProp,
    "usdc"
  );

  const { assets: myAssets } = useMyAssets({ limit: 100 });

  // Portfolio balance for the selected token (already net of locked amounts)
  const portfolioBalance = useMemo(() => {
    const asset = myAssets.find(
      (a) => a.symbol.toLowerCase() === selectedToken.value.toLowerCase(),
    );
    return asset?.walletBalance ?? 0;
  }, [myAssets, selectedToken.value]);

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
  const [marketMaturity, setMarketMaturity] = useState(defaultMaturity);

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

  const [autoRollover, setAutoRollover] = useState(true);
  const {
    showSuccessDialog,
    setShowSuccessDialog,
    successAmount,
    successTokenSymbol,
    setSuccess,
  } = useSuccessDialog();

  const getTokenInfo = useCallback((value: string) => {
    const asset = myAssets.find(
      (a) => a.symbol.toLowerCase() === value.toLowerCase(),
    );
    if (!asset) return undefined;
    const price = getTokenPrice(asset.amountInUsd, asset.walletBalance);
    return { value: asset.symbol.toLowerCase(), label: asset.name, price };
  }, [myAssets]);

  const getAvailableBalance = useCallback((): number => {
    return portfolioBalance;
  }, [portfolioBalance]);

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
  const limitFees = useTransactionFees(limitNumericAmount, "limit");
  const limitTargetAPRNumeric =
    parseFloat(limitTargetAPR.replace(/,/g, ".")) || 0;
  const limitFutureAmount = calculateFutureAmount(
    limitNumericAmount,
    limitTargetAPRNumeric,
    limitMaturity
  );

  const marketNumericAmount = parseFloat(marketAmountInput.amount) || 0;
  const marketFees = useTransactionFees(marketNumericAmount, "market");
  const bestLendRate = (borrowOrders[0]?.apr ?? 0) * 100;
  const marketFutureAmount = calculateFutureAmount(
    marketNumericAmount,
    bestLendRate,
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

        const resolvedMarketId = upcomingMaturities.find(m => m.maturity === limitMaturity)?.marketId;
        const result = await authFetch(async (token) => submitLimit(
          {
            tokenValue: selectedToken.value,
            tokenLogo: selectedToken.logo,
            tokenLabel: selectedToken.label,
            amount: numericAmount,
            amountInUsd,
            targetApr: aprDecimal,
            maturity: limitMaturity,
            autoRollover,
            editingPosition: editingPosition ?? undefined,
          },
          assetIdProp && resolvedMarketId ? { token, marketIds: { assetId: assetIdProp, marketId: resolvedMarketId, tokenSymbol: selectedToken.label } } : undefined,
        ));

        if (editingPosition && onUpdate) {
          onUpdate(result);
          return;
        }

        limitAmountInput.reset();
        setLimitTargetAPR("");
        setSuccess(
          formatNumberWithSeparator(numericAmount),
          selectedToken.label.toUpperCase().slice(0, 4),
        );
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
      autoRollover,
      isPending,
      selectedToken,
      getTokenInfo,
      authFetch,
      assetIdProp,
      upcomingMaturities,
      submitLimit,
      editingPosition,
      onUpdate,
      setSuccess,
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

        const resolvedMarketId = upcomingMaturities.find(m => m.maturity === marketMaturity)?.marketId;
        const result = await authFetch(async (token) => submitMarket(
          {
            tokenValue: selectedToken.value,
            tokenLogo: selectedToken.logo,
            tokenLabel: selectedToken.label,
            amount: numericAmount,
            amountInUsd,
            maturity: marketMaturity,
            editingPosition: editingPosition ?? undefined,
          },
          assetIdProp && resolvedMarketId ? { token, marketIds: { assetId: assetIdProp, marketId: resolvedMarketId, tokenSymbol: selectedToken.label } } : undefined,
        ));

        if (editingPosition && onUpdate) {
          onUpdate(result);
          return;
        }

        marketAmountInput.reset();
        setSuccess(
          formatNumberWithSeparator(numericAmount),
          selectedToken.label.toUpperCase().slice(0, 4),
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Transaction failed";
        toast.error(message);
      }
    },
    [
      marketAmountInput,
      marketMaturity,
      isPending,
      selectedToken,
      getTokenInfo,
      authFetch,
      assetIdProp,
      upcomingMaturities,
      submitMarket,
      editingPosition,
      onUpdate,
      setSuccess,
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
    limitSettlementFee: limitFees.settlementFee,
    limitTradeFee: limitFees.tradeFee,
    limitTotalFee: limitFees.totalFee,
    limitTransactionFee: limitFees.totalFee,
    limitAmountToPay: limitFees.amountToPay,
    limitFutureAmount,
    marketAmount: marketAmountInput.amount,
    marketDisplayAmount: marketAmountInput.displayAmount,
    marketMaturity,
    setMarketMaturity,
    handleMarketAmountChange: marketAmountInput.handleChange,
    handleMarketSubmit,
    marketSettlementFee: marketFees.settlementFee,
    marketTradeFee: marketFees.tradeFee,
    marketTotalFee: marketFees.totalFee,
    marketTransactionFee: marketFees.totalFee,
    marketAmountToPay: marketFees.amountToPay,
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
    availableMaturities,
    formatMaturityTimestamp,
  };
}
