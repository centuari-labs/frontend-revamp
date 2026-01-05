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
    <Tabs
      defaultValue="market"
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
        <form action="" className="md:h-full md:flex md:flex-col">
          <ScrollArea className="h-[300px] sm:h-[320px] md:flex-1 md:min-h-0">
            <CentuariInput
              id="amount"
              label="Supply"
              size="large"
              placeholder="Amount"
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
            {/* <div>
              <Label className="mb-1.5 mt-3.5">Collaterals</Label>
              <MultiSelect
                options={tokenList}
                onValueChange={(values) => console.log(values)}
                placeholder="Select Coins"
                variant="destructive"
                maxCount={2}
              />
            </div> */}
            <div>
              <SelectMaturity />
            </div>
            <TransactionSummary />
          </ScrollArea>
          <Button
            type="button"
            variant="primary"
            className="w-full mt-3.5 md:shrink-0"
          >
            Borrow
          </Button>
        </form>
      </TabsContent>

      <TabsContent
        value="market"
        className="md:flex-1 md:min-h-0 md:flex md:flex-col"
      >
        <form action="" className="md:h-full md:flex md:flex-col">
          <ScrollArea className="h-[300px] sm:h-[320px] md:flex-1 md:min-h-0">
            <CentuariInput
              id="amount"
              label="Supply"
              size="large"
              placeholder="Amount"
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
            {/* <div>
              <Label className="mb-1.5 mt-3.5">Collaterals</Label>
              <MultiSelect
                options={tokenList}
                onValueChange={(values) => console.log(values)}
                placeholder="Select Coins"
                variant="default"
                maxCount={2}
              />
            </div> */}
            <div>
              <Label className="mb-1.5 mt-3.5">
                Maturity
                <CentuariTooltip message="Coming Soon">
                  <Info size={16} />
                </CentuariTooltip>
              </Label>
              <MaturityToggle />

              <CentuariTypography
                variant="s3"
                className="mt-2 text-muted-foreground text-start"
              >
                APY is determined by the market
              </CentuariTypography>
            </div>
            <TransactionSummary />
          </ScrollArea>
          <Button
            type="button"
            variant="primary"
            className="w-full mt-3.5 md:shrink-0"
          >
            Supply
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );
}
