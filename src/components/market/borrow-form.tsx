"use client";

import { useState, useEffect, useRef } from "react";
import { CentuariInput } from "@/components/centuari-input";
import { CentuariTooltip } from "@/components/centuari-tooltip";
import HealthFactor from "@/components/centuari-health-factor";
import { MaturityToggle } from "@/components/maturity-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, Loader2 } from "lucide-react";
import Image from "next/image";
import { MultiSelect } from "../ui/multi-select";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Link from "next/link";
import { formatNumberWithSeparator, parseNumberFromSeparator, formatCurrency } from "@/lib/utils";
import {
  getDefaultMaturityTimestamp,
  getAvailableMaturityTimestamps,
  formatMaturityTimestamp,
  normalizeMaturity,
} from "@/lib/maturity";
import { tokenList as portfolioTokenList, defaultPortfolio, getLiquidationThreshold } from "@/lib/portfolio-data";
import { useSubmitBorrow } from "@/hooks/use-submit-borrow";
import type { BorrowPosition } from "@/types/positions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import { CentuariTypography } from "@/components/centuari-typography";

interface TokenOption {
  logo: string;
  value: string;
  label: string;
}

interface BorrowFormProps {
  tokenList: TokenOption[];
  selectedToken?: TokenOption;
  editingPosition?: BorrowPosition;
  onUpdate?: (updatedPosition: BorrowPosition) => void;
}

export function BorrowForm({ tokenList, selectedToken: selectedTokenProp, editingPosition, onUpdate }: BorrowFormProps) {
  const { submitLimit, submitMarket, isPending } = useSubmitBorrow();

  // State for selected token (use prop if provided, otherwise default to USDT)
  const [selectedToken, setSelectedToken] = useState<TokenOption>(() => {
    if (selectedTokenProp) {
      return selectedTokenProp;
    }
    return tokenList.find(t => t.value === "usdt") || tokenList[0] || { logo: "/tokens/centuari-usdt.png", value: "usdt", label: "USDT" };
  });

  // Update selectedToken when prop changes
  useEffect(() => {
    if (selectedTokenProp) {
      setSelectedToken(selectedTokenProp);
    }
  }, [selectedTokenProp]);

  // Pre-fill fields if editingPosition is provided
  useEffect(() => {
    if (editingPosition) {
      // Convert APR decimal to percentage
      const aprPercent = ((editingPosition.apr ?? 0) * 100).toFixed(1).replace(".", ",");

      // Set token
      const token = tokenList.find(t => t.value === editingPosition.tokenValue);
      if (token) {
        setSelectedToken(token);
      }

      // Set order type specific fields
      if (editingPosition.orderType === "limit") {
        setLimitAmount(editingPosition.amount.toString());
        setLimitDisplayAmount(formatNumberWithSeparator(editingPosition.amount.toString()));
        setLimitTargetAPR(aprPercent);
        setLimitMaturity(normalizeMaturity(editingPosition.maturity));
        setLimitSelectedCollaterals(editingPosition.collateralTokens || []);
      } else {
        setMarketAmount(editingPosition.amount.toString());
        setMarketDisplayAmount(formatNumberWithSeparator(editingPosition.amount.toString()));
        setMarketMaturity(normalizeMaturity(editingPosition.maturity));
        setMarketSelectedCollaterals(editingPosition.collateralTokens || []);
      }
    }
  }, [editingPosition, tokenList]);

  // State for limit order
  const [limitAmount, setLimitAmount] = useState<string>("");
  const [limitDisplayAmount, setLimitDisplayAmount] = useState<string>("");
  const [limitMaturity, setLimitMaturity] = useState<number>(() => getDefaultMaturityTimestamp());
  const [limitTargetAPR, setLimitTargetAPR] = useState<string>("");
  const [limitSelectedCollaterals, setLimitSelectedCollaterals] = useState<string[]>([]);

  // State for market order
  const [marketAmount, setMarketAmount] = useState<string>("");
  const [marketDisplayAmount, setMarketDisplayAmount] = useState<string>("");
  const [marketMaturity, setMarketMaturity] = useState<number>(() => getDefaultMaturityTimestamp());
  const [marketSelectedCollaterals, setMarketSelectedCollaterals] = useState<string[]>([]);

  // State for Auto refinance (shared across Limit and Market tabs)
  const [autoRefinance, setAutoRefinance] = useState<boolean>(true);

  // Ref for maturity select to calculate dynamic padding
  const maturitySelectRef = useRef<HTMLButtonElement | null>(null);
  const [maturitySelectPadding, setMaturitySelectPadding] = useState<number>(88);

  // Update padding when maturity select width changes
  useEffect(() => {
    const updatePadding = () => {
      if (!maturitySelectRef.current) return;
      const rect = maturitySelectRef.current.getBoundingClientRect();
      // +16px untuk gap yang lebih besar antara select dan input text agar tidak overlap
      setMaturitySelectPadding(rect.width + 16);
    };

    // Initial calculation
    const timeoutId = setTimeout(updatePadding, 0);

    const observer = new ResizeObserver(() => {
      updatePadding();
    });

    if (maturitySelectRef.current) {
      observer.observe(maturitySelectRef.current);
    }

    // Also update when maturity value changes
    updatePadding();

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [limitMaturity]); // Re-calculate when maturity changes

  // State for portfolio, total debt, and collateral status
  const [portfolio, setPortfolio] = useState<Record<string, number>>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("centuari_portfolio");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return defaultPortfolio;
        }
      }
    }
    return defaultPortfolio;
  });

  const [totalDebt, setTotalDebt] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("centuari_total_debt");
      if (stored) {
        try {
          const parsed = parseFloat(stored);
          return !isNaN(parsed) && parsed > 0 ? parsed : 80000;
        } catch {
          return 80000;
        }
      }
    }
    return 80000;
  });

  const [collateralStatus, setCollateralStatus] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("centuari_collateral");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return {};
        }
      }
    }
    return {};
  });

  // State for success dialog
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successAmount, setSuccessAmount] = useState<string>("");
  const [successTokenSymbol, setSuccessTokenSymbol] = useState<string>("");

  // Auto-select collateral tokens when collateral status changes
  useEffect(() => {
    if (!editingPosition) {
      // Auto-select all tokens that are set as collateral
      const autoSelected = portfolioTokenList
        .filter(token =>
          portfolio[token.value] &&
          portfolio[token.value] > 0 &&
          collateralStatus[token.value] === true
        )
        .map(token => token.value);

      // Only auto-select if no collateral is currently selected
      if (limitSelectedCollaterals.length === 0) {
        setLimitSelectedCollaterals(autoSelected);
      }
      if (marketSelectedCollaterals.length === 0) {
        setMarketSelectedCollaterals(autoSelected);
      }
    }
  }, [collateralStatus, portfolio, editingPosition, limitSelectedCollaterals.length, marketSelectedCollaterals.length]);

  // Sync portfolio, total debt, and collateral status from localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      if (typeof window !== "undefined") {
        const storedPortfolio = localStorage.getItem("centuari_portfolio");
        if (storedPortfolio) {
          try {
            const newPortfolio = JSON.parse(storedPortfolio);
            // Use functional setState to avoid stale closure issues
            setPortfolio((prevPortfolio) => {
              const portfolioStr = JSON.stringify(newPortfolio);
              const currentPortfolioStr = JSON.stringify(prevPortfolio);
              if (portfolioStr !== currentPortfolioStr) {
                return newPortfolio;
              }
              return prevPortfolio;
            });
          } catch { }
        }

        const storedDebt = localStorage.getItem("centuari_total_debt");
        if (storedDebt) {
          try {
            const parsed = parseFloat(storedDebt);
            if (!isNaN(parsed)) {
              setTotalDebt((prevDebt) => {
                if (parsed !== prevDebt) {
                  return parsed;
                }
                return prevDebt;
              });
            }
          } catch { }
        }

        const storedCollateral = localStorage.getItem("centuari_collateral");
        if (storedCollateral) {
          try {
            const newCollateralStatus = JSON.parse(storedCollateral);
            // Use functional setState to avoid stale closure issues
            setCollateralStatus((prevCollateralStatus) => {
              const collateralStr = JSON.stringify(newCollateralStatus);
              const currentCollateralStr = JSON.stringify(prevCollateralStatus);
              if (collateralStr !== currentCollateralStr) {
                return newCollateralStatus;
              }
              return prevCollateralStatus;
            });
          } catch { }
        }
      }
    };

    // Only listen to storage events from other tabs/windows
    // Remove interval polling to prevent infinite loops
    window.addEventListener("storage", handleStorageChange);

    // Also listen to custom events from same-tab updates
    window.addEventListener("centuari-positions-updated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("centuari-positions-updated", handleStorageChange);
    };
  }, []); // Empty dependency array - only run on mount/unmount

  // Helper function to calculate health factor for given amount and collaterals
  const calculateHealthFactor = (amount: number, collaterals: string[]) => {
    if (amount <= 0 || collaterals.length === 0) return 0;

    const totalPortfolioValue = collaterals.reduce((total, collateralValue) => {
      const portfolioValue = portfolio[collateralValue] || 0;
      return total + portfolioValue;
    }, 0);

    if (totalPortfolioValue === 0) return 0;

    const weightedLT = collaterals.reduce((sum, collateralValue) => {
      const token = portfolioTokenList.find(t => t.value === collateralValue);
      const portfolioValue = portfolio[collateralValue] || 0;
      if (token && portfolioValue > 0) {
        const lt = getLiquidationThreshold(token);
        return sum + (lt * portfolioValue);
      }
      return sum;
    }, 0) / totalPortfolioValue;

    const newTotalDebt = totalDebt + amount;
    const healthFactor = (totalPortfolioValue * weightedLT) / newTotalDebt;
    return Math.min(healthFactor, 10);
  };

  // Helper function to get health factor percentage
  const getHealthFactorPercentage = (healthFactor: number) => {
    if (healthFactor <= 0) return 0;
    if (healthFactor >= 2.5) return 100;
    if (healthFactor >= 1.5) return 75 + ((healthFactor - 1.5) / 1.0) * 25;
    if (healthFactor >= 1.2) return 50 + ((healthFactor - 1.2) / 0.3) * 25;
    if (healthFactor >= 1.0) return 25 + ((healthFactor - 1.0) / 0.2) * 25;
    return (healthFactor / 1.0) * 25;
  };

  // Calculate values for limit order
  const limitNumericAmount = parseFloat(limitAmount) || 0;
  const limitHealthFactor = calculateHealthFactor(limitNumericAmount, limitSelectedCollaterals);
  const limitHealthFactorPercentage = getHealthFactorPercentage(limitHealthFactor);

  // Calculate values for market order
  const marketNumericAmount = parseFloat(marketAmount) || 0;
  const marketHealthFactor = calculateHealthFactor(marketNumericAmount, marketSelectedCollaterals);
  const marketHealthFactorPercentage = getHealthFactorPercentage(marketHealthFactor);

  // Calculate available quota for limit order
  const limitTotalPortfolioValue = limitSelectedCollaterals.reduce((total, collateralValue) => {
    return total + (portfolio[collateralValue] || 0);
  }, 0);
  const limitWeightedLTV = limitSelectedCollaterals.length > 0 && limitTotalPortfolioValue > 0
    ? limitSelectedCollaterals.reduce((sum, collateralValue) => {
      const token = portfolioTokenList.find(t => t.value === collateralValue);
      const portfolioValue = portfolio[collateralValue] || 0;
      if (token && portfolioValue > 0) {
        return sum + (token.ltv * portfolioValue);
      }
      return sum;
    }, 0) / limitTotalPortfolioValue
    : 0.85;
  const limitMaxBorrowCapacity = limitTotalPortfolioValue * limitWeightedLTV;
  const limitAvailableQuota = limitMaxBorrowCapacity - totalDebt;

  // Calculate available quota for market order
  const marketTotalPortfolioValue = marketSelectedCollaterals.reduce((total, collateralValue) => {
    return total + (portfolio[collateralValue] || 0);
  }, 0);
  const marketWeightedLTV = marketSelectedCollaterals.length > 0 && marketTotalPortfolioValue > 0
    ? marketSelectedCollaterals.reduce((sum, collateralValue) => {
      const token = portfolioTokenList.find(t => t.value === collateralValue);
      const portfolioValue = portfolio[collateralValue] || 0;
      if (token && portfolioValue > 0) {
        return sum + (token.ltv * portfolioValue);
      }
      return sum;
    }, 0) / marketTotalPortfolioValue
    : 0.85;
  const marketMaxBorrowCapacity = marketTotalPortfolioValue * marketWeightedLTV;
  const marketAvailableQuota = marketMaxBorrowCapacity - totalDebt;

  const handleLimitAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = parseNumberFromSeparator(value);
    const formattedValue = formatNumberWithSeparator(numericValue);
    setLimitAmount(numericValue);
    setLimitDisplayAmount(formattedValue);
  };

  const handleMarketAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = parseNumberFromSeparator(value);
    const formattedValue = formatNumberWithSeparator(numericValue);
    setMarketAmount(numericValue);
    setMarketDisplayAmount(formattedValue);
  };

  const handleLimitMaxClick = () => {
    const maxAmount = Math.max(0, limitAvailableQuota);
    const maxAmountStr = maxAmount.toString();
    const formattedMax = formatNumberWithSeparator(maxAmountStr);
    setLimitAmount(maxAmountStr);
    setLimitDisplayAmount(formattedMax);
  };

  const handleMarketMaxClick = () => {
    const maxAmount = Math.max(0, marketAvailableQuota);
    const maxAmountStr = maxAmount.toString();
    const formattedMax = formatNumberWithSeparator(maxAmountStr);
    setMarketAmount(maxAmountStr);
    setMarketDisplayAmount(formattedMax);
  };

  const handleLimitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(limitAmount) || 0;

    if (numericAmount <= 0 || isPending) return;
    if (numericAmount > limitAvailableQuota) return;
    if (limitSelectedCollaterals.length === 0) return;
    if (limitTotalPortfolioValue === 0) return;
    if (limitHealthFactor < 1.0) return;

    try {
      const targetAPRNumeric = parseFloat(limitTargetAPR.replace(/,/g, ".")) || 0;
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
      setLimitAmount("");
      setLimitDisplayAmount("");
      setLimitTargetAPR("");
      setLimitSelectedCollaterals([]);
      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  };

  const handleMarketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(marketAmount) || 0;

    if (numericAmount <= 0 || isPending) return;
    if (numericAmount > marketAvailableQuota) return;
    if (marketSelectedCollaterals.length === 0) return;
    if (marketTotalPortfolioValue === 0) return;
    if (marketHealthFactor < 1.0) return;

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
      setMarketAmount("");
      setMarketDisplayAmount("");
      setMarketSelectedCollaterals([]);
      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  };

  // Auto-close success dialog
  useEffect(() => {
    if (showSuccessDialog) {
      const timer = setTimeout(() => {
        setShowSuccessDialog(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessDialog]);

  // Get available collateral tokens
  const getAvailableCollaterals = () => {
    return portfolioTokenList.filter(token =>
      portfolio[token.value] &&
      portfolio[token.value] > 0 &&
      collateralStatus[token.value] === true
    ).map(token => ({
      logo: token.logo,
      value: token.value,
      label: token.label,
    }));
  };

  // Calculate liquidation threshold for display
  const getLiquidationThresholdDisplay = (collaterals: string[], totalPortfolioValue: number) => {
    if (collaterals.length === 0 || totalPortfolioValue === 0) return 0;
    const weightedLT = collaterals.reduce((sum, collateralValue) => {
      const token = portfolioTokenList.find(t => t.value === collateralValue);
      const portfolioValue = portfolio[collateralValue] || 0;
      if (token && portfolioValue > 0) {
        const lt = getLiquidationThreshold(token);
        return sum + (lt * portfolioValue);
      }
      return sum;
    }, 0) / totalPortfolioValue;
    return weightedLT;
  };

  return (
    <>
      <Tabs
        defaultValue="limit"
        className="w-full p-2 sm:p-3 md:p-3.5 md:h-full md:flex md:flex-col"
      >
        <TabsList className="bg-white/5 w-full rounded-lg md:shrink-0">
          <TabsTrigger
            value="limit"
            className="data-[state=active]:!border-none data-[state=active]:bg-transparent data-[state=active]:text-white text-white/40 rounded-md flex-1 text-xs sm:text-sm"
          >
            Limit
          </TabsTrigger>
          <TabsTrigger
            value="market"
            className="data-[state=active]:!border-none data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/40 rounded-md flex-1 text-xs sm:text-sm"
          >
            Market
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="limit"
          className="md:flex-1 md:min-h-0 md:flex md:flex-col"
        >
          <div className="text-center text-white/60 md:h-full md:flex md:flex-col">
            <form onSubmit={handleLimitSubmit} className="md:h-full md:flex md:flex-col">
              <ScrollArea className="h-auto md:flex-1 md:min-h-0">
                <CentuariInput
                  id="limit-amount"
                  label="Amount to Borrow"
                  size="large"
                  placeholder="1,000"
                  leftIcon={
                    <Image
                      src={selectedToken.logo}
                      alt={selectedToken.label}
                      width={16}
                      height={16}
                      className="w-4 h-4"
                    />
                  }
                  rightIcon={
                    <Button
                      variant={"link"}
                      className="px-0"
                      type="button"
                      onClick={handleLimitMaxClick}
                    >
                      Max
                    </Button>
                  }
                  // balanceText={`Available Quota: ${formatCurrency(limitAvailableQuota)}`}
                  value={limitDisplayAmount}
                  onChange={handleLimitAmountChange}
                  className="mt-0"
                  containerClassName="mt-3.5"
                />
                <div className="mt-3">
                  <Label className="mb-2">Collateral</Label>
                  <div className="mt-1.5">
                    {/* Custom Display for Selected Collaterals */}
                    {limitSelectedCollaterals.length > 0 ? (
                      <div className="flex items-center justify-between gap-3 p-0.5 rounded-md border bg-white/5 hover:bg-white/5">
                        <div className="flex items-center gap-2 flex-1 min-w-0 px-2">
                          {/* Display max 4 token icons */}
                          <div className="flex items-center -space-x-2">
                            {limitSelectedCollaterals.slice(0, 4).map((tokenValue, index) => {
                              const token = portfolioTokenList.find(t => t.value === tokenValue);
                              if (!token) return null;
                              return (
                                <div
                                  key={tokenValue}
                                  className="relative"
                                  style={{ zIndex: 10 - index }}
                                >
                                  <Image
                                    src={token.logo}
                                    alt={token.label}
                                    width={24}
                                    height={24}
                                  />
                                </div>
                              );
                            })}
                          </div>

                          {/* Badge for remaining tokens */}
                          {limitSelectedCollaterals.length > 4 && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  className="flex items-center justify-center px-2.5 py-1 rounded-full bg-blue-600/20 border border-blue-600/30 text-blue-400 text-xs font-medium hover:bg-blue-600/30 transition-colors cursor-pointer"
                                >
                                  {limitSelectedCollaterals.length - 4 === 1
                                    ? "+1 asset"
                                    : `+${limitSelectedCollaterals.length - 4} assets`}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-56 p-3 border-white/10">
                                <div className="flex flex-col gap-2">
                                  <p className="text-xs font-medium text-white/60 mb-1">Additional Assets:</p>
                                  {limitSelectedCollaterals.slice(4).map((tokenValue) => {
                                    const token = portfolioTokenList.find(t => t.value === tokenValue);
                                    if (!token) return null;
                                    return (
                                      <div
                                        key={tokenValue}
                                        className="flex items-center gap-2 py-1"
                                      >
                                        <Image
                                          src={token.logo}
                                          alt={token.label}
                                          width={20}
                                          height={20}
                                          className="rounded-full"
                                        />
                                        <span className="text-sm text-white">{token.label}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>

                        {/* Change Button */}
                        <Link href="/portfolio">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="hover:underline hover:!bg-transparent hover:cursor-pointer"
                          >
                            Change
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      /* MultiSelect for selecting when no collateral selected */
                      <MultiSelect
                        options={getAvailableCollaterals()}
                        onValueChange={(values) => setLimitSelectedCollaterals(values)}
                        placeholder="Select Coins"
                        variant="default"
                        maxCount={4}
                      />
                    )}
                  </div>
                </div>
                <div className="w-full space-y-2 mt-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="limit-target-apr">Target APR</Label>
                  </div>
                  <div className="relative">
                    <Input
                      id="limit-target-apr"
                      type="text"
                      placeholder="12.5"
                      value={limitTargetAPR}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d.,]/g, "");
                        setLimitTargetAPR(value);
                      }}
                      className="peer h-9 text-base bg-[#1a1d24] border-[#2a2e38] focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-search-cancel-button]:appearance-none"
                      style={{ paddingLeft: maturitySelectPadding }}
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center text-muted-foreground">%</span>
                    <div className="absolute inset-y-0 left-1 flex items-center">
                      <Select
                        value={limitMaturity.toString()}
                        onValueChange={(v) => setLimitMaturity(Number(v))}
                      >
                        <SelectTrigger
                          ref={maturitySelectRef}
                          className="!h-7 w-auto border-0 bg-transparent px-2 py-1 focus:ring-0 focus:ring-offset-0 gap-1"
                        >
                          <SelectValue placeholder="Select Maturity" />
                        </SelectTrigger>
                        <SelectContent className="bg-white/5 backdrop-blur-[140px]">
                          <SelectGroup>
                            {getAvailableMaturityTimestamps().map((ts) => (
                              <SelectItem key={ts} value={ts.toString()}>
                                {formatMaturityTimestamp(ts)}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="mt-5">
                  <Checkbox
                    id="limit-auto-refinance"
                    label="Auto refinance"
                    checked={autoRefinance}
                    onCheckedChange={setAutoRefinance}
                  />
                </div>
                <div>
                  <Label className="mb-2 mt-2.5">
                    Health Factor{" "}
                    <CentuariTooltip message="Your health factor indicates the safety of your borrowed position.">
                      <Info size={16} />
                    </CentuariTooltip>
                    <Badge
                      variant={
                        limitHealthFactor === 0 || limitSelectedCollaterals.length === 0 || limitNumericAmount === 0
                          ? "default"
                          : limitHealthFactor >= 2.5
                            ? "success"
                            : limitHealthFactor >= 1.5
                              ? "default"
                              : limitHealthFactor >= 1.2
                                ? "warning"
                                : limitHealthFactor >= 1.0
                                  ? "warning"
                                  : "destructive"
                      }
                    >
                      {(() => {
                        if (limitHealthFactor > 0 && !isNaN(limitHealthFactor) && limitSelectedCollaterals.length > 0 && limitNumericAmount > 0) {
                          const hfDisplay = parseFloat(limitHealthFactor.toFixed(2));
                          let status: string;
                          if (hfDisplay >= 2.5) status = "Excellent";
                          else if (hfDisplay >= 1.5) status = "Good";
                          else if (hfDisplay >= 1.2) status = "Warning";
                          else if (hfDisplay >= 1.0) status = "Critical";
                          else status = "Danger";
                          return `${hfDisplay.toFixed(2)} ~ ${status}`;
                        }
                        return "0.00 ~ Safe";
                      })()}
                    </Badge>
                  </Label>
                  <div className="border border-white/5 rounded-lg mt-2">
                    <div className="h-11 flex items-center justify-center px-4 rounded-lg border-b border-white/5 bg-white/10 z-50">
                      <HealthFactor
                        targetValue={limitHealthFactorPercentage}
                        healthFactor={limitHealthFactor > 0 && !isNaN(limitHealthFactor) ? limitHealthFactor : undefined}
                      />
                    </div>
                    <div className="px-2 py-4 z-20 -mt-2 border-t-0 border-white/5 rounded-b-lg">
                      <p className="text-xs text-muted-foreground text-center">
                        {limitHealthFactor > 0 && !isNaN(limitHealthFactor) && limitSelectedCollaterals.length > 0 && limitNumericAmount > 0 ? (
                          <>
                            If portfolio value drops{" "}
                            <span className="text-white font-medium">
                              below {formatCurrency((totalDebt + limitNumericAmount) / getLiquidationThresholdDisplay(limitSelectedCollaterals, limitTotalPortfolioValue))}
                            </span>
                            , your position could be liquidated.
                          </>
                        ) : (
                          <>Select collateral from portfolio and enter borrow amount to see health factor.</>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
              <Button
                type="submit"
                variant="primary"
                className="w-full mt-3.5 md:shrink-0"
                disabled={
                  isPending ||
                  limitNumericAmount <= 0 ||
                  limitNumericAmount > limitAvailableQuota ||
                  limitSelectedCollaterals.length === 0 ||
                  limitTotalPortfolioValue === 0 ||
                  limitHealthFactor < 1.0
                }
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Borrow"
                )}
              </Button>
            </form>
          </div>
        </TabsContent>

        <TabsContent
          value="market"
          className="md:flex-1 md:min-h-0 md:flex md:flex-col"
        >
          <div className="text-center text-white/60 md:h-full md:flex md:flex-col">
            <form onSubmit={handleMarketSubmit} className="md:h-full md:flex md:flex-col">
              <ScrollArea className="h-auto md:flex-1 md:min-h-0">
                <CentuariInput
                  id="market-amount"
                  label="Amount to Borrow"
                  size="large"
                  placeholder="1,000"
                  leftIcon={
                    <Image
                      src={selectedToken.logo}
                      alt={selectedToken.label}
                      width={16}
                      height={16}
                      className="w-4 h-4"
                    />
                  }
                  rightIcon={
                    <Button
                      variant={"link"}
                      className="px-0"
                      type="button"
                      onClick={handleMarketMaxClick}
                    >
                      Max
                    </Button>
                  }
                  // balanceText={`Available Quota: ${formatCurrency(marketAvailableQuota)}`}
                  value={marketDisplayAmount}
                  onChange={handleMarketAmountChange}
                  className="mt-0"
                  containerClassName="mt-3.5"
                />
                <div className="mt-3">
                  <Label className="mb-2 mt-2.5">Collateral</Label>
                  <div className="mt-1.5">
                    {/* Custom Display for Selected Collaterals */}
                    {marketSelectedCollaterals.length > 0 ? (
                      <div className="flex items-center justify-between gap-3 p-0.5 rounded-md border bg-white/5 hover:bg-white/5">
                        <div className="flex items-center gap-2 flex-1 min-w-0 px-2">
                          {/* Display max 4 token icons */}
                          <div className="flex items-center -space-x-2">
                            {marketSelectedCollaterals.slice(0, 4).map((tokenValue, index) => {
                              const token = portfolioTokenList.find(t => t.value === tokenValue);
                              if (!token) return null;
                              return (
                                <div
                                  key={tokenValue}
                                  className="relative"
                                  style={{ zIndex: 10 - index }}
                                >
                                  <Image
                                    src={token.logo}
                                    alt={token.label}
                                    width={24}
                                    height={24}
                                  />
                                </div>
                              );
                            })}
                          </div>

                          {/* Badge for remaining tokens */}
                          {marketSelectedCollaterals.length > 4 && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  className="flex items-center justify-center px-2.5 py-1 rounded-full bg-blue-600/20 border border-blue-600/30 text-blue-400 text-xs font-medium hover:bg-blue-600/30 transition-colors cursor-pointer"
                                >
                                  {marketSelectedCollaterals.length - 4 === 1
                                    ? "+1 asset"
                                    : `+${marketSelectedCollaterals.length - 4} assets`}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-56 p-3 border-white/10">
                                <div className="flex flex-col gap-2">
                                  <p className="text-xs font-medium text-white/60 mb-1">Additional Assets:</p>
                                  {marketSelectedCollaterals.slice(4).map((tokenValue) => {
                                    const token = portfolioTokenList.find(t => t.value === tokenValue);
                                    if (!token) return null;
                                    return (
                                      <div
                                        key={tokenValue}
                                        className="flex items-center gap-2 py-1"
                                      >
                                        <Image
                                          src={token.logo}
                                          alt={token.label}
                                          width={20}
                                          height={20}
                                          className="rounded-full"
                                        />
                                        <span className="text-sm text-white">{token.label}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>

                        {/* Change Button */}
                        <Link href="/portfolio">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="hover:underline hover:!bg-transparent hover:cursor-pointer"
                          >
                            Change
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      /* MultiSelect for selecting when no collateral selected */
                      <MultiSelect
                        options={getAvailableCollaterals()}
                        onValueChange={(values) => setMarketSelectedCollaterals(values)}
                        placeholder="Select Coins"
                        variant="default"
                        maxCount={4}
                      />
                    )}
                  </div>
                </div>
                <div>
                  <Label className="mb-2 mt-3.5">
                    Maturity{" "}
                    <CentuariTooltip message="Maturity is the duration for which you want to borrow assets.">
                      <Info size={16} />
                    </CentuariTooltip>
                  </Label>
                  <MaturityToggle
                    value={marketMaturity}
                    onValueChange={setMarketMaturity}
                  />
                </div>
                <div className="mt-5">
                  <Checkbox
                    id="market-auto-refinance"
                    label="Auto refinance"
                    checked={autoRefinance}
                    onCheckedChange={setAutoRefinance}
                  />
                </div>
                <div>
                  <Label className="mb-2 mt-2.5">
                    Health Factor{" "}
                    <CentuariTooltip message="Your health factor indicates the safety of your borrowed position.">
                      <Info size={16} />
                    </CentuariTooltip>
                    <Badge
                      variant={
                        marketHealthFactor === 0 || marketSelectedCollaterals.length === 0 || marketNumericAmount === 0
                          ? "default"
                          : marketHealthFactor >= 2.5
                            ? "success"
                            : marketHealthFactor >= 1.5
                              ? "default"
                              : marketHealthFactor >= 1.2
                                ? "warning"
                                : marketHealthFactor >= 1.0
                                  ? "warning"
                                  : "destructive"
                      }
                    >
                      {(() => {
                        if (marketHealthFactor > 0 && !isNaN(marketHealthFactor) && marketSelectedCollaterals.length > 0 && marketNumericAmount > 0) {
                          const hfDisplay = parseFloat(marketHealthFactor.toFixed(2));
                          let status: string;
                          if (hfDisplay >= 2.5) status = "Excellent";
                          else if (hfDisplay >= 1.5) status = "Good";
                          else if (hfDisplay >= 1.2) status = "Warning";
                          else if (hfDisplay >= 1.0) status = "Critical";
                          else status = "Danger";
                          return `${hfDisplay.toFixed(2)} ~ ${status}`;
                        }
                        return "0.00 ~ Safe";
                      })()}
                    </Badge>
                  </Label>
                  <div className="border border-white/5 rounded-lg mt-2">
                    <div className="h-11 flex items-center justify-center px-4 rounded-lg border-b border-white/5 bg-white/10 z-50">
                      <HealthFactor
                        targetValue={marketHealthFactorPercentage}
                        healthFactor={marketHealthFactor > 0 && !isNaN(marketHealthFactor) ? marketHealthFactor : undefined}
                      />
                    </div>
                    <div className="px-2 py-4 z-20 -mt-2 border-t-0 border-white/5 rounded-b-lg">
                      <p className="text-xs text-muted-foreground text-center">
                        {marketHealthFactor > 0 && !isNaN(marketHealthFactor) && marketSelectedCollaterals.length > 0 && marketNumericAmount > 0 ? (
                          <>
                            If portfolio value drops{" "}
                            <span className="text-white font-medium">
                              below {formatCurrency((totalDebt + marketNumericAmount) / getLiquidationThresholdDisplay(marketSelectedCollaterals, marketTotalPortfolioValue))}
                            </span>
                            , your position could be liquidated.
                          </>
                        ) : (
                          <>Select collateral from portfolio and enter borrow amount to see health factor.</>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
              <Button
                type="submit"
                variant="primary"
                className="w-full mt-3.5 md:shrink-0"
                disabled={
                  isPending ||
                  marketNumericAmount <= 0 ||
                  marketNumericAmount > marketAvailableQuota ||
                  marketSelectedCollaterals.length === 0 ||
                  marketTotalPortfolioValue === 0 ||
                  marketHealthFactor < 1.0
                }
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Borrow"
                )}
              </Button>
            </form>
          </div>
        </TabsContent>
      </Tabs>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="flex max-h-[min(600px,80vh)] flex-col gap-0 p-0 sm:max-w-md data-[state=open]:!zoom-in-0 data-[state=open]:duration-600">
          <DialogHeader className="contents space-y-0 text-left">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
              <div className="absolute w-[568px] h-[450px] -top-72 left-0 bg-primary-blue-base/50 blur-[264px] opacity-100 transition-opacity duration-500" />
              <div className="absolute w-[150px] h-[216px] -top-60 left-1/3 bg-white blur-3xl opacity-100 transition-opacity duration-500" />
            </div>
            <div className="mt-6 px-6 flex items-center justify-center flex-col gap-4 pb-6">
              <Image
                src="/assets/tx-success.png"
                alt="Success"
                width={116}
                height={124}
              />
              <CentuariTypography className="text-2xl font-semibold">
                Borrow Successful!
              </CentuariTypography>
              <CentuariTypography className="text-center text-muted-foreground">
                {successAmount ? (
                  <>
                    You have successfully borrowed {successAmount} {successTokenSymbol} from
                    the vault.
                  </>
                ) : (
                  <>Your {successTokenSymbol} borrow has been completed successfully.</>
                )}
              </CentuariTypography>
              <div className="flex items-center gap-2 text-muted-foreground mt-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Closing...</span>
              </div>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}