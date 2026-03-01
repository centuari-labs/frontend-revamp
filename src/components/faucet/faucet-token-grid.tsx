"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { CentuariTypography } from "@/components/centuari-typography";
import { CentuariButton } from "@/components/centuari-button";
import { FAUCET_CATEGORIES, FAUCET_TOKENS } from "@/lib/faucet-tokens";
import { FaucetTokenCard } from "./faucet-token-card";
import { useFaucetDrip } from "@/hooks/use-faucet-drip";

export function FaucetTokenGrid() {
  const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState("all");
  const { requestDrip, status, error, reset } = useFaucetDrip();

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

  const handleRequestDrip = async () => {
    const tokens = Array.from(selectedTokens);
    const result = await requestDrip(tokens);
    if (result) {
      setSelectedTokens(new Set());
    }
  };

  // Auto-reset success/error status after 3 seconds
  useEffect(() => {
    if (status === "success" || status === "error") {
      const timer = setTimeout(reset, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, reset]);

  const isLoading = status === "loading";

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
      {(selectedTokens.size > 0 || status === "success" || status === "error") && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-7xl px-6">
          <div className={cn(
            "backdrop-blur-xl border rounded-2xl shadow-2xl shadow-black/40",
            status === "success"
              ? "bg-emerald-900/80 border-emerald-500/30"
              : status === "error"
                ? "bg-red-900/80 border-red-500/30"
                : "bg-primary-blue-100/80 border-white/10"
          )}>
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                {status === "success" ? (
                  <>
                    <CentuariTypography variant="title-md" className="font-semibold">
                      Tokens Dripped Successfully
                    </CentuariTypography>
                    <CentuariTypography
                      variant="subheading-sm"
                      className="text-emerald-300/60 uppercase tracking-wider"
                    >
                      Check your wallet
                    </CentuariTypography>
                  </>
                ) : status === "error" ? (
                  <>
                    <CentuariTypography variant="title-md" className="font-semibold">
                      Drip Failed
                    </CentuariTypography>
                    <CentuariTypography
                      variant="subheading-sm"
                      className="text-red-300/60 uppercase tracking-wider"
                    >
                      {error ?? "Something went wrong"}
                    </CentuariTypography>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
              {status !== "success" && status !== "error" && (
                <CentuariButton
                  variant="primary"
                  onClick={handleRequestDrip}
                  disabled={isLoading}
                >
                  {isLoading ? "Requesting..." : "Request Drip \u2192"}
                </CentuariButton>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
