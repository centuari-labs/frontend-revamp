import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTokenFromList } from "@/hooks/use-token-from-list";

const tokenList = [
  { logo: "/tokens/usdc-icon.svg", value: "usdc", label: "USDC" },
  { logo: "/tokens/xsgd-icon.png", value: "xsgd", label: "XSGD" },
  { logo: "/tokens/idrx-icon.png", value: "idrx", label: "IDRX" },
];

describe("useTokenFromList", () => {
  it("defaults to usdc from list", () => {
    const { result } = renderHook(() => useTokenFromList(tokenList));
    expect(result.current.selectedToken.value).toBe("usdc");
  });

  it("uses selectedTokenProp when provided", () => {
    const prop = tokenList[1]; // xsgd
    const { result } = renderHook(() => useTokenFromList(tokenList, prop));
    expect(result.current.selectedToken.value).toBe("xsgd");
  });

  it("uses custom defaultSlug", () => {
    const { result } = renderHook(() =>
      useTokenFromList(tokenList, undefined, "idrx"),
    );
    expect(result.current.selectedToken.value).toBe("idrx");
  });

  it("falls back to first item when slug not in list", () => {
    // getDefaultTokenFromList returns list[0] when slug not found
    const { result } = renderHook(() =>
      useTokenFromList(tokenList, undefined, "unknown"),
    );
    expect(result.current.selectedToken.value).toBe("usdc");
  });

  it("constructs fallback token for empty list", () => {
    const { result } = renderHook(() =>
      useTokenFromList([], undefined, "usdt"),
    );
    // getDefaultTokenFromList returns undefined for empty list, so hook constructs
    expect(result.current.selectedToken.value).toBe("usdt");
    expect(result.current.selectedToken.label).toBe("USDT");
  });

  it("setSelectedToken updates selection", () => {
    const { result } = renderHook(() => useTokenFromList(tokenList));
    act(() => {
      result.current.setSelectedToken(tokenList[2]);
    });
    expect(result.current.selectedToken.value).toBe("idrx");
  });
});
