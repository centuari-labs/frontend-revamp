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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info } from "lucide-react";
import { SelectMaturity } from "../select-maturity";
import Image from "next/image";
import { MultiSelect } from "../ui/multi-select";

const tokenList = [
  { logo: "/tokens/centuari-btc.png", value: "btc", label: "Bitcoin" },
  { logo: "/tokens/centuari-aave.png", value: "aave", label: "Aave" },
  { logo: "/tokens/centuari-eth.png", value: "eth", label: "Ethereum" },
  { logo: "/tokens/centuari-arbitrum.png", value: "arb", label: "Arbitrum" },
  { logo: "/tokens/centuari-usdc.png", value: "usdc", label: "USDC" },
  { logo: "/tokens/centuari-usdt.png", value: "usdt", label: "USDT" },
  { logo: "/tokens/centuari-dai.png", value: "dai", label: "DAI" },
  {
    logo: "/tokens/centuari-centuari.png",
    value: "centuari",
    label: "Centuari",
  },
];

export function BorrowForm() {
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
        <div className="text-center text-white/60 md:h-full md:flex md:flex-col">
          <form action="" className="md:h-full md:flex md:flex-col">
            <ScrollArea className="h-auto md:flex-1 md:min-h-0">
              <CentuariInput
                id="amount"
                label="Amount to Borrow"
                size="large"
                placeholder="Placeholder"
                leftIcon={
                  <Image
                    src="/tokens/usdc-icon.svg"
                    alt="usdc icon"
                    width={16}
                    height={16}
                  />
                }
                rightIcon={
                  <Button variant={"link"} className="px-0" type="button">
                    Max
                  </Button>
                }
                balanceText="$1,000"
                className="mt-0"
                containerClassName="mt-3.5"
              />
              {/* <SelectSingleToken /> */}
              <div className="mt-3">
                <Label className="mb-2">Collateral</Label>
                <MultiSelect
                  options={tokenList}
                  onValueChange={(values) => console.log(values)}
                  placeholder="Select Coins"
                  variant="default"
                  maxCount={2}
                />
              </div>
              <SelectMaturity />
              <div>
                <Label className="mb-2 mt-2.5">
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
                  <div className="px-2 py-4 z-20 -mt-2 border-t-0 border-white/5 rounded-b-lg">
                    <p className="text-xs text-muted-foreground text-center">
                      If USDC drops{" "}
                      <span className="text-white font-medium">below $000</span>
                      , your position could be liquidated.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollArea>
            <Button
              type="button"
              variant="primary"
              className="w-full mt-3.5 md:shrink-0"
            >
              Borrow
            </Button>
          </form>
        </div>
      </TabsContent>

      <TabsContent
        value="market"
        className="md:flex-1 md:min-h-0 md:flex md:flex-col"
      >
        <div className="text-center text-white/60 md:h-full md:flex md:flex-col">
          <form action="" className="md:h-full md:flex md:flex-col">
            <ScrollArea className="h-auto md:flex-1 md:min-h-0">
              <CentuariInput
                id="amount"
                label="Amount to Borrow"
                size="large"
                placeholder="Placeholder"
                leftIcon={
                  <Image
                    src="/tokens/usdc-icon.svg"
                    alt="usdc icon"
                    width={16}
                    height={16}
                  />
                }
                rightIcon={
                  <Button variant={"link"} className="px-0" type="button">
                    Max
                  </Button>
                }
                balanceText="$1,000"
                className="mt-0"
                containerClassName="mt-3.5"
              />
              <div className="mt-3">
                <Label className="mb-2 mt-2.5">Collateral</Label>
                <MultiSelect
                  options={tokenList}
                  onValueChange={(values) => console.log(values)}
                  placeholder="Select Coins"
                  variant="default"
                  maxCount={2}
                />
              </div>
              <div>
                <Label className="mb-2 mt-3.5">
                  Maturity{" "}
                  <CentuariTooltip message="Maturity is the duration for which you want to borrow assets.">
                    <Info size={16} />
                  </CentuariTooltip>
                </Label>
                <MaturityToggle />
              </div>
              <div>
                <Label className="mb-2 mt-2.5">
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
                  <div className="px-2 py-4 z-20 -mt-2 border-t-0 border-white/5 rounded-b-lg">
                    <p className="text-xs text-muted-foreground text-center">
                      If USDC drops{" "}
                      <span className="text-white font-medium">below $000</span>
                      , your position could be liquidated.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollArea>
            <Button
              type="button"
              variant="primary"
              className="w-full mt-3.5 md:shrink-0"
            >
              Borrow
            </Button>
          </form>
        </div>
      </TabsContent>
    </Tabs>
  );
}
