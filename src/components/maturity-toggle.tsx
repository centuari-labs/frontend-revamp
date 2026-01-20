"use client";
import * as React from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

interface MaturityToggleProps {
  className?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function MaturityToggle({ className, value: valueProp, onValueChange: onValueChangeProp }: MaturityToggleProps) {
  const [internalValue, setInternalValue] = React.useState("1 Jan 2026");

  const value = valueProp !== undefined ? valueProp : internalValue;
  const handleValueChange = (newValue: string) => {
    if (onValueChangeProp) {
      onValueChangeProp(newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      spacing={2}
      size={"lg"}
      className={cn("w-full grid sm:grid-cols-2 xl:grid-cols-3", className)}
      value={value}
      onValueChange={(newValue) => {
        if (newValue) handleValueChange(newValue);
      }}
    >
      {["1 Feb 2026", "1 Mar 2026", "1 Apr 2026"].map((item) => (
        <ToggleGroupItem
          key={item}
          value={item}
          aria-label={`Toggle ${item}`}
          className="data-[state=on]:bg-primary-blue-base/20 h-9 data-[state=on]:border-primary-blue-base flex-1"
        >
          {item}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
