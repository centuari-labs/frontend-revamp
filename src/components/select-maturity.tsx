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

export function SelectMaturity() {
  const id = React.useId();
  const [selectedMaturity, setSelectedMaturity] = React.useState("1 Jan 2026");

  // ref ke SelectTrigger supaya bisa ukur lebarnya
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const [leftPadding, setLeftPadding] = React.useState<number>(88); // default awal

  React.useEffect(() => {
    const updatePadding = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      // +12px biar ada gap kecil antara select dan teks input
      setLeftPadding(rect.width + 12);
    };

    updatePadding();

    // kalau size content select berubah (misal font / label berubah),
    // padding ikut menyesuaikan
    const observer = new ResizeObserver(() => {
      updatePadding();
    });

    if (triggerRef.current) {
      observer.observe(triggerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="w-full space-y-2 mt-3.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>Target APY</Label>
      </div>
      <div className="relative">
        <Input
          id={id}
          type="text"
          placeholder="Amount"
          className="peer h-9 text-base bg-[#1a1d24] border-[#2a2e38] focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-search-cancel-button]:appearance-none"
          // padding kiri dinamis, ngikut lebar select
          style={{ paddingLeft: leftPadding }}
        />
        {/* <span className="absolute inset-y-0 right-3 flex items-center">%</span> */}
        <div className="absolute inset-y-0 left-1 flex items-center">
          <Select value={selectedMaturity} onValueChange={setSelectedMaturity}>
            <SelectTrigger
              ref={triggerRef}
              className="!h-7 w-auto border-0 bg-transparent px-2 py-1 focus:ring-0 focus:ring-offset-0 gap-1"
            >
              <SelectValue placeholder="Select Maturity" />
            </SelectTrigger>
            <SelectContent className="bg-white/5 backdrop-blur-[140px]">
              <SelectGroup>
                <SelectItem value="1 Jan 2026">1 Jan 2026</SelectItem>
                <SelectItem value="1 Feb 2026">1 Feb 2026</SelectItem>
                <SelectItem value="1 Mar 2026">1 Mar 2026</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
