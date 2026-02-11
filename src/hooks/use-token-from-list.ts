"use client";

import { useState, useEffect } from "react";
import { getDefaultTokenFromList } from "@/lib/utils";
import type { TokenOption } from "@/types";

export function useTokenFromList(
  tokenList: TokenOption[],
  selectedTokenProp?: TokenOption,
  defaultSlug: string = "usdc"
) {
  const defaultToken =
    getDefaultTokenFromList(tokenList, defaultSlug) ??
    ({
      logo: defaultSlug === "usdt" ? "/tokens/centuari-usdt.png" : "/tokens/usdc-icon.svg",
      value: defaultSlug,
      label: defaultSlug.toUpperCase(),
    } as TokenOption);

  const [selectedToken, setSelectedToken] = useState<TokenOption>(() => {
    if (selectedTokenProp) return selectedTokenProp;
    return defaultToken;
  });

  useEffect(() => {
    if (selectedTokenProp) {
      setSelectedToken(selectedTokenProp);
    }
  }, [selectedTokenProp]);

  return { selectedToken, setSelectedToken };
}
