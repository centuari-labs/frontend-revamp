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
import { Label } from "./ui/label";
import { CHAINS } from "@/lib/chains";

interface SelectChainProps {
  value?: string;
  onValueChange?: (value: string) => void;
}

export function SelectChain({ value, onValueChange }: SelectChainProps) {
  const id = React.useId();
  const [internalChain, setInternalChain] = React.useState("eth");

  const selectedChain = value ?? internalChain;
  const handleValueChange = (newValue: string) => {
    if (onValueChange) {
      onValueChange(newValue);
    } else {
      setInternalChain(newValue);
    }
  };

  return (
    <div className="w-full space-y-2 mt-3.5">
      <Label htmlFor={id}>Select Chain</Label>
      <Select value={selectedChain} onValueChange={handleValueChange}>
        <SelectTrigger className="!h-9 border-0 bg-transparent px-2 py-1 focus:ring-0 focus:ring-offset-0 gap-1 w-full">
          <SelectValue placeholder="Select Chain" />
        </SelectTrigger>
        <SelectContent className="z-[120] bg-white/5 backdrop-blur-[140px]">
          <SelectGroup>
            {CHAINS.map((chain) => (
              <SelectItem key={chain.value} value={chain.value}>
                <img
                  src={chain.icon}
                  alt={chain.label}
                  width={16}
                  height={16}
                  className="size-4 rounded-full object-cover"
                />
                {chain.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
