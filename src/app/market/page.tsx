"use client";

import { CentuariChart } from "@/components/centuari-chart";
import HealthFactor from "@/components/centuari-health-factor";
import { CentuariInput } from "@/components/centuari-input";
import { CentuariInputExample } from "@/components/centuari-input-example";
import { CentuariTable } from "@/components/centuari-table";
import { CentuariTooltip } from "@/components/centuari-tooltip";
import { CentuariTypography } from "@/components/centuari-typography";
import { IcDollarCentuari } from "@/components/icons/ic-dollar-centuari";
import { MarketHeader } from "@/components/market/market-header";
import { OrderBookCard } from "@/components/market/order-book";
import { MaturityToggle } from "@/components/maturity-toggle";
import { SelectMaturity } from "@/components/select-maturity";
import { SelectSingleToken } from "@/components/select-single-token";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info } from "lucide-react";

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

export default function Page() {
  return (
    <div className="relative w-full mt-14">
      <div className="w-full max-w-6xl xl:max-w-[88rem] 2xl:max-w-[140rem] mx-auto px-4 2xl:min-h-[calc(100vh-6rem)]">
        <MarketHeader />
        <div className="grid grid-cols-4 gap-2 mt-4">
          <div className="col-span-2 bg-white/5 rounded-md">
            <div className="px-8 py-4 items-center flex gap-10 justify-between w-full">
              <CentuariTypography className="inline-block">
                Rate History
              </CentuariTypography>
              <div>
                <Tabs defaultValue="satu">
                  <TabsList className="bg-white/5">
                    <TabsTrigger
                      value="satu"
                      className="data-[state=active]:!border-none"
                    >
                      7 D
                    </TabsTrigger>
                    <TabsTrigger
                      value="dua"
                      className="data-[state=active]:!border-none"
                    >
                      1 M
                    </TabsTrigger>
                    <TabsTrigger
                      value="tiga"
                      className="data-[state=active]:!border-none"
                    >
                      2 M
                    </TabsTrigger>
                    <TabsTrigger
                      value="empat"
                      className="data-[state=active]:!border-none"
                    >
                      3 M
                    </TabsTrigger>
                    <TabsTrigger
                      value="lima"
                      className="data-[state=active]:!border-none"
                    >
                      6 M
                    </TabsTrigger>
                    <TabsTrigger
                      value="enam"
                      className="data-[state=active]:!border-none"
                    >
                      1 Y
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
            <CentuariChart />
          </div>
          <div>
            <OrderBookCard height="500px" />
          </div>
          <div className="">
            <div className="bg-white/5 rounded-md h-[500px]">
              <Tabs defaultValue="lend" className="rounded-t-md gap-0">
                <TabsList className="bg-transparent rounded-none border-b-[1px] border-white/10 p-0 w-full justify-start">
                  <TabsTrigger
                    value="lend"
                    className="bg-transparent data-[state=active]:!bg-transparent data-[state=active]:border-primary dark:data-[state=active]:border-primary data-[state=active]:text-white text-white/40 dark:text-white/40 hover:text-white dark:hover:text-white hover:border-white/30 h-full rounded-none border-0 border-b-2 border-transparent data-[state=active]:shadow-none px-8 py-4 font-medium"
                  >
                    Lend
                  </TabsTrigger>
                  <TabsTrigger
                    value="borrow"
                    className="bg-transparent data-[state=active]:!bg-transparent data-[state=active]:border-primary dark:data-[state=active]:border-primary data-[state=active]:text-white text-white/40 dark:text-white/40 hover:text-white dark:hover:text-white hover:border-white/30 h-full rounded-none border-0 border-b-2 border-transparent data-[state=active]:shadow-none px-8 py-4 font-medium"
                  >
                    Borrow
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="lend">
                  <Tabs defaultValue="market" className="w-full p-3.5">
                    <TabsList className="bg-white/5 w-full rounded-lg">
                      <TabsTrigger
                        value="limit"
                        className="data-[state=active]:!border-none data-[state=active]:bg-transparent data-[state=active]:text-white text-white/40 rounded-md flex-1"
                      >
                        Limit
                      </TabsTrigger>
                      <TabsTrigger
                        value="market"
                        className="data-[state=active]:!border-none data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/40 rounded-md flex-1"
                      >
                        Market
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="limit">
                      <form action="">
                        <ScrollArea className="h-[340px]">
                          <CentuariInput
                            id="amount"
                            label="Supply"
                            size="large"
                            placeholder="Placeholder"
                            leftIcon={<IcDollarCentuari size={16} />}
                            rightIcon={
                              <Button
                                variant={"link"}
                                className="px-0"
                                type="button"
                              >
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
                          <div className="bg-white/5 py-3 px-4 text-sm rounded-xl rounded-b-none border border-white/5 flex flex-col gap-2 mt-5">
                            {[
                              { label: "Transaction Fee", value: "0.1%" },
                              {
                                label: "Amount to Pay Now",
                                value: "$1,001.00",
                              },
                            ].map(({ label, value }, i) => (
                              <div
                                key={label}
                                className={`flex items-center justify-between ${
                                  i < 1 ? "border-b border-dashed pb-2" : ""
                                }`}
                              >
                                <p className="flex text-muted-foreground items-center gap-2">
                                  {label}{" "}
                                  {i === 0 && (
                                    <CentuariTooltip message="Coming Soon">
                                      <Info size={12} />
                                    </CentuariTooltip>
                                  )}
                                </p>
                                <div className="flex items-center gap-1">
                                  <p>{value}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="py-3 px-4 text-sm border border-white/5 rounded-b-lg border-t-0 text-muted-foreground bg-white/5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                In the future you'll pay{" "}
                                <CentuariTooltip message="Coming Soon">
                                  <Info size={12} />
                                </CentuariTooltip>{" "}
                              </div>
                              <span className="text-transparent font-semibold bg-clip-text bg-gradient-to-r from-primary-blue-base via-white to-primary-blue-base">
                                $1,049.00
                              </span>
                            </div>
                          </div>
                        </ScrollArea>
                        <Button
                          type="button"
                          variant="primary"
                          className="w-full mt-3.5"
                        >
                          Borrow
                        </Button>
                      </form>
                    </TabsContent>

                    <TabsContent value="market">
                      <form action="">
                        <ScrollArea className="h-[340px]">
                          <CentuariInput
                            id="amount"
                            label="Supply"
                            size="large"
                            placeholder="Placeholder"
                            leftIcon={<IcDollarCentuari size={16} />}
                            rightIcon={
                              <Button
                                variant={"link"}
                                className="px-0"
                                type="button"
                              >
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
                          <div className="bg-white/5 py-3 px-4 text-sm rounded-xl rounded-b-none border border-white/5 flex flex-col gap-2 mt-5">
                            {[
                              { label: "Transaction Fee", value: "0.1%" },
                              {
                                label: "Amount to Pay Now",
                                value: "$1,001.00",
                              },
                            ].map(({ label, value }, i) => (
                              <div
                                key={label}
                                className={`flex items-center justify-between ${
                                  i < 1 ? "border-b border-dashed pb-2" : ""
                                }`}
                              >
                                <p className="flex text-muted-foreground items-center gap-2">
                                  {label}{" "}
                                  {i === 0 && (
                                    <CentuariTooltip message="Coming Soon">
                                      <Info size={12} />
                                    </CentuariTooltip>
                                  )}
                                </p>
                                <div className="flex items-center gap-1">
                                  <p>{value}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="py-3 px-4 text-sm border border-white/5 rounded-b-lg border-t-0 text-muted-foreground bg-white/5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                In the future you'll pay{" "}
                                <CentuariTooltip message="Coming Soon">
                                  <Info size={12} />
                                </CentuariTooltip>{" "}
                              </div>
                              <span className="text-transparent font-semibold bg-clip-text bg-gradient-to-r from-primary-blue-base via-white to-primary-blue-base">
                                $1,049.00
                              </span>
                            </div>
                          </div>
                        </ScrollArea>
                        <Button
                          type="button"
                          variant="primary"
                          className="w-full mt-3.5"
                        >
                          Borrow
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </TabsContent>

                <TabsContent value="borrow">
                  <Tabs defaultValue="market" className="w-full p-3.5">
                    <TabsList className="bg-white/5 w-full rounded-lg">
                      <TabsTrigger
                        value="limit"
                        className="data-[state=active]:!border-none data-[state=active]:bg-transparent data-[state=active]:text-white text-white/40 rounded-md flex-1"
                      >
                        Limit
                      </TabsTrigger>
                      <TabsTrigger
                        value="market"
                        className="data-[state=active]:!border-none data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/40 rounded-md flex-1"
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
                              <Button
                                variant={"link"}
                                className="px-0"
                                type="button"
                              >
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
                              {/* <div className="px-2 py-4 z-20 -mt-2 border-t-0 border-white/5 rounded-b-lg">
                                <p className="text-xs text-muted-foreground">
                                  If USDC drops{" "}
                                  <span className="text-white font-medium">
                                    below $000
                                  </span>
                                  , your position could be liquidated.
                                </p>
                              </div> */}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="primary"
                            className="w-full mt-3.5"
                          >
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
                              <Button
                                variant={"link"}
                                className="px-0"
                                type="button"
                              >
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
                              {/* <div className="px-2 py-4 z-20 -mt-2 border-t-0 border-white/5 rounded-b-lg">
                                <p className="text-xs text-muted-foreground">
                                  If USDC drops{" "}
                                  <span className="text-white font-medium">
                                    below $000
                                  </span>
                                  , your position could be liquidated.
                                </p>
                              </div> */}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="primary"
                            className="w-full mt-12"
                          >
                            Borrow
                          </Button>
                        </form>
                      </div>
                    </TabsContent>
                  </Tabs>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
        <div className="mt-2 bg-white/5 rounded-md p-4">
          <Tabs defaultValue="open_orders">
            <div className="mb-2 flex items-center justify-between">
              <h1 className="text-base font-medium">Position</h1>
              <div className="flex items-center gap-2">
                <Input placeholder="Search Position..." className="max-w-sm" />
                <TabsList className="bg-white/5">
                  <TabsTrigger
                    value="open_orders"
                    className="data-[state=active]:!border-none"
                  >
                    Open Orders
                  </TabsTrigger>
                  <TabsTrigger
                    value="active_position"
                    className="data-[state=active]:!border-none"
                  >
                    Active Position
                  </TabsTrigger>
                  <TabsTrigger
                    value="order_history"
                    className="data-[state=active]:!border-none"
                  >
                    Order History
                  </TabsTrigger>
                  <TabsTrigger
                    value="all_transactions"
                    className="data-[state=active]:!border-none"
                  >
                    All Transactions
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
            <TabsContent value="open_orders">
              <CentuariTable />
            </TabsContent>
            <TabsContent value="active_position">
              <CentuariTable />
            </TabsContent>
            <TabsContent value="order_history">
              <CentuariTable />
            </TabsContent>
            <TabsContent value="all_transactions">
              <CentuariTable />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
