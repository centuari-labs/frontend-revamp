"use client";

import * as React from "react";
import { type DateRange } from "react-day-picker";

import { Calendar } from "@/components/ui/calendar";
import { MaturityToggle } from "./maturity-toggle";
import { Button } from "./ui/button";

export function CentuariCalender() {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: new Date(2025, 5, 12),
    to: new Date(2025, 6, 15),
  });

  return (
    <div className="bg-white/5 rounded-lg border">
      <Calendar
        mode="range"
        defaultMonth={dateRange?.from}
        selected={dateRange}
        onSelect={setDateRange}
        numberOfMonths={2}
        className="shadow-sm bg-transparent"
        classNames={{
          months:
            "relative grid grid-cols-[1fr_0_1fr] " +
            "after:absolute after:top-0 after:bottom-0 " +
            "after:left-1/2 after:-translate-x-1/2 " +
            "after:w-px after:bg-white/10",
          month: "px-4 [&:first-child]:col-start-1 [&:last-child]:col-start-3",
          range_start: "bg-primary-blue-base/20 rounded-l-full",
          range_end: "bg-primary-blue-base/20 rounded-r-full",
          day_button:
            "data-[range-end=true]:rounded-full! " +
            "data-[range-start=true]:rounded-full! " +
            "data-[range-start=true]:bg-primary-blue-base! " +
            "data-[range-start=true]:text-white! " +
            "data-[range-end=true]:bg-primary-blue-base! " +
            "data-[range-end=true]:text-white! " +
            "data-[range-middle=true]:rounded-none " +
            "data-[range-middle=true]:bg-primary-blue-base/20 " +
            "hover:rounded-full",
          today:
            "data-[selected=true]:rounded-l-none! rounded-full bg-accent! " +
            "data-[selected=true]:bg-primary-blue-base/20!",
        }}
      />

      <div className="flex items-center justify-end px-4 py-3 border-t border-white/5">
        <Button variant={"secondary"}>Cancel</Button>
        <Button variant={"primary"} className="ml-2">
          Apply
        </Button>
      </div>
    </div>
  );
}
