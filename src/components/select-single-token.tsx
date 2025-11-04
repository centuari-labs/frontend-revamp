import * as React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { CentuariTooltip } from "./centuari-tooltip";
import { InfoIcon } from "lucide-react";
import HealthFactor from "./centuari-health-factor";

export function SelectSingleToken() {
  const id = React.useId();
  return (
    <div className="w-full space-y-2 mt-5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>Collateral Asset</Label>
        <div>
          <span className="text-xs text-muted-foreground">
            Available <span className="font-medium text-white">100</span> USDT
          </span>
          <CentuariTooltip message="Select the asset you want to use as collateral.">
            <InfoIcon size={12} className="ml-1 inline-block" />
          </CentuariTooltip>
        </div>
      </div>
      <div className="relative">
        <Input
          id={id}
          type="text"
          placeholder="Enter Collateral Amount"
          className="peer h-11 pr-20 pl-32 text-base bg-[#1a1d24] border-[#2a2e38] focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-search-cancel-button]:appearance-none"
        />
        <div className="absolute inset-y-0 left-1 flex items-center">
          <Select>
            <SelectTrigger className="h-auto w-auto border-0 bg-transparent px-2 py-0 focus:ring-0 focus:ring-offset-0 gap-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#26a17b] flex items-center justify-center">
                  <span className="text-white text-xs font-bold">₮</span>
                </div>
                <SelectValue
                  placeholder="USDT"
                  className="text-white font-medium"
                />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Tokens</SelectLabel>
                <SelectItem value="usdt">USDT</SelectItem>
                <SelectItem value="usdc">USDC</SelectItem>
                <SelectItem value="dai">DAI</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="absolute inset-y-0 right-3 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="h-auto px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10"
          >
            Max
          </Button>
        </div>
      </div>
    </div>
  );
}
