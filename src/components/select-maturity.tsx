"use client";

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

export function SelectMaturity() {
  const id = React.useId();
  const [selectedMaturity, setSelectedMaturity] = React.useState("7 Days");

  return (
    <div className="w-full space-y-2 mt-3.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>Target APY</Label>
      </div>
      <div className="relative">
        <Input
          id={id}
          type="text"
          placeholder="Enter Maturity Amount"
          className="peer h-9 pl-28 text-base bg-[#1a1d24] border-[#2a2e38] focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-search-cancel-button]:appearance-none"
        />
        <span className="absolute inset-y-0 right-3 flex items-center">%</span>
        <div className="absolute inset-y-0 left-1 flex items-center">
          <Select value={selectedMaturity} onValueChange={setSelectedMaturity}>
            <SelectTrigger className="!h-7 w-auto border-0 bg-transparent px-2 py-1 focus:ring-0 focus:ring-offset-0 gap-1">
              <SelectValue placeholder="Select Maturity" />
            </SelectTrigger>
            <SelectContent className="bg-white/5 backdrop-blur-[140px]">
              <SelectGroup>
                <SelectItem value="7 Days">7 Days</SelectItem>
                <SelectItem value="30 Days">30 Days</SelectItem>
                <SelectItem value="90 Days">90 Days</SelectItem>
                <SelectItem value="180 Days">180 Days</SelectItem>
                <SelectItem value="1 Year">1 Year</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
