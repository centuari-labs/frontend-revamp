import { describe, it, expect } from "vitest";
import {
  TOKENS,
  MARKET_TOKEN_LIST,
  getTokenLogo,
  getTokenIcon,
  getTokenByValue,
} from "@/lib/tokens";

describe("TOKENS", () => {
  it("has 8 tokens", () => {
    expect(TOKENS).toHaveLength(8);
  });

  it("includes USDC and BTC", () => {
    const values = TOKENS.map((t) => t.value);
    expect(values).toContain("usdc");
    expect(values).toContain("btc");
  });
});

describe("MARKET_TOKEN_LIST", () => {
  it("has 3 tokens", () => {
    expect(MARKET_TOKEN_LIST).toHaveLength(3);
  });

  it("includes usdc, xsgd, idrx", () => {
    const values = MARKET_TOKEN_LIST.map((t) => t.value);
    expect(values).toEqual(["usdc", "xsgd", "idrx"]);
  });
});

describe("getTokenLogo", () => {
  it("returns mapped logo for known token", () => {
    expect(getTokenLogo("usdc")).toBe("/tokens/usdc-icon.webp");
  });

  it("returns assetImg if starts with /", () => {
    expect(getTokenLogo("unknown", "/custom/logo.png")).toBe("/custom/logo.png");
  });

  it("returns default logo for unknown with no assetImg", () => {
    expect(getTokenLogo("unknown")).toBe("/tokens/usdc-icon.webp");
  });

  it("is case-insensitive", () => {
    expect(getTokenLogo("USDC")).toBe("/tokens/usdc-icon.webp");
    expect(getTokenLogo("BTC")).toBe("/tokens/btc-icon.webp");
  });
});

describe("getTokenIcon", () => {
  it("returns icon for known token", () => {
    expect(getTokenIcon("usdc")).toBe("/tokens/usdc-icon.webp");
  });

  it("returns default for unknown", () => {
    expect(getTokenIcon("zzz")).toBe("/tokens/usdt-icon.webp");
  });
});

describe("getTokenByValue", () => {
  it("finds token by value", () => {
    const token = getTokenByValue("btc");
    expect(token).toBeDefined();
    expect(token!.label).toBe("BTC");
  });

  it("returns undefined for unknown", () => {
    expect(getTokenByValue("zzz")).toBeUndefined();
  });
});
