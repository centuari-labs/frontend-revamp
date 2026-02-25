"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatMaturityTimestamp,
} from "@/lib/maturity";

export interface TargetAprMaturityInputProps {
  value: string;
  onChange: (value: string) => void;
  maturity: number;
  onMaturityChange: (ts: number) => void;
  maturityOptions: number[];
  id?: string;
  placeholder?: string;
  label?: string;
}

export function TargetAprMaturityInput({
  value,
  onChange,
  maturity,
  onMaturityChange,
  maturityOptions,
  id = "target-apr",
  placeholder = "12.5",
  label = "Target APR",
}: TargetAprMaturityInputProps) {
  const maturitySelectRef = useRef<HTMLButtonElement | null>(null);
  const [maturitySelectPadding, setMaturitySelectPadding] = useState(88);

  useEffect(() => {
    const updatePadding = () => {
      if (!maturitySelectRef.current) return;
      const rect = maturitySelectRef.current.getBoundingClientRect();
      setMaturitySelectPadding(rect.width + 16);
    };

    const timeoutId = setTimeout(updatePadding, 0);
    const observer = new ResizeObserver(updatePadding);

    if (maturitySelectRef.current) {
      observer.observe(maturitySelectRef.current);
    }
    updatePadding();

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [maturity]);

  return (
    <div className="w-full space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <Label htmlFor={id}>{label}</Label>
        </div>
      )}
      <div className="relative">
        <Input
          id={id}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            const v = e.target.value.replace(/[^\d.,]/g, "");
            onChange(v);
          }}
          className="peer h-9 text-base bg-[#1a1d24] border-[#2a2e38] focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-search-cancel-button]:appearance-none"
          style={{ paddingLeft: maturitySelectPadding }}
        />
        <span className="absolute inset-y-0 right-3 flex items-center text-muted-foreground">
          %
        </span>
        <div className="absolute inset-y-0 left-1 flex items-center">
          <Select
            value={maturity.toString()}
            onValueChange={(v) => onMaturityChange(Number(v))}
          >
            <SelectTrigger
              ref={maturitySelectRef}
              className="!h-7 w-auto border-0 bg-transparent px-2 py-1 focus:ring-0 focus:ring-offset-0 gap-1"
            >
              <SelectValue placeholder="Select Maturity" />
            </SelectTrigger>
            <SelectContent className="bg-white/5 backdrop-blur-[140px]">
              <SelectGroup>
                {maturityOptions.map((ts) => (
                  <SelectItem key={ts} value={ts.toString()}>
                    {formatMaturityTimestamp(ts)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
