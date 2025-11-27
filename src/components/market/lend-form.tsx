"use client";

import { CentuariInput } from "@/components/centuari-input";
import { CentuariTooltip } from "@/components/centuari-tooltip";
import { CentuariTypography } from "@/components/centuari-typography";
import { IcDollarCentuari } from "@/components/icons/ic-dollar-centuari";
import { TransactionSummary } from "@/components/market/transaction-summary";
import { MaturityToggle } from "@/components/maturity-toggle";
import { SelectMaturity } from "@/components/select-maturity";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info } from "lucide-react";

interface TokenOption {
  logo: string;
  value: string;
  label: string;
}

interface LendFormProps {
  tokenList: TokenOption[];
}

export function LendForm({ tokenList }: LendFormProps) {
  return (
    <Tabs defaultValue="market" className="w-full p-2 sm:p-3 md:p-3.5">
      <TabsList className="bg-white/5 w-full rounded-lg">
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

      <TabsContent value="limit">
        <form action="">
          <ScrollArea className="h-[300px] sm:h-[320px] md:h-[340px]">
            <CentuariInput
              id="amount"
              label="Supply"
              size="large"
              placeholder="Placeholder"
              leftIcon={<IcDollarCentuari size={16} />}
              rightIcon={
                <Button variant={"link"} className="px-0" type="button">
                  Max
                </Button>
              }
              balanceText="$1,000"
              className="mt-0"
              containerClassName="mt-3.5"
            />
            <div>
              <Label className="mb-1.5 mt-3.5">Collaterals</Label>
              <MultiSelect
                options={tokenList}
                onValueChange={(values) => console.log(values)}
                placeholder="Select Coins"
                variant="destructive"
                maxCount={2}
                popoverClassName="!bg-red-900"
              />
            </div>
            <div>
              <SelectMaturity />
            </div>
            <TransactionSummary />
          </ScrollArea>
          <Button type="button" variant="primary" className="w-full mt-3.5">
            Borrow
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="market">
        <form action="">
          <ScrollArea className="h-[300px] sm:h-[320px] md:h-[340px]">
            <CentuariInput
              id="amount"
              label="Supply"
              size="large"
              placeholder="Placeholder"
              leftIcon={<IcDollarCentuari size={16} />}
              rightIcon={
                <Button variant={"link"} className="px-0" type="button">
                  Max
                </Button>
              }
              balanceText="$1,000"
              className="mt-0"
              containerClassName="mt-3.5"
            />
            <div>
              <Label className="mb-1.5 mt-3.5">Collaterals</Label>
              <MultiSelect
                options={tokenList}
                onValueChange={(values) => console.log(values)}
                placeholder="Select Coins"
                variant="default"
                maxCount={2}
              />
            </div>
            <div>
              <Label className="mb-1.5 mt-3.5">
                Maturity
                <CentuariTooltip message="Coming Soon">
                  <Info size={16} />
                </CentuariTooltip>
              </Label>
              <MaturityToggle />

              <CentuariTypography
                variant="s4"
                className="mt-2 text-muted-foreground text-start"
              >
                Withdrawal Unlocks on{" "}
                <span className="text-white">21 Oct 2026</span>
              </CentuariTypography>
            </div>
            <TransactionSummary />
          </ScrollArea>
          <Button type="button" variant="primary" className="w-full mt-3.5">
            Place Order
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );
}
