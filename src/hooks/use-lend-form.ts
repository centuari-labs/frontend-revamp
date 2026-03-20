"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  formatNumberWithSeparator,
  calculateFutureAmount,
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
  const { getToken } = useAuthToken();
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
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successAmount, setSuccessAmount] = useState("");
  const [successTokenSymbol, setSuccessTokenSymbol] = useState("");

  const getTokenInfo = useCallback((value: string) => {
    const asset = myAssets.find(
      (a) => a.symbol.toLowerCase() === value.toLowerCase(),
    );
    if (!asset) return undefined;
    const price =
      asset.amountInUsd > 0 && asset.walletBalance > 0
        ? asset.amountInUsd / asset.walletBalance
        : 0;
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

  // Fee constants (must mirror matching engine / backend)
  const SETTLEMENT_FEE_BPS = 1; // 0.01%
  const SETTLEMENT_FEE_MAX_USD = 0.05;
  const MAKER_FEE_BPS = 10; // 0.1%
  const TAKER_FEE_BPS = 20; // 0.2%

  const limitNumericAmount = parseFloat(limitAmountInput.amount) || 0;
  const limitSettlementFee = Math.min(limitNumericAmount * (SETTLEMENT_FEE_BPS / 10000), SETTLEMENT_FEE_MAX_USD);
  const limitTradeFee = limitNumericAmount * (MAKER_FEE_BPS / 10000);
  const limitTotalFee = limitSettlementFee + limitTradeFee;
  const limitTransactionFee = limitTotalFee;
  const limitAmountToPay = limitNumericAmount + limitTotalFee;
  const limitTargetAPRNumeric =
    parseFloat(limitTargetAPR.replace(/,/g, ".")) || 0;
  const limitFutureAmount = calculateFutureAmount(
    limitNumericAmount,
    limitTargetAPRNumeric,
    limitMaturity
  );

  const marketNumericAmount = parseFloat(marketAmountInput.amount) || 0;
  const marketSettlementFee = Math.min(marketNumericAmount * (SETTLEMENT_FEE_BPS / 10000), SETTLEMENT_FEE_MAX_USD);
  const marketTradeFee = marketNumericAmount * (TAKER_FEE_BPS / 10000);
  const marketTotalFee = marketSettlementFee + marketTradeFee;
  const marketTransactionFee = marketTotalFee;
  const marketAmountToPay = marketNumericAmount + marketTotalFee;
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

        const token = await getToken();
        const resolvedMarketId = upcomingMaturities.find(m => m.maturity === limitMaturity)?.marketId;
        const result = await submitLimit(
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
      autoRollover,
      isPending,
      selectedToken,
      getTokenInfo,
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

      const tokenInfo = getTokenInfo(selectedToken.value);
      if (!tokenInfo) return;

      try {
        const amountInUsd = numericAmount * tokenInfo.price;

        const token = await getToken();
        const resolvedMarketId = upcomingMaturities.find(m => m.maturity === marketMaturity)?.marketId;
        const result = await submitMarket(
          {
            tokenValue: selectedToken.value,
            tokenLogo: selectedToken.logo,
            tokenLabel: selectedToken.label,
            amount: numericAmount,
            amountInUsd,
            maturity: marketMaturity,
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
      isPending,
      selectedToken,
      getTokenInfo,
      getToken,
      assetIdProp,
      upcomingMaturities,
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
    limitSettlementFee,
    limitTradeFee,
    limitTotalFee,
    limitTransactionFee,
    limitAmountToPay,
    limitFutureAmount,
    marketAmount: marketAmountInput.amount,
    marketDisplayAmount: marketAmountInput.displayAmount,
    marketMaturity,
    setMarketMaturity,
    handleMarketAmountChange: marketAmountInput.handleChange,
    handleMarketSubmit,
    marketSettlementFee,
    marketTradeFee,
    marketTotalFee,
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
    availableMaturities,
    formatMaturityTimestamp,
  };
}
