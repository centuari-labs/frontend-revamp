"use client";

import { CentuariInput } from "@/components/centuari-input";
import { CentuariTooltip } from "@/components/centuari-tooltip";
import { CentuariTypography } from "@/components/centuari-typography";
import { TransactionSummary } from "@/components/market/transaction-summary";
import { TargetAprMaturityInput } from "@/components/target-apr-maturity-input";
import { TxSuccessAutoCloseDialog } from "@/components/tx-success-auto-close-dialog";
import { OrderTypeTabs } from "@/components/order-type-tabs";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Info, Loader2 } from "lucide-react";
import { useLendForm } from "@/hooks/use-lend-form";
import type { LendPosition } from "@/types/positions";
import type { TokenOption } from "@/types";
import Image from "next/image";
import { formatNumberWithSeparator } from "@/lib/utils";

interface LendFormProps {
  tokenList: TokenOption[];
  selectedToken?: TokenOption;
  editingPosition?: LendPosition;
  onUpdate?: (updatedPosition: LendPosition) => void;
  maturityOptions?: number[];
  assetId?: string;
}

export function LendForm({
  tokenList,
  selectedToken: selectedTokenProp,
  editingPosition,
  onUpdate,
  maturityOptions,
  assetId,
}: LendFormProps) {
  const form = useLendForm({
    tokenList,
    selectedTokenProp,
    editingPosition,
    onUpdate,
    maturityOptions,
    assetId,
  });

  const availableBalance = form.getAvailableBalance();
  const limitNumeric = parseFloat(form.limitAmount) || 0;
  const marketNumeric = parseFloat(form.marketAmount) || 0;
  const limitInsufficientBalance = limitNumeric > 0 && limitNumeric > availableBalance;
  const marketInsufficientBalance = marketNumeric > 0 && marketNumeric > availableBalance;

  return (
    <>
      <OrderTypeTabs
        defaultValue="limit"
        className="w-full px-3 sm:px-4 md:px-2.5 mt-2 md:h-full md:flex md:flex-col"
      >
        <TabsContent
          value="limit"
          className="md:flex-1 md:min-h-0 md:flex md:flex-col"
        >
          <form
            onSubmit={form.handleLimitSubmit}
            className="md:h-full md:flex md:flex-col"
          >
            <div className="md:flex-1 md:min-h-0 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/40">
              <CentuariInput
                id="limit-amount"
                label="Supply"
                labelClassName="text-xs"
                size="large"
                placeholder="Amount"
                tooltipMessage="The amount you currently have that is available to use."
                leftIcon={
                  <Image
                    src={form.selectedToken.logo}
                    alt={form.selectedToken.label}
                    width={16}
                    height={16}
                    className="w-4 h-4"
                  />
                }
                suffix={form.selectedToken.label}
                rightIcon={
                  <Button
                    variant="link"
                    className="px-0"
                    type="button"
                    onClick={form.setLimitMax}
                  >
                    Max
                  </Button>
                }
                balanceText={`${form.selectedToken.label} ${formatNumberWithSeparator(availableBalance.toString())}`}
                value={form.limitDisplayAmount}
                onChange={form.handleLimitAmountChange}
                className={`mt-0 ${limitInsufficientBalance ? "border-red-500 focus-visible:border-red-500" : ""}`}
                containerClassName="mt-3.5"
              />
              {limitInsufficientBalance && (
                <p className="text-red-500 text-xs mt-1">Insufficient balance</p>
              )}
              <div className="w-full mt-3.5">
                <TargetAprMaturityInput
                  id="limit-target-apr"
                  value={form.limitTargetAPR}
                  onChange={form.setLimitTargetAPR}
                  maturity={form.limitMaturity}
                  onMaturityChange={form.setLimitMaturity}
                  maturityOptions={form.availableMaturities}
                  placeholder="Enter your APR amount"
                  label="Target APR"
                />
              </div>
              <div className="mt-5">
                <Checkbox
                  id="limit-auto-rollover"
                  label={
                    <>
                      Auto Rollover
                      <CentuariTooltip message="When enabled, your position will automatically renew with the best terms when it ends.">
                        <Info
                          size={16}
                          className="ml-1 inline-block text-muted-foreground"
                        />
                      </CentuariTooltip>
                    </>
                  }
                  checked={form.autoRollover}
                  onCheckedChange={form.setAutoRollover}
                />
              </div>
              <TransactionSummary
                transactionFee={form.limitTransactionFee}
                amountToPay={form.limitAmountToPay}
                futureAmount={form.limitFutureAmount}
                tokenSymbol={form.selectedToken.label}
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              className="w-full mb-4 md:shrink-0"
              disabled={
                !form.limitAmount ||
                parseFloat(form.limitAmount) <= 0 ||
                !form.limitTargetAPR ||
                !form.limitMaturity ||
                form.isPending ||
                limitInsufficientBalance
              }
            >
              {form.isPending ? (
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
          <form
            onSubmit={form.handleMarketSubmit}
            className="md:h-full md:flex md:flex-col"
          >
            <div className="md:flex-1 md:min-h-0 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/40">
              <CentuariInput
                id="market-amount"
                label="Supply"
                labelClassName="text-xs"
                size="large"
                placeholder="Amount"
                leftIcon={
                  <Image
                    src={form.selectedToken.logo}
                    alt={form.selectedToken.label}
                    width={16}
                    height={16}
                    className="w-4 h-4"
                  />
                }
                suffix={form.selectedToken.label}
                rightIcon={
                  <Button
                    variant="link"
                    className="px-0"
                    type="button"
                    onClick={form.setMarketMax}
                  >
                    Max
                  </Button>
                }
                balanceText={`${form.selectedToken.label} ${formatNumberWithSeparator(availableBalance.toString())}`}
                value={form.marketDisplayAmount}
                onChange={form.handleMarketAmountChange}
                className={`mt-0 ${marketInsufficientBalance ? "border-red-500 focus-visible:border-red-500" : ""}`}
                containerClassName="mt-3.5"
              />
              {marketInsufficientBalance && (
                <p className="text-red-500 text-xs mt-1">Insufficient balance</p>
              )}
              <div>
                <Label className="mb-1.5 mt-3.5 text-xs">
                  Maturity
                  <CentuariTooltip message="The date when your position ends and your funds are returned.">
                    <Info size={16} className="text-muted-foreground"/>
                  </CentuariTooltip>
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                  {form.availableMaturities.map((ts) => (
                    <Button
                      key={ts}
                      type="button"
                      variant={
                        form.marketMaturity === ts ? "default" : "outline"
                      }
                      className={`h-9 ${
                        form.marketMaturity === ts
                          ? "bg-primary-blue-base/20 border border-primary-blue-base text-white hover:text-white hover:bg-primary-blue-base/20"
                          : ""
                      }`}
                      onClick={() => form.setMarketMaturity(ts)}
                    >
                      {form.formatMaturityTimestamp(ts)}
                    </Button>
                  ))}
                </div>
                <CentuariTypography
                  variant="s3"
                  className="mt-2 text-muted-foreground text-start"
                >
                  APR is determined by the market
                </CentuariTypography>
              </div>
              <div className="mt-5">
                <Checkbox
                  id="market-auto-rollover"
                  label={
                    <>
                      Auto Rollover
                      <CentuariTooltip message="When enabled, your position will automatically renew with the best terms when it ends.">
                        <Info
                          size={16}
                          className="ml-1 inline-block text-muted-foreground"
                        />
                      </CentuariTooltip>
                    </>
                  }
                  checked={form.autoRollover}
                  onCheckedChange={form.setAutoRollover}
                />
              </div>
              <TransactionSummary
                transactionFee={form.marketTransactionFee}
                amountToPay={form.marketAmountToPay}
                futureAmount={form.marketFutureAmount}
                tokenSymbol={form.selectedToken.label}
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              className="w-full mb-4 md:shrink-0"
              disabled={
                !form.marketAmount ||
                parseFloat(form.marketAmount) <= 0 ||
                !form.marketMaturity ||
                form.isPending ||
                marketInsufficientBalance
              }
            >
              {form.isPending ? (
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
      </OrderTypeTabs>

      <TxSuccessAutoCloseDialog
        open={form.showSuccessDialog}
        onOpenChange={form.setShowSuccessDialog}
        title="Lend Successful!"
        description={
          form.successAmount ? (
            <>
              You have successfully lent {form.successAmount}{" "}
              {form.successTokenSymbol} to the vault.
            </>
          ) : (
            <>
              Your {form.successTokenSymbol} lend has been completed
              successfully.
            </>
          )
        }
      />
    </>
  );
}
