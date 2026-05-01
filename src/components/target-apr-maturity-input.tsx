"use client";

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
import { cn } from "@/lib/utils";

export interface TargetAprMaturityInputProps {
  value: string;
  onChange: (value: string) => void;
  maturity: number;
  onMaturityChange: (ts: number) => void;
  maturityOptions: number[];
  id?: string;
  placeholder?: string;
  label?: string;
  errorText?: string | null;
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
  errorText,
}: TargetAprMaturityInputProps) {
  const hasError = Boolean(errorText);

  return (
    <div className="w-full space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <Label htmlFor={id} className="text-xs">{label}</Label>
        </div>
      )}
      <div
        className={cn(
          "flex items-center gap-0 rounded-md border bg-transparent h-9 overflow-hidden",
          hasError ? "border-red-500" : "border-[#2a2e38]",
        )}
      >
        <Select
          value={maturity.toString()}
          onValueChange={(v) => onMaturityChange(Number(v))}
        >
          <SelectTrigger className="!h-full w-auto shrink-0 border-0 rounded-none bg-transparent px-2.5 py-1 focus:ring-0 focus:ring-offset-0 gap-1">
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
        <div className="relative flex-1 min-w-0">
          <Input
            id={id}
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => {
              const v = e.target.value.replace(/[^\d.,]/g, "");
              onChange(v);
            }}
            aria-invalid={hasError}
            className="h-full border-0 rounded-none text-base focus-visible:ring-0 focus-visible:ring-offset-0 py-5 pr-8 [&::-webkit-search-cancel-button]:appearance-none"
          />
          <span className="absolute inset-y-0 right-3 flex items-center text-muted-foreground">
            %
          </span>
        </div>
      </div>
      {hasError && (
        <p className="text-red-500 text-xs mt-1">{errorText}</p>
      )}
    </div>
  );
}
