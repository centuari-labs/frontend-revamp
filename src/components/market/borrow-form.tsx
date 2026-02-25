"use client";

import { CentuariInput } from "@/components/centuari-input";
import { CentuariTooltip } from "@/components/centuari-tooltip";
import HealthFactor from "@/components/centuari-health-factor";
import { HealthFactorBadge } from "@/components/health-factor-badge";
import { TargetAprMaturityInput } from "@/components/target-apr-maturity-input";
import { TxSuccessAutoCloseDialog } from "@/components/tx-success-auto-close-dialog";
import { OrderTypeTabs } from "@/components/order-type-tabs";
import { MaturityToggle } from "@/components/maturity-toggle";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TabsContent } from "@/components/ui/tabs";
import { Info, Loader2 } from "lucide-react";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import { CollateralListDisplay } from "@/components/collateral-list-display";
import { CollateralEmptyState } from "@/components/collateral-empty-state";
import { useBorrowForm } from "@/hooks/use-borrow-form";
import type { BorrowPosition } from "@/types/positions";
import type { TokenOption } from "@/types";
import { tokenList as portfolioTokenList } from "@/lib/portfolio-data";
import { getAvailableMaturityTimestamps } from "@/lib/maturity";

interface BorrowFormProps {
  tokenList: TokenOption[];
  selectedToken?: TokenOption;
  editingPosition?: BorrowPosition;
  onUpdate?: (updatedPosition: BorrowPosition) => void;
}

export function BorrowForm({
  tokenList,
  selectedToken: selectedTokenProp,
  editingPosition,
  onUpdate,
}: BorrowFormProps) {
  const form = useBorrowForm({
    tokenList,
    selectedTokenProp,
    editingPosition,
    onUpdate,
  });

  return (
    <>
      <OrderTypeTabs
        defaultValue="limit"
        className="w-full p-2 sm:p-3 md:p-3.5 md:h-full md:flex md:flex-col"
      >
        <TabsContent
          value="limit"
          className="md:flex-1 md:min-h-0 md:flex md:flex-col"
        >
          <div className="text-center text-white/60 md:h-full md:flex md:flex-col">
            <form
              onSubmit={form.handleLimitSubmit}
              className="md:h-full md:flex md:flex-col"
            >
              <ScrollArea className="h-auto md:flex-1 md:min-h-0">
                <CentuariInput
                  id="limit-amount"
                  label="Amount to Borrow"
                  size="large"
                  placeholder="1,000"
                  leftIcon={
                    <Image
                      src={form.selectedToken.logo}
                      alt={form.selectedToken.label}
                      width={16}
                      height={16}
                      className="w-4 h-4"
                    />
                  }
                  rightIcon={
                    <Button
                      variant="link"
                      className="px-0"
                      type="button"
                      onClick={form.handleLimitMaxClick}
                    >
                      Max
                    </Button>
                  }
                  value={form.limitDisplayAmount}
                  onChange={form.handleLimitAmountChange}
                  className="mt-0"
                  containerClassName="mt-3.5"
                />
                <div className="mt-3">
                  <Label className="mb-2">Collateral</Label>
                  <div className="mt-1.5">
                    {form.limitSelectedCollaterals.length > 0 ? (
                      <CollateralListDisplay
                        selectedCollaterals={form.limitSelectedCollaterals}
                        tokenList={portfolioTokenList}
                      />
                    ) : (
                      <CollateralEmptyState compact />
                    )}
                  </div>
                </div>
                <div className="w-full mt-3">
                  <TargetAprMaturityInput
                    id="limit-target-apr"
                    value={form.limitTargetAPR}
                    onChange={form.setLimitTargetAPR}
                    maturity={form.limitMaturity}
                    onMaturityChange={form.setLimitMaturity}
                    maturityOptions={getAvailableMaturityTimestamps()}
                    placeholder="12.5"
                    label="Target APR"
                  />
                </div>
                <div className="mt-5">
                  <Checkbox
                    id="limit-auto-refinance"
                    label="Auto refinance"
                    checked={form.autoRefinance}
                    onCheckedChange={form.setAutoRefinance}
                  />
                </div>
                <div>
                  <Label className="mb-2 mt-2.5">
                    Health Factor{" "}
                    <CentuariTooltip message="Your health factor indicates the safety of your borrowed position.">
                      <Info size={16} />
                    </CentuariTooltip>
                    <HealthFactorBadge
                      healthFactor={form.limitHealthFactor}
                      isEmpty={
                        form.limitHealthFactor === 0 ||
                        form.limitSelectedCollaterals.length === 0 ||
                        form.limitNumericAmount === 0
                      }
                    />
                  </Label>
                  <div className="border border-white/5 rounded-lg mt-2">
                    <div className="h-11 flex items-center justify-center px-4 rounded-lg border-b border-white/5 bg-white/10 z-50">
                      <HealthFactor
                        targetValue={form.limitHealthFactorPercentage}
                        healthFactor={
                          form.limitHealthFactor > 0 &&
                          !isNaN(form.limitHealthFactor)
                            ? form.limitHealthFactor
                            : undefined
                        }
                      />
                    </div>
                    <div className="px-2 py-4 z-20 -mt-2 border-t-0 border-white/5 rounded-b-lg">
                      <p className="text-xs text-muted-foreground text-center">
                        {form.limitHealthFactor > 0 &&
                        !isNaN(form.limitHealthFactor) &&
                        form.limitSelectedCollaterals.length > 0 &&
                        form.limitNumericAmount > 0 ? (
                          <>
                            If portfolio value drops{" "}
                            <span className="text-white font-medium">
                              below{" "}
                              {formatCurrency(
                                (form.totalDebt + form.limitNumericAmount) /
                                  form.getLiquidationThresholdDisplay(
                                    form.limitSelectedCollaterals,
                                    form.limitTotalPortfolioValue
                                  )
                              )}
                            </span>
                            , your position could be liquidated.
                          </>
                        ) : (
                          <>
                            Select collateral from portfolio and enter borrow
                            amount to see health factor.
                          </>
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
                  form.isPending ||
                  form.limitNumericAmount <= 0 ||
                  form.limitNumericAmount > form.limitAvailableQuota ||
                  form.limitSelectedCollaterals.length === 0 ||
                  form.limitTotalPortfolioValue === 0 ||
                  form.limitHealthFactor < 1.0
                }
              >
                {form.isPending ? (
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
            <form
              onSubmit={form.handleMarketSubmit}
              className="md:h-full md:flex md:flex-col"
            >
              <ScrollArea className="h-auto md:flex-1 md:min-h-0">
                <CentuariInput
                  id="market-amount"
                  label="Amount to Borrow"
                  size="large"
                  placeholder="1,000"
                  leftIcon={
                    <Image
                      src={form.selectedToken.logo}
                      alt={form.selectedToken.label}
                      width={16}
                      height={16}
                      className="w-4 h-4"
                    />
                  }
                  rightIcon={
                    <Button
                      variant="link"
                      className="px-0"
                      type="button"
                      onClick={form.handleMarketMaxClick}
                    >
                      Max
                    </Button>
                  }
                  value={form.marketDisplayAmount}
                  onChange={form.handleMarketAmountChange}
                  className="mt-0"
                  containerClassName="mt-3.5"
                />
                <div className="mt-3">
                  <Label className="mb-2 mt-2.5">Collateral</Label>
                  <div className="mt-1.5">
                    {form.marketSelectedCollaterals.length > 0 ? (
                      <CollateralListDisplay
                        selectedCollaterals={form.marketSelectedCollaterals}
                        tokenList={portfolioTokenList}
                      />
                    ) : (
                      <CollateralEmptyState compact />
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
                    value={form.marketMaturity}
                    onValueChange={form.setMarketMaturity}
                  />
                </div>
                <div className="mt-5">
                  <Checkbox
                    id="market-auto-refinance"
                    label="Auto refinance"
                    checked={form.autoRefinance}
                    onCheckedChange={form.setAutoRefinance}
                  />
                </div>
                <div>
                  <Label className="mb-2 mt-2.5">
                    Health Factor{" "}
                    <CentuariTooltip message="Your health factor indicates the safety of your borrowed position.">
                      <Info size={16} />
                    </CentuariTooltip>
                    <HealthFactorBadge
                      healthFactor={form.marketHealthFactor}
                      isEmpty={
                        form.marketHealthFactor === 0 ||
                        form.marketSelectedCollaterals.length === 0 ||
                        form.marketNumericAmount === 0
                      }
                    />
                  </Label>
                  <div className="border border-white/5 rounded-lg mt-2">
                    <div className="h-11 flex items-center justify-center px-4 rounded-lg border-b border-white/5 bg-white/10 z-50">
                      <HealthFactor
                        targetValue={form.marketHealthFactorPercentage}
                        healthFactor={
                          form.marketHealthFactor > 0 &&
                          !isNaN(form.marketHealthFactor)
                            ? form.marketHealthFactor
                            : undefined
                        }
                      />
                    </div>
                    <div className="px-2 py-4 z-20 -mt-2 border-t-0 border-white/5 rounded-b-lg">
                      <p className="text-xs text-muted-foreground text-center">
                        {form.marketHealthFactor > 0 &&
                        !isNaN(form.marketHealthFactor) &&
                        form.marketSelectedCollaterals.length > 0 &&
                        form.marketNumericAmount > 0 ? (
                          <>
                            If portfolio value drops{" "}
                            <span className="text-white font-medium">
                              below{" "}
                              {formatCurrency(
                                (form.totalDebt + form.marketNumericAmount) /
                                  form.getLiquidationThresholdDisplay(
                                    form.marketSelectedCollaterals,
                                    form.marketTotalPortfolioValue
                                  )
                              )}
                            </span>
                            , your position could be liquidated.
                          </>
                        ) : (
                          <>
                            Select collateral from portfolio and enter borrow
                            amount to see health factor.
                          </>
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
                  form.isPending ||
                  form.marketNumericAmount <= 0 ||
                  form.marketNumericAmount > form.marketAvailableQuota ||
                  form.marketSelectedCollaterals.length === 0 ||
                  form.marketTotalPortfolioValue === 0 ||
                  form.marketHealthFactor < 1.0
                }
              >
                {form.isPending ? (
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
      </OrderTypeTabs>

      <TxSuccessAutoCloseDialog
        open={form.showSuccessDialog}
        onOpenChange={form.setShowSuccessDialog}
        title="Borrow Successful!"
        description={
          form.successAmount ? (
            <>
              You have successfully borrowed {form.successAmount}{" "}
              {form.successTokenSymbol} from the vault.
            </>
          ) : (
            <>
              Your {form.successTokenSymbol} borrow has been completed
              successfully.
            </>
          )
        }
      />
    </>
  );
}
