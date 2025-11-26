import { CentuariCalender } from "@/components/centuari-calender";
import { CentuariTable } from "@/components/centuari-table";
import { PortfolioChart } from "@/components/portfolio/portfolio-chart";
import { PortfolioHeader } from "@/components/portfolio/portfolio-header";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, Calendar, CalendarRange, Flag } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PortfolioPage() {
  return (
    <div className="relative w-full mt-14">
      <div className="w-full max-w-6xl xl:max-w-[88rem] 2xl:max-w-[140rem] mx-auto px-4 2xl:min-h-[calc(100vh-6rem)]">
        <PortfolioHeader />
        <div className="grid grid-cols-4 gap-2 mt-4">
          <div className="col-span-1 bg-white/5 rounded-lg h-[415px] px-3">
            <PortfolioChart />
            <div className="bg-white/5 p-3 rounded-xl">
              {[
                {
                  label: "Available Balance",
                  color: "bg-[#2A4AC2]",
                  value: "60%",
                },
                {
                  label: "Supplied Assets",
                  color: "bg-[#AAC7F9]",
                  value: "30%",
                },
                {
                  label: "Borrowed Assets",
                  color: "bg-[#4F8FFD]",
                  value: "10%",
                },
              ].map((item, idx) => (
                <div
                  key={item.label}
                  className={`flex items-center justify-between py-2 ${
                    idx !== 0 ? "border-t border-white/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 ${item.color} border border-black rounded-full`}
                    />
                    <p className="text-sm">{item.label}</p>
                  </div>
                  <p className="text-sm">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="col-span-3 bg-white/5 rounded-lg h-[415px] p-4">
            <Tabs defaultValue="supplied_assets">
              <div className="mb-2 flex items-center justify-between">
                <h1 className="text-base font-medium">Your Positions</h1>
                <div className="flex items-center gap-2">
                  <TabsList className="bg-white/5">
                    <TabsTrigger
                      value="supplied_assets"
                      className="data-[state=active]:!border-none"
                    >
                      Supplied Assets
                    </TabsTrigger>
                    <TabsTrigger
                      value="borrowed_assets"
                      className="data-[state=active]:!border-none"
                    >
                      Borrowed Assets
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
              <TabsContent value="supplied_assets">
                <CentuariTable />
              </TabsContent>
              <TabsContent value="borrowed_assets">
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
          <div className="col-span-4 bg-white/5 rounded-lg h-[415px] p-4">
            <Tabs defaultValue="open_orders">
              <div className="mb-2 flex items-center justify-between">
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
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline">
                        <Calendar /> Date Range
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full bg-[#1b2029] border-0 p-0">
                      <CentuariCalender />
                    </PopoverContent>
                  </Popover>
                  <Select defaultValue="all_transaction">
                    <SelectTrigger>
                      <ArrowLeftRight color="#fff" />
                      <SelectValue
                        placeholder="Transaction Type"
                        className="text-white !placeholder:text-white"
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="all_transaction">
                          All Transaction
                        </SelectItem>
                        <SelectItem value="lend">Lend</SelectItem>
                        <SelectItem value="borrow">Borrow</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger>
                      <Flag color="#fff" />
                      <SelectValue
                        defaultValue={"all_status"}
                        placeholder="Status"
                        className="text-white !placeholder:text-white"
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="all_status">All Status</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
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
    </div>
  );
}
