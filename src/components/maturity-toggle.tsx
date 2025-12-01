"use client";
import * as React from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export function MaturityToggle({ className }: { className?: string }) {
  const [value, setValue] = React.useState("7 Day");

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      spacing={2}
      size={"lg"}
      className={cn("w-full grid sm:grid-cols-2 xl:grid-cols-4", className)}
      value={value}
      onValueChange={(newValue) => {
        if (newValue) setValue(newValue);
      }}
    >
      {["7 Day", "1 Month", "3 Month", "1 Year"].map((item) => (
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
