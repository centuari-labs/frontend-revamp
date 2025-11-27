"use client";

import { CentuariInput } from "@/components/centuari-input";
import { CentuariTooltip } from "@/components/centuari-tooltip";
import HealthFactor from "@/components/centuari-health-factor";
import { IcDollarCentuari } from "@/components/icons/ic-dollar-centuari";
import { MaturityToggle } from "@/components/maturity-toggle";
import { SelectSingleToken } from "@/components/select-single-token";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info } from "lucide-react";

export function BorrowForm() {
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
        <div className="text-center text-white/60">
          <form action="">
            <CentuariInput
              id="amount"
              label="Amount to Lend"
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
            <SelectSingleToken />
            <SelectSingleToken />
            <div>
              <Label className="mb-2 mt-4">
                Health Factor{" "}
                <CentuariTooltip message="Your health factor indicates the safety of your borrowed position.">
                  <Info size={16} />
                </CentuariTooltip>
                <Badge variant="success">0.0 ~ Safe</Badge>
              </Label>
              <div className="border border-white/5 rounded-lg mt-2">
                <div className="h-11 flex items-center justify-center px-4 rounded-lg border-b border-white/5 bg-white/10 z-50">
                  <HealthFactor />
                </div>
              </div>
            </div>
            <Button type="button" variant="primary" className="w-full mt-3.5">
              Borrow
            </Button>
          </form>
        </div>
      </TabsContent>

      <TabsContent value="market">
        <div className="text-center text-white/60">
          <form action="">
            <CentuariInput
              id="amount"
              label="Amount to Lend"
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
            <SelectSingleToken />
            <MaturityToggle className="mt-3.5" />
            <div>
              <Label className="mb-2 mt-4">
                Health Factor{" "}
                <CentuariTooltip message="Your health factor indicates the safety of your borrowed position.">
                  <Info size={16} />
                </CentuariTooltip>
                <Badge variant="success">0.0 ~ Safe</Badge>
              </Label>
              <div className="border border-white/5 rounded-lg mt-2">
                <div className="h-11 flex items-center justify-center px-4 rounded-lg border-b border-white/5 bg-white/10 z-50">
                  <HealthFactor />
                </div>
              </div>
            </div>
            <Button type="button" variant="primary" className="w-full mt-12">
              Borrow
            </Button>
          </form>
        </div>
      </TabsContent>
    </Tabs>
  );
}
