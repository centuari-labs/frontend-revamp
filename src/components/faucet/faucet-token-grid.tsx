"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { CentuariTypography } from "@/components/centuari-typography";
import { CentuariButton } from "@/components/centuari-button";
import { FAUCET_CATEGORIES, FAUCET_TOKENS } from "@/lib/faucet-tokens";
import { FaucetTokenCard } from "./faucet-token-card";

export function FaucetTokenGrid() {
  const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredTokens = useMemo(() => {
    if (activeCategory === "all") return FAUCET_TOKENS;
    return FAUCET_TOKENS.filter((t) => t.category === activeCategory);
  }, [activeCategory]);

  const toggleToken = (value: string) => {
    setSelectedTokens((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  };

  return (
    <div className="mt-6 pb-28">
      {/* Category filter tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-lg w-full md:w-fit overflow-x-auto scrollbar-none">
        {FAUCET_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => setActiveCategory(cat.value)}
            className={cn(
              "flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all duration-200 text-center",
              activeCategory === cat.value
                ? "bg-white/10 text-white"
                : "text-white/50 hover:text-white/80"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Token grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {filteredTokens.map((token) => (
          <FaucetTokenCard
            key={token.value}
            token={token}
            selected={selectedTokens.has(token.value)}
            onToggle={toggleToken}
          />
        ))}
      </div>

      {/* Sticky bottom bar */}
      {selectedTokens.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-7xl px-6">
          <div className="bg-primary-blue-100/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40">
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <CentuariTypography variant="title-md" className="font-semibold">
                  {selectedTokens.size} Asset{selectedTokens.size > 1 ? "s" : ""}{" "}
                  Selected
                </CentuariTypography>
                <CentuariTypography
                  variant="subheading-sm"
                  className="text-white/40 uppercase tracking-wider"
                >
                  Ready to Drip
                </CentuariTypography>
              </div>
              <CentuariButton variant="primary">
                Request Drip &rarr;
              </CentuariButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
