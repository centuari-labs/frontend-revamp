"use client";

import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { CentuariTypography } from "@/components/centuari-typography";
import { CentuariButton } from "@/components/centuari-button";
import { FaucetErrorPage } from "./faucet-error-page";
import { FaucetTokenCard } from "./faucet-token-card";
import { useFaucetDrip } from "@/hooks/use-faucet-drip";
import { useDepositTokens } from "@/hooks/use-deposit-tokens";
import type { DepositToken } from "@/lib/api";

const DRIP_AMOUNTS: Record<string, number> = {
  USDC: 5000,
  IDRX: 10000000,
  XSGD: 7000,
  BTC: 1,
  ETH: 5,
  USDT: 5000,
  XAUT: 5,
  NVDAON: 100,
  AAPLON: 100,
  SLVON: 100,
  TLTON: 100,
};

export function FaucetTokenGrid() {
  const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set());
  const { requestDrip, status, error, reset } = useFaucetDrip();
  const { data: depositTokens, isLoading: isTokensLoading } = useDepositTokens();

  const tokens = useMemo(() => {
    if (!depositTokens || depositTokens.length === 0) return [];

    return depositTokens.map((t: DepositToken) => {
      const symbol = t.symbol.toUpperCase();
      return {
        value: t.symbol.toLowerCase(),
        label: t.symbol,
        icon: t.imageUrl || "/tokens/usdc-icon.svg",
        tokenAddress: t.tokenAddress,
        dripAmount: DRIP_AMOUNTS[symbol] || 1000,
      };
    });
  }, [depositTokens]);

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
    const selectedAddresses = tokens
      .filter((t) => selectedTokens.has(t.value))
      .map((t) => t.tokenAddress);

    const result = await requestDrip(selectedAddresses);
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

  const isLoading = status === "loading" || isTokensLoading;

  if (!isTokensLoading && (!depositTokens || depositTokens.length === 0)) {
    return <FaucetErrorPage />;
  }

  return (
    <div className="mt-6 pb-28">
      {/* Token grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {tokens.map((token) => (
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
                  {isLoading && status === "loading" ? "Requesting..." : "Request Drip \u2192"}
                </CentuariButton>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
