"use client";

import { WifiOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface SectionErrorProps {
  onRetry?: () => void;
  className?: string;
}

export function SectionError({ onRetry, className }: SectionErrorProps) {
  const [spinning, setSpinning] = useState(false);

  const handleRetry = () => {
    if (!onRetry) return;
    setSpinning(true);
    onRetry();
    setTimeout(() => setSpinning(false), 1000);
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-5 py-14 text-center",
        className
      )}
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-[#517FFF]/20 blur-xl scale-150" />
        <div className="relative w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <WifiOff className="w-6 h-6 text-white/50" />
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-sm font-medium text-white/70">Connection Error</p>
        <p className="text-xs text-white/40 max-w-[260px]">
          Please check your internet connection or try again later.
        </p>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={handleRetry}
          className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 px-5 py-2 rounded-lg transition-all duration-200"
        >
          <RefreshCw
            className={cn("w-3.5 h-3.5", spinning && "animate-spin")}
          />
          Try again
        </button>
      )}
    </div>
  );
}

interface SectionErrorOverlayProps {
  isError: boolean;
  onRetry?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function SectionErrorOverlay({
  isError,
  onRetry,
  children,
  className,
}: SectionErrorOverlayProps) {
  return (
    <div className={cn("relative", className)}>
      {children}
      {isError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-[inherit]">
          <SectionError onRetry={onRetry} className="py-0" />
        </div>
      )}
    </div>
  );
}
