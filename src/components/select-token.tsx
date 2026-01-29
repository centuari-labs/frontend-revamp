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
import Image from "next/image";
import { TOKENS } from "@/lib/tokens";

interface SelectTokenProps {
  value?: string;
  onValueChange?: (value: string) => void;
}

export function SelectToken({ value, onValueChange }: SelectTokenProps) {
  const id = React.useId();
  const [internalToken, setInternalToken] = React.useState("usdc");

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
        <SelectContent className="z-[120] bg-white/5 backdrop-blur-[140px]">
          <SelectGroup>
            {TOKENS.map((token) => (
              <SelectItem key={token.value} value={token.value}>
                <Image
                  src={token.icon}
                  width={16}
                  height={16}
                  alt={token.label}
                />
                {token.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
