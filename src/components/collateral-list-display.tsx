"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";
import { TokenInfo } from "@/lib/portfolio-data";

interface CollateralListDisplayProps {
  selectedCollaterals: string[];
  tokenList: TokenInfo[];
  onChangeClick?: () => void;
}

export function CollateralListDisplay({
  selectedCollaterals,
  tokenList,
  onChangeClick,
}: CollateralListDisplayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (selectedCollaterals.length === 0) {
    return null;
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger row */}
      <div className="flex items-center justify-between gap-3 p-0.5 rounded-md border border-white/10 bg-white/5">
        <button
          type="button"
          className="flex items-center gap-2 flex-1 min-w-0 px-2 py-1 rounded-md transition-colors cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          {/* Token icons */}
          <div className="flex items-center -space-x-2">
            {selectedCollaterals.slice(0, 4).map((tokenValue, index) => {
              const token = tokenList.find((t) => t.value === tokenValue);
              if (!token) return null;
              return (
                <div
                  key={tokenValue}
                  className="relative"
                  style={{ zIndex: 10 - index }}
                >
                  <Image
                    src={token.logo}
                    alt={token.label}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                </div>
              );
            })}
          </div>

          {/* Badge */}
          <div className="flex items-center justify-center px-2.5 py-1 rounded-full bg-blue-600/20 border border-blue-600/30 text-blue-400 text-xs font-medium">
            {selectedCollaterals.length === 1
              ? "1 Coin selected"
              : `${selectedCollaterals.length} Coins selected`}
          </div>
        </button>

        {/* Change Button */}
        {onChangeClick ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 hover:underline hover:!bg-transparent hover:cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              onChangeClick();
            }}
          >
            Change
          </Button>
        ) : (
          <Link href="/portfolio">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0 hover:underline hover:!bg-transparent hover:cursor-pointer"
            >
              Change
            </Button>
          </Link>
        )}
      </div>

      {/* Floating card list */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 z-50 rounded-xl border border-white/15 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/60 p-2">
          <div className="flex flex-col gap-1 max-h-[240px] overflow-y-auto">
            {selectedCollaterals.map((tokenValue) => {
              const token = tokenList.find((t) => t.value === tokenValue);
              if (!token) return null;
              return (
                <div
                  key={tokenValue}
                  className="flex items-center gap-3 py-1 px-3 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <Image
                    src={token.logo}
                    alt={token.label}
                    width={28}
                    height={28}
                    className="rounded-full"
                  />
                  <span className="text-sm text-white font-medium">
                    {token.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
