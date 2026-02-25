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
import { ScrollArea } from "@/components/ui/scroll-area";
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
}

export function LendForm({
  tokenList,
  selectedToken: selectedTokenProp,
  editingPosition,
  onUpdate,
}: LendFormProps) {
  const form = useLendForm({
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
          <form
            onSubmit={form.handleLimitSubmit}
            className="md:h-full md:flex md:flex-col"
          >
            <ScrollArea className="h-[300px] sm:h-[320px] md:flex-1 md:min-h-0">
              <CentuariInput
                id="limit-amount"
                label="Supply"
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
                balanceText={`${form.selectedToken.label} ${formatNumberWithSeparator(form.getAvailableBalance().toString())}`}
                value={form.limitDisplayAmount}
                onChange={form.handleLimitAmountChange}
                className="mt-0"
                containerClassName="mt-3.5"
              />
              <div className="w-full mt-3.5">
                <TargetAprMaturityInput
                  id="limit-target-apr"
                  value={form.limitTargetAPR}
                  onChange={form.setLimitTargetAPR}
                  maturity={form.limitMaturity}
                  onMaturityChange={form.setLimitMaturity}
                  maturityOptions={form.availableMaturities}
                  placeholder="12.5"
                  label="Target APR"
                />
              </div>
              <div className="mt-5">
                <Checkbox
                  id="limit-auto-rollover"
                  label={
                    <>
                      Auto Rollover
                      <CentuariTooltip message="When enabled, your position will automatically renew at maturity.">
                        <Info size={16} className="ml-1 inline-block text-muted-foreground" />
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
              />
            </ScrollArea>
            <Button
              type="submit"
              variant="primary"
              className="w-full mt-3.5 md:shrink-0"
              disabled={
                !form.limitAmount ||
                parseFloat(form.limitAmount) <= 0 ||
                form.isPending
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
            <ScrollArea className="h-[300px] sm:h-[320px] md:flex-1 md:min-h-0">
              <CentuariInput
                id="market-amount"
                label="Supply"
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
                balanceText={`${form.selectedToken.label} ${formatNumberWithSeparator(form.getAvailableBalance().toString())}`}
                value={form.marketDisplayAmount}
                onChange={form.handleMarketAmountChange}
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
                  {form.availableMaturities.map((ts) => (
                    <Button
                      key={ts}
                      type="button"
                      variant={form.marketMaturity === ts ? "default" : "outline"}
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
                      <CentuariTooltip message="When enabled, your position will automatically renew at maturity.">
                        <Info size={16} className="ml-1 inline-block text-muted-foreground" />
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
              />
            </ScrollArea>
            <Button
              type="submit"
              variant="primary"
              className="w-full mt-3.5 md:shrink-0"
              disabled={
                !form.marketAmount ||
                parseFloat(form.marketAmount) <= 0 ||
                form.isPending
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
