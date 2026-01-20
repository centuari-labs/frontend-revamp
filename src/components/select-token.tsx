"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { CentuariTooltip } from "./centuari-tooltip";
import { InfoIcon } from "lucide-react";
import Image from "next/image";

interface SelectTokenProps {
  value?: string;
  onValueChange?: (value: string) => void;
}

export function SelectToken({ value, onValueChange }: SelectTokenProps) {
  const id = React.useId();
  const [internalToken, setInternalToken] = React.useState("usdt");
  
  const selectedToken = value ?? internalToken;
  const handleValueChange = (newValue: string) => {
    if (onValueChange) {
      onValueChange(newValue);
    } else {
      setInternalToken(newValue);
    }
  };
  
  return (
    <div className="w-full space-y-2 mt-3.5">
      <Label htmlFor={id}>Select Token</Label>
      <Select value={selectedToken} onValueChange={handleValueChange}>
        <SelectTrigger className="!h-9 border-0 bg-transparent px-2 py-1 focus:ring-0 focus:ring-offset-0 gap-1 w-full">
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
  );
}
