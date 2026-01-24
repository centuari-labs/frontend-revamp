"use client";

import { useState } from "react";
import { CentuariInput } from "@/components/centuari-input";
import { CentuariTooltip } from "@/components/centuari-tooltip";
import { CentuariTypography } from "@/components/centuari-typography";
import { TransactionSummary } from "@/components/market/transaction-summary";
import { MaturityToggle } from "@/components/maturity-toggle";
import { SelectMaturity } from "@/components/select-maturity";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info } from "lucide-react";
import * as React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { formatNumberWithSeparator, parseNumberFromSeparator, formatCurrency, formatDate, parseDateString, calculateDaysDifference } from "@/lib/utils";
import { tokenList as portfolioTokenList, defaultPortfolio } from "@/lib/portfolio-data";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";

interface TokenOption {
  logo: string;
  value: string;
  label: string;
}

interface LendPosition {
  id: string;
  assetImg: string;
  assetName: string;
  amount: number;
  apy: number;
  type: "lend";
  tokenValue: string;
  tokenSymbol: string;
  maturity: string;
  status: "pending" | "processing" | "success" | "failed";
  createdAt: string;
  timestamp: number;
  orderType?: "limit" | "market";
}

interface LendFormProps {
  tokenList: TokenOption[];
  selectedToken?: TokenOption;
  editingPosition?: LendPosition;
  onUpdate?: (updatedPosition: LendPosition) => void;
}

export function LendForm({ tokenList, selectedToken: selectedTokenProp, editingPosition, onUpdate }: LendFormProps) {
  // State for limit order
  const [limitAmount, setLimitAmount] = useState<string>("");
  const [limitDisplayAmount, setLimitDisplayAmount] = useState<string>("");
  const [limitMaturity, setLimitMaturity] = useState<string>("1 Feb 2026");
  const [limitTargetAPY, setLimitTargetAPY] = useState<string>("");

  // State for market order
  const [marketAmount, setMarketAmount] = useState<string>("");
  const [marketDisplayAmount, setMarketDisplayAmount] = useState<string>("");
  const [marketMaturity, setMarketMaturity] = useState<string>("1 Jan 2026");

  // Ref for maturity select to calculate dynamic padding
  const maturitySelectRef = React.useRef<HTMLButtonElement | null>(null);
  const [maturitySelectPadding, setMaturitySelectPadding] = React.useState<number>(88);

  // Update padding when maturity select width changes
  React.useEffect(() => {
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

  // State for selected token (use prop if provided, otherwise default to USDC)
  const [selectedToken, setSelectedToken] = useState<TokenOption>(() => {
    if (selectedTokenProp) {
      return selectedTokenProp;
    }
    return tokenList.find(t => t.value === "usdc") || tokenList[0] || { logo: "/tokens/usdc-icon.svg", value: "usdc", label: "USDC" };
  });

  // Update selectedToken when prop changes
  React.useEffect(() => {
    if (selectedTokenProp) {
      setSelectedToken(selectedTokenProp);
    }
  }, [selectedTokenProp]);

  // Pre-fill fields if editingPosition is provided
  React.useEffect(() => {
    if (editingPosition) {
      const tokenInfo = getTokenInfo(editingPosition.tokenValue);
      if (tokenInfo) {
        // Convert USD amount back to token amount
        const tokenAmount = editingPosition.amount / tokenInfo.price;
        const amountStr = tokenAmount.toString();
        const formattedAmount = formatNumberWithSeparator(amountStr);

        // Convert APY decimal to percentage
        const apyPercent = (editingPosition.apy * 100).toFixed(1).replace(".", ",");

        // Set token
        const token = tokenList.find(t => t.value === editingPosition.tokenValue);
        if (token) {
          setSelectedToken(token);
        }

        // Set order type specific fields
        if (editingPosition.orderType === "limit") {
          setLimitAmount(amountStr);
          setLimitDisplayAmount(formattedAmount);
          setLimitTargetAPY(apyPercent);
          setLimitMaturity(editingPosition.maturity);
        } else {
          setMarketAmount(amountStr);
          setMarketDisplayAmount(formattedAmount);
          setMarketMaturity(editingPosition.maturity);
        }
      }
    }
  }, [editingPosition, tokenList]);

  // State for processing and success
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successAmount, setSuccessAmount] = useState<string>("");
  const [successTokenSymbol, setSuccessTokenSymbol] = useState<string>("");

  // Get token info from portfolio data
  const getTokenInfo = (value: string) => {
    return portfolioTokenList.find(t => t.value === value);
  };

  // Get portfolio balance for selected token
  const getAvailableBalance = (): number => {
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
  };

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

  // Calculate transaction values for limit order
  const limitNumericAmount = parseFloat(limitAmount) || 0;
  const limitTransactionFee = limitNumericAmount * 0.0001; // 0.01%
  const limitAmountToPay = limitNumericAmount + limitTransactionFee;
  const limitTargetAPYNumeric = parseFloat(limitTargetAPY.replace(/,/g, ".")) || 0;

  // Calculate future amount based on new formula:
  // Amount + (Amount * Rate/365 * days)
  // where days = (Maturity Date - (Current Date + 1))
  const calculateLimitFutureAmount = () => {
    if (limitNumericAmount <= 0 || limitTargetAPYNumeric <= 0) return 0;

    // Current date + 1 day
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 1);

    // Parse maturity date
    const maturityDateObj = parseDateString(limitMaturity);
    if (!maturityDateObj) return limitNumericAmount;

    // Calculate days difference
    const days = calculateDaysDifference(currentDate, maturityDateObj);
    if (days <= 0) return limitNumericAmount;

    // Calculate future amount: Amount + (Amount * Rate/365 * days)
    const futureAmount = limitNumericAmount + (limitNumericAmount * (limitTargetAPYNumeric / 100) / 365 * days);
    return futureAmount;
  };

  const limitFutureAmount = calculateLimitFutureAmount();

  // Calculate transaction values for market order (using average APY)
  const marketNumericAmount = parseFloat(marketAmount) || 0;
  const marketTransactionFee = marketNumericAmount * 0.0001; // 0.01%
  const marketAmountToPay = marketNumericAmount + marketTransactionFee;
  // Market APY is determined by market (using average of 4.5-7.5% range)
  const marketAPY = 6.0; // Average market APY (can be dynamic from order book)

  // Calculate future amount based on new formula:
  // Amount + (Amount * Rate/365 * days)
  // where days = (Maturity Date - (Current Date + 1))
  const calculateMarketFutureAmount = () => {
    if (marketNumericAmount <= 0 || marketAPY <= 0) return 0;

    // Current date + 1 day
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 1);

    // Parse maturity date
    const maturityDateObj = parseDateString(marketMaturity);
    if (!maturityDateObj) return marketNumericAmount;

    // Calculate days difference
    const days = calculateDaysDifference(currentDate, maturityDateObj);
    if (days <= 0) return marketNumericAmount;

    // Calculate future amount: Amount + (Amount * Rate/365 * days)
    const futureAmount = marketNumericAmount + (marketNumericAmount * (marketAPY / 100) / 365 * days);
    return futureAmount;
  };

  const marketFutureAmount = calculateMarketFutureAmount();

  const handleLimitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(limitAmount) || 0;
    if (numericAmount <= 0 || isProcessing) return;

    const tokenInfo = getTokenInfo(selectedToken.value);
    if (!tokenInfo) return;

    // Start processing
    setIsProcessing(true);

    try {
      // Simulate transaction processing delay (1.5 seconds)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const amountInUsd = numericAmount * tokenInfo.price;
      const targetAPYNumeric = parseFloat(limitTargetAPY.replace(/,/g, ".")) || 0;
      const apyDecimal = targetAPYNumeric / 100; // Convert percentage to decimal

      // Check if we're in edit mode
      if (editingPosition && onUpdate) {
        // Update existing position
        const updatedPosition: LendPosition = {
          ...editingPosition,
          assetImg: selectedToken.logo,
          assetName: selectedToken.label,
          amount: amountInUsd,
          apy: apyDecimal || editingPosition.apy,
          tokenValue: selectedToken.value,
          tokenSymbol: selectedToken.label.toUpperCase().slice(0, 4),
          maturity: limitMaturity,
          orderType: "limit" as const,
        };

        // Update in localStorage
        if (typeof window !== "undefined") {
          const existingPositions = (() => {
            const stored = localStorage.getItem("centuari_positions");
            if (stored) {
              try {
                return JSON.parse(stored);
              } catch {
                return [];
              }
            }
            return [];
          })();

          const updatedPositions = existingPositions.map((pos: LendPosition) =>
            pos.id === editingPosition.id ? updatedPosition : pos
          );
          localStorage.setItem("centuari_positions", JSON.stringify(updatedPositions));

          // Trigger storage event to notify other components
          window.dispatchEvent(new Event("storage"));
          window.dispatchEvent(new CustomEvent("centuari-positions-updated"));
        }

        onUpdate(updatedPosition);
        setIsProcessing(false);
        return;
      }

      // Create new position
      const newPosition = {
        id: `lend-${selectedToken.value}-${Date.now()}`,
        assetImg: selectedToken.logo,
        assetName: selectedToken.label,
        amount: amountInUsd,
        apy: apyDecimal || (4.5 + Math.random() * 3) / 100, // Use target APY or random between 4.5% and 7.5%
        type: "lend" as const,
        tokenValue: selectedToken.value,
        tokenSymbol: selectedToken.label.toUpperCase().slice(0, 4),
        maturity: limitMaturity,
        status: "pending" as const,
        createdAt: formatDate(new Date()),
        timestamp: Date.now(),
        orderType: "limit" as const,
      };

      // Save to localStorage
      if (typeof window !== "undefined") {
        const existingPositions = (() => {
          const stored = localStorage.getItem("centuari_positions");
          if (stored) {
            try {
              return JSON.parse(stored);
            } catch {
              return [];
            }
          }
          return [];
        })();

        const updatedPositions = [...existingPositions, newPosition];
        localStorage.setItem("centuari_positions", JSON.stringify(updatedPositions));

        // Update portfolio
        const stored = localStorage.getItem("centuari_portfolio");
        const portfolio = stored ? JSON.parse(stored) : defaultPortfolio;
        const currentPortfolioValue = portfolio[selectedToken.value] || 0;
        const newPortfolioValue = Math.max(0, currentPortfolioValue - amountInUsd);
        portfolio[selectedToken.value] = newPortfolioValue;
        localStorage.setItem("centuari_portfolio", JSON.stringify(portfolio));

        // Update total supply
        const storedSupply = localStorage.getItem("centuari_total_supply");
        const totalSupply = storedSupply ? parseFloat(storedSupply) || 0 : 0;
        localStorage.setItem("centuari_total_supply", (totalSupply + amountInUsd).toString());

        // Store success data
        setSuccessAmount(formatNumberWithSeparator(numericAmount));
        setSuccessTokenSymbol(selectedToken.label.toUpperCase().slice(0, 4));

        // Reset form
        setLimitAmount("");
        setLimitDisplayAmount("");
        setLimitTargetAPY("");

        // Trigger storage event to notify other components
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new CustomEvent("centuari-positions-updated"));

        // Show success dialog
        setIsProcessing(false);
        setShowSuccessDialog(true);
      }
    } catch (error) {
      console.error("Transaction failed:", error);
      setIsProcessing(false);
      // In real app, show error dialog here
    }
  };

  const handleMarketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(marketAmount) || 0;
    if (numericAmount <= 0 || isProcessing) return;

    const tokenInfo = getTokenInfo(selectedToken.value);
    if (!tokenInfo) return;

    // Start processing
    setIsProcessing(true);

    try {
      // Simulate transaction processing delay (1.5 seconds)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const amountInUsd = numericAmount * tokenInfo.price;
      // Market APY is determined by market (random for now)
      const apyDecimal = (4.5 + Math.random() * 3) / 100;

      // Check if we're in edit mode
      if (editingPosition && onUpdate) {
        // Update existing position
        const updatedPosition: LendPosition = {
          ...editingPosition,
          assetImg: selectedToken.logo,
          assetName: selectedToken.label,
          amount: amountInUsd,
          apy: apyDecimal,
          tokenValue: selectedToken.value,
          tokenSymbol: selectedToken.label.toUpperCase().slice(0, 4),
          maturity: marketMaturity,
          orderType: "market" as const,
        };

        // Update in localStorage
        if (typeof window !== "undefined") {
          const existingPositions = (() => {
            const stored = localStorage.getItem("centuari_positions");
            if (stored) {
              try {
                return JSON.parse(stored);
              } catch {
                return [];
              }
            }
            return [];
          })();

          const updatedPositions = existingPositions.map((pos: LendPosition) =>
            pos.id === editingPosition.id ? updatedPosition : pos
          );
          localStorage.setItem("centuari_positions", JSON.stringify(updatedPositions));

          // Trigger storage event to notify other components
          window.dispatchEvent(new Event("storage"));
          window.dispatchEvent(new CustomEvent("centuari-positions-updated"));
        }

        onUpdate(updatedPosition);
        setIsProcessing(false);
        return;
      }

      // Create new position
      const newPosition = {
        id: `lend-${selectedToken.value}-${Date.now()}`,
        assetImg: selectedToken.logo,
        assetName: selectedToken.label,
        amount: amountInUsd,
        apy: apyDecimal,
        type: "lend" as const,
        tokenValue: selectedToken.value,
        tokenSymbol: selectedToken.label.toUpperCase().slice(0, 4),
        maturity: marketMaturity,
        status: "pending" as const,
        createdAt: formatDate(new Date()),
        timestamp: Date.now(),
        orderType: "market" as const,
      };

      // Save to localStorage
      if (typeof window !== "undefined") {
        const existingPositions = (() => {
          const stored = localStorage.getItem("centuari_positions");
          if (stored) {
            try {
              return JSON.parse(stored);
            } catch {
              return [];
            }
          }
          return [];
        })();

        const updatedPositions = [...existingPositions, newPosition];
        localStorage.setItem("centuari_positions", JSON.stringify(updatedPositions));

        // Update portfolio
        const stored = localStorage.getItem("centuari_portfolio");
        const portfolio = stored ? JSON.parse(stored) : defaultPortfolio;
        const currentPortfolioValue = portfolio[selectedToken.value] || 0;
        const newPortfolioValue = Math.max(0, currentPortfolioValue - amountInUsd);
        portfolio[selectedToken.value] = newPortfolioValue;
        localStorage.setItem("centuari_portfolio", JSON.stringify(portfolio));

        // Update total supply
        const storedSupply = localStorage.getItem("centuari_total_supply");
        const totalSupply = storedSupply ? parseFloat(storedSupply) || 0 : 0;
        localStorage.setItem("centuari_total_supply", (totalSupply + amountInUsd).toString());

        // Store success data
        setSuccessAmount(formatNumberWithSeparator(numericAmount));
        setSuccessTokenSymbol(selectedToken.label.toUpperCase().slice(0, 4));

        // Reset form
        setMarketAmount("");
        setMarketDisplayAmount("");

        // Trigger storage event to notify other components
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new CustomEvent("centuari-positions-updated"));

        // Show success dialog
        setIsProcessing(false);
        setShowSuccessDialog(true);
      }
    } catch (error) {
      console.error("Transaction failed:", error);
      setIsProcessing(false);
      // In real app, show error dialog here
    }
  };

  // Auto-close success dialog after 3 seconds
  React.useEffect(() => {
    if (showSuccessDialog) {
      const timer = setTimeout(() => {
        setShowSuccessDialog(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showSuccessDialog]);

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
          <form onSubmit={handleLimitSubmit} className="md:h-full md:flex md:flex-col">
            <ScrollArea className="h-[300px] sm:h-[320px] md:flex-1 md:min-h-0">
              <CentuariInput
                id="limit-amount"
                label="Supply"
                size="large"
                placeholder="Amount"
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
                    onClick={() => {
                      const max = getAvailableBalance();
                      setLimitAmount(max.toString());
                      setLimitDisplayAmount(formatNumberWithSeparator(max.toString()));
                    }}
                  >
                    Max
                  </Button>
                }
                balanceText={`${selectedToken.label} ${formatNumberWithSeparator(getAvailableBalance().toString())}`}
                value={limitDisplayAmount}
                onChange={handleLimitAmountChange}
                className="mt-0"
                containerClassName="mt-3.5"
              />
              <div className="w-full space-y-2 mt-3.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="limit-target-apy">Target APY</Label>
                </div>
                <div className="relative">
                  <Input
                    id="limit-target-apy"
                    type="text"
                    placeholder="12.5"
                    value={limitTargetAPY}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d.,]/g, "");
                      setLimitTargetAPY(value);
                    }}
                    className="peer h-9 text-base bg-[#1a1d24] border-[#2a2e38] focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-search-cancel-button]:appearance-none"
                    style={{ paddingLeft: maturitySelectPadding }}
                  />
                  <span className="absolute inset-y-0 right-3 flex items-center text-muted-foreground">%</span>
                  <div className="absolute inset-y-0 left-1 flex items-center">
                    <Select value={limitMaturity} onValueChange={setLimitMaturity}>
                      <SelectTrigger
                        ref={maturitySelectRef}
                        className="!h-7 w-auto border-0 bg-transparent px-2 py-1 focus:ring-0 focus:ring-offset-0 gap-1"
                      >
                        <SelectValue placeholder="Select Maturity" />
                      </SelectTrigger>
                      <SelectContent className="bg-white/5 backdrop-blur-[140px]">
                        <SelectGroup>
                          <SelectItem value="1 Feb 2026">1 Feb 2026</SelectItem>
                          <SelectItem value="1 Mar 2026">1 Mar 2026</SelectItem>
                          <SelectItem value="1 Apr 2026">1 Apr 2026</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <TransactionSummary
                transactionFee={limitTransactionFee}
                amountToPay={limitAmountToPay}
                futureAmount={limitFutureAmount}
              />
            </ScrollArea>
            <Button
              type="submit"
              variant="primary"
              className="w-full mt-3.5 md:shrink-0"
              disabled={!limitAmount || parseFloat(limitAmount) <= 0 || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Supply"
              )}
            </Button>
          </form>
        </TabsContent>

        <TabsContent
          value="market"
          className="md:flex-1 md:min-h-0 md:flex md:flex-col"
        >
          <form onSubmit={handleMarketSubmit} className="md:h-full md:flex md:flex-col">
            <ScrollArea className="h-[300px] sm:h-[320px] md:flex-1 md:min-h-0">
              <CentuariInput
                id="market-amount"
                label="Supply"
                size="large"
                placeholder="Amount"
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
                    onClick={() => {
                      const max = getAvailableBalance();
                      setMarketAmount(max.toString());
                      setMarketDisplayAmount(formatNumberWithSeparator(max.toString()));
                    }}
                  >
                    Max
                  </Button>
                }
                balanceText={`${selectedToken.label} ${formatNumberWithSeparator(getAvailableBalance().toString())}`}
                value={marketDisplayAmount}
                onChange={handleMarketAmountChange}
                className="mt-0"
                containerClassName="mt-3.5"
              />
              <div>
                <Label className="mb-1.5 mt-3.5">
                  Maturity
                  <CentuariTooltip message="Coming Soon">
                    <Info size={16} />
                  </CentuariTooltip>
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                  {["1 Feb 2026", "1 Mar 2026", "1 Apr 2026"].map((item) => (
                    <Button
                      key={item}
                      type="button"
                      variant={marketMaturity === item ? "default" : "outline"}
                      className={`h-9 ${marketMaturity === item
                        ? "bg-primary-blue-base/20 border border-primary-blue-base text-white hover:text-white hover:bg-primary-blue-base/20"
                        : ""
                        }`}
                      onClick={() => setMarketMaturity(item)}
                    >
                      {item}
                    </Button>
                  ))}
                </div>

                <CentuariTypography
                  variant="s3"
                  className="mt-2 text-muted-foreground text-start"
                >
                  APY is determined by the market
                </CentuariTypography>
              </div>
              <TransactionSummary
                transactionFee={marketTransactionFee}
                amountToPay={marketAmountToPay}
                futureAmount={marketFutureAmount}
              />
            </ScrollArea>
            <Button
              type="submit"
              variant="primary"
              className="w-full mt-3.5 md:shrink-0"
              disabled={!marketAmount || parseFloat(marketAmount) <= 0 || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Supply"
              )}
            </Button>
          </form>
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
                Lend Successful!
              </CentuariTypography>
              <CentuariTypography className="text-center text-muted-foreground">
                {successAmount ? (
                  <>
                    You have successfully lent {successAmount} {successTokenSymbol} to
                    the vault.
                  </>
                ) : (
                  <>Your {successTokenSymbol} lend has been completed successfully.</>
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
