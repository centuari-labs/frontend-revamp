"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const tabTriggerClassName =
  "data-[state=active]:!border-none data-[state=active]:bg-transparent data-[state=active]:text-white text-white/40 rounded-md flex-1 text-xs sm:text-sm";
const marketTabTriggerClassName =
  "data-[state=active]:!border-none data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/40 rounded-md flex-1 text-xs sm:text-sm";

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
        <TabsTrigger value="limit" className={tabTriggerClassName}>
          Limit
        </TabsTrigger>
        <TabsTrigger value="market" className={marketTabTriggerClassName}>
          Market
        </TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
}
