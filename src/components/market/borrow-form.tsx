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
import { TabsContent } from "@/components/ui/tabs";
import { Info, Loader2 } from "lucide-react";
import Image from "next/image";
import { formatCurrency, getHealthFactorPercentage } from "@/lib/utils";
import { CollateralListDisplay } from "@/components/collateral-list-display";
import { CollateralEmptyState } from "@/components/collateral-empty-state";
import { TransactionSummary } from "@/components/market/transaction-summary";
import { useBorrowForm } from "@/hooks/use-borrow-form";
import type { BorrowPosition } from "@/types/positions";
import type { TokenOption } from "@/types";
import { MAX_APR_PCT, MIN_APR_PCT } from "@/lib/order-errors";


interface BorrowFormProps {
  tokenList: TokenOption[];
  selectedToken?: TokenOption;
  editingPosition?: BorrowPosition;
  onUpdate?: (updatedPosition: BorrowPosition) => void;
  maturityOptions?: number[];
  assetId?: string;
}

export function BorrowForm({
  tokenList,
  selectedToken: selectedTokenProp,
  editingPosition,
  onUpdate,
  maturityOptions,
  assetId,
}: BorrowFormProps) {
  const form = useBorrowForm({
    tokenList,
    selectedTokenProp,
    editingPosition,
    onUpdate,
    maturityOptions,
    assetId,
  });

  const limitAprNumeric = parseFloat(form.limitTargetAPR.replace(",", ".")) || 0;
  const limitAprError = form.limitTargetAPR && limitAprNumeric > MAX_APR_PCT
    ? `Target APR cannot exceed ${MAX_APR_PCT}%`
    : form.limitTargetAPR && limitAprNumeric > 0 && limitAprNumeric < MIN_APR_PCT
      ? `Target APR must be at least ${MIN_APR_PCT}%`
      : null;

  return (
    <>
      <OrderTypeTabs
        defaultValue="limit"
        className="w-full px-3 sm:px-4 md:px-2.5 md:h-full md:flex md:flex-col mt-2"
      >
        <TabsContent
          value="limit"
          className="md:flex-1 md:min-h-0 md:flex md:flex-col"
        >
          <div className="text-center text-white/60 md:h-full md:flex md:flex-col">
            <form onSubmit={form.handleLimitSubmit} className="md:h-full md:flex md:flex-col">
              <div className="h-full overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/40">
                <CentuariInput
                  id="limit-amount"
                  label="Amount to Borrow"
                  labelClassName="text-xs"
                  size="large"
                  placeholder="1,000"
                  leftIcon={
                    <Image
                      src={form.selectedToken.logo}
                      alt={form.selectedToken.label}
                      width={32}
                      height={32}
                      quality={100}
                      className="w-4 h-4 object-contain"
                    />
                  }
                  suffix={form.selectedToken.label}
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
                  containerClassName="mt-2"
                />
                <div className="mt-2">
                  <Label className="mb-1 text-xs">Collateral</Label>
                  <div className="mt-1">
                    {form.limitSelectedCollaterals.length > 0 ? (
                      <CollateralListDisplay
                        selectedCollaterals={form.limitSelectedCollaterals}
                        tokenList={form.collateralTokenList}
                      />
                    ) : (
                      <CollateralEmptyState compact />
                    )}
                  </div>
                </div>
                <div className="w-full mt-2">
                  <TargetAprMaturityInput
                    id="limit-target-apr"
                    value={form.limitTargetAPR}
                    onChange={form.setLimitTargetAPR}
                    maturity={form.limitMaturity}
                    onMaturityChange={form.setLimitMaturity}
                    maturityOptions={form.availableMaturities}
                    placeholder="Enter your APR amount"
                    label="Target APR"
                    errorText={limitAprError}
                  />
                </div>
                <div className="mt-2">
                  <Checkbox
                    id="limit-auto-refinance"
					label={
						<>
							Auto refinance
							<CentuariTooltip message="When enabled, your position will automatically renew with the best terms when it ends.">
								<Info
									size={16}
									className="ml-1 inline-block text-muted-foreground"
								/>
							</CentuariTooltip>
						</>
					}
                    checked={form.autoRefinance}
                    onCheckedChange={form.setAutoRefinance}
                  />
                </div>
                <div>
                  <Label className="mb-1 mt-2 text-xs">
                    Health Factor{" "}
                    <CentuariTooltip message="Your health factor shows how safe your borrowed position is. Blue indicates a safe position.">
                      <Info size={16} />
                    </CentuariTooltip>
                    <HealthFactorBadge
                      healthFactor={form.limitHealthFactor || form.userHealthFactor}
                      isEmpty={
                        (form.limitHealthFactor === 0 && form.userHealthFactor === 0) ||
                        (!form.limitNumericAmount && form.userHealthFactor === 0)
                      }
                    />
                  </Label>
                  <div className="border border-white/5 rounded-lg overflow-hidden mt-1">
                    <div className="h-8 flex items-center justify-center px-4 rounded-b-lg border-b border-white/5 bg-white/10 z-50">
                      <HealthFactor
                        targetValue={form.limitHealthFactorPercentage || (form.userHealthFactor > 0 ? getHealthFactorPercentage(form.userHealthFactor) : 0)}
                        healthFactor={
                          form.limitHealthFactor > 0 &&
                          !isNaN(form.limitHealthFactor)
                            ? form.limitHealthFactor
                            : form.userHealthFactor > 0
                              ? form.userHealthFactor
                              : undefined
                        }
                      />
                    </div>
                    <div className="px-2 py-1.5 z-20 -mt-2 border-t-0 border-white/5 rounded-b-lg">
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
                                (form.totalDebt + form.limitNumericAmount * form.borrowTokenPrice) /
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
                <TransactionSummary
                  transactionFee={form.limitTransactionFee}
                  amountToPay={form.limitAmountToPay}
                  futureAmount={form.limitFutureAmount}
                  futureLabel="In the future you'll pay"
                  tokenSymbol={form.selectedToken.label}
                />
              </div>
              <div className="md:contents max-md:sticky max-md:bottom-0 max-md:z-10 max-md:-mx-3 max-md:px-3 sm:max-md:-mx-4 sm:max-md:px-4 max-md:pt-3">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full md:shrink-0 mb-4"
                  disabled={
                    form.isPending ||
                    form.limitNumericAmount <= 0 ||
                    form.limitNumericAmount * form.borrowTokenPrice > form.limitAvailableQuota ||
                    form.limitSelectedCollaterals.length === 0 ||
                    form.limitTotalPortfolioValue === 0 ||
                    form.limitHealthFactor < 1.0 ||
                    !form.limitTargetAPR ||
                    limitAprNumeric <= 0 ||
                    limitAprError !== null ||
                    !form.limitMaturity
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
              </div>
            </form>
          </div>
        </TabsContent>

        <TabsContent
          value="market"
          className="md:flex-1 md:min-h-0 md:flex md:flex-col"
        >
          <div className="text-center text-white/60 md:h-full md:flex md:flex-col">
            <form onSubmit={form.handleMarketSubmit} className="md:h-full md:flex md:flex-col">
              <div className="md:flex-1 md:min-h-0 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/40">
                <CentuariInput
                  id="market-amount"
                  label="Amount to Borrow"
                  labelClassName="text-xs"
                  size="large"
                  placeholder="1,000"
                  leftIcon={
                    <Image
                      src={form.selectedToken.logo}
                      alt={form.selectedToken.label}
                      width={32}
                      height={32}
                      quality={100}
                      className="w-4 h-4 object-contain"
                    />
                  }
                  suffix={form.selectedToken.label}
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
                  containerClassName="mt-2"
                />
                <div className="mt-2">
                  <Label className="mb-1 text-xs">Collateral</Label>
                  <div className="mt-1">
                    {form.marketSelectedCollaterals.length > 0 ? (
                      <CollateralListDisplay
                        selectedCollaterals={form.marketSelectedCollaterals}
                        tokenList={form.collateralTokenList}
                      />
                    ) : (
                      <CollateralEmptyState compact />
                    )}
                  </div>
                </div>
                <div>
                  <Label className="mb-1 mt-2 text-xs">
                    Maturity{" "}
                    <CentuariTooltip message="Maturity is the duration for which you want to borrow assets.">
                      <Info size={16} />
                    </CentuariTooltip>
                  </Label>
                  <MaturityToggle
                    value={form.marketMaturity}
                    onValueChange={form.setMarketMaturity}
                    options={form.availableMaturities}
                  />
                </div>
                <div className="mt-2">
                  <Checkbox
                    id="market-auto-refinance"
                    label={
						<>
							Auto refinance
							<CentuariTooltip message="When enabled, your position will automatically renew with the best terms when it ends.">
								<Info
									size={16}
									className="ml-1 inline-block text-muted-foreground"
								/>
							</CentuariTooltip>
						</>
					}
                    checked={form.autoRefinance}
                    onCheckedChange={form.setAutoRefinance}
                  />
                </div>
                <div>
                  <Label className="mb-1 mt-2 text-xs">
                    Health Factor{" "}
                    <CentuariTooltip message="Your health factor shows how safe your borrowed position is. Blue indicates a safe position.">
                      <Info size={16} />
                    </CentuariTooltip>
                    <HealthFactorBadge
                      healthFactor={form.marketHealthFactor || form.userHealthFactor}
                      isEmpty={
                        (form.marketHealthFactor === 0 && form.userHealthFactor === 0) ||
                        (!form.marketNumericAmount && form.userHealthFactor === 0)
                      }
                    />
                  </Label>
                  <div className="border border-white/5 rounded-lg overflow-hidden mt-1">
                    <div className="h-8 flex items-center justify-center px-4 rounded-b-lg border-b border-white/5 bg-white/10 z-50">
                      <HealthFactor
                        targetValue={form.marketHealthFactorPercentage || (form.userHealthFactor > 0 ? getHealthFactorPercentage(form.userHealthFactor) : 0)}
                        healthFactor={
                          form.marketHealthFactor > 0 &&
                          !isNaN(form.marketHealthFactor)
                            ? form.marketHealthFactor
                            : form.userHealthFactor > 0
                              ? form.userHealthFactor
                              : undefined
                        }
                      />
                    </div>
                    <div className="px-2 py-1.5 z-20 -mt-2 border-t-0 border-white/5 rounded-b-lg">
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
                                (form.totalDebt + form.marketNumericAmount * form.borrowTokenPrice) /
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
                <TransactionSummary
                  transactionFee={form.marketTransactionFee}
                  amountToPay={form.marketAmountToPay}
                  futureAmount={form.marketFutureAmount}
                  futureLabel="In the future you'll pay"
                  tokenSymbol={form.selectedToken.label}
                />
              </div>
              <div className="md:contents max-md:sticky max-md:bottom-0 max-md:z-10 max-md:-mx-3 max-md:px-3 sm:max-md:-mx-4 sm:max-md:px-4 max-md:pt-3">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full md:shrink-0 mb-4"
                  disabled={
                    form.isPending ||
                    form.marketNumericAmount <= 0 ||
                    form.marketNumericAmount * form.borrowTokenPrice > form.marketAvailableQuota ||
                    form.marketSelectedCollaterals.length === 0 ||
                    form.marketTotalPortfolioValue === 0 ||
                    form.marketHealthFactor < 1.0 ||
                    !form.marketMaturity
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
              </div>
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
