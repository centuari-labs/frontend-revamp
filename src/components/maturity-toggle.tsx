import * as React from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function MaturityToggle() {
  const [value, setValue] = React.useState("7 Day");

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      spacing={2}
      size={"lg"}
      className="w-full"
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
          className="data-[state=on]:bg-primary-blue-base/20 data-[state=on]:border-primary-blue-base flex-1"
        >
          {item}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
