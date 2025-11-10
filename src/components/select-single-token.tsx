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
import Image from "next/image";

export function SelectSingleToken() {
  const id = React.useId();
  const [selectedToken, setSelectedToken] = React.useState("usdt");

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
          className="peer h-11 pr-20 pl-28 text-base bg-[#1a1d24] border-[#2a2e38] focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-search-cancel-button]:appearance-none"
        />
        <div className="absolute inset-y-0 left-1 flex items-center">
          <Select value={selectedToken} onValueChange={setSelectedToken}>
            <SelectTrigger className="h-auto w-auto border-0 bg-transparent px-2 py-0 focus:ring-0 focus:ring-offset-0 gap-1">
              <SelectValue placeholder="Select Token" />
            </SelectTrigger>
            <SelectContent className="bg-white/5 backdrop-blur-[140px]">
              <SelectGroup>
                <SelectItem value="usdt">
                  <Image
                    src={"/tokens/usdt-icon.svg"}
                    width={16}
                    height={16}
                    alt="USDT"
                  />
                  USDT
                </SelectItem>
                <SelectItem value="usdc">
                  <Image
                    src={"/tokens/usdc-icon.svg"}
                    width={16}
                    height={16}
                    alt="USDC"
                  />
                  USDC
                </SelectItem>
                <SelectItem value="btc">
                  <Image
                    src={"/tokens/btc-icon.svg"}
                    width={16}
                    height={16}
                    alt="BTC"
                  />
                  BTC
                </SelectItem>
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
