"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CentuariGlassLayers } from "@/components/centuari-glass-surface";

const glassTabClassName =
  "group/glass relative overflow-hidden isolate data-[state=active]:text-white data-[state=active]:border-none! bg-transparent! shadow-none! text-white/40 rounded-md flex-1 text-xs sm:text-sm";

export interface OrderTypeTabsProps {
  children: React.ReactNode;
  defaultValue?: "limit" | "market";
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function OrderTypeTabs({
  children,
  defaultValue = "limit",
  value,
  onValueChange,
  className,
}: OrderTypeTabsProps) {
  return (
    <Tabs
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
      className={className}
    >
      <TabsList className="bg-white/5 w-full rounded-lg md:shrink-0">
        <TabsTrigger value="limit" className={glassTabClassName}>
          <span className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity [[data-state=active]>&]:opacity-100">
            <CentuariGlassLayers intensity="soft" />
          </span>
          <span className="relative z-20">Limit</span>
        </TabsTrigger>
        <TabsTrigger value="market" className={glassTabClassName}>
          <span className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity [[data-state=active]>&]:opacity-100">
            <CentuariGlassLayers intensity="soft" />
          </span>
          <span className="relative z-20">Market</span>
        </TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
}
