"use client";

import Image from "next/image";
import { StatCard } from "./stat-card";
import { cn } from "@/lib/utils";

export interface StatRowItem {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  id?: string;
}

export interface StatRowProps {
  items: StatRowItem[];
  showSeparator?: boolean;
  layout?: "grid" | "flex";
  statCardVariant?: "default" | "withIcon" | "compact" | "centered";
  className?: string;
}

export function StatRow({
  items,
  showSeparator = false,
  layout = "flex",
  statCardVariant = "centered",
  className,
}: StatRowProps) {
  return (
    <div
      className={cn(
        layout === "grid"
          ? "grid grid-cols-2 md:flex md:flex-row gap-4 md:gap-12"
          : "flex flex-col md:flex-row items-center gap-6 md:gap-12",
        className,
      )}
    >
      {items.map((item, index) => (
        <span key={item.label} className="contents">
          {index > 0 && showSeparator && (
            <Image
              src="/assets/separator.svg"
              alt="Separator"
              width={1}
              height={37}
              className="hidden md:block"
            />
          )}
          <StatCard
            id={item.id}
            icon={item.icon}
            label={item.label}
            value={item.value}
            variant={statCardVariant}
          />
        </span>
      ))}
    </div>
  );
}
