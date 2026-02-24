import { describe, it, expect } from "vitest";
import { CHAINS, getChainIcon, getChainByValue } from "@/lib/chains";

describe("CHAINS", () => {
  it("has 4 chains", () => {
    expect(CHAINS).toHaveLength(4);
  });

  it("includes Arbitrum and Ethereum", () => {
    const values = CHAINS.map((c) => c.value);
    expect(values).toContain("arbitrum");
    expect(values).toContain("eth");
  });
});

describe("getChainIcon", () => {
  it("returns icon for known chain", () => {
    const icon = getChainIcon("arbitrum");
    expect(icon).toContain("coingecko");
  });

  it("returns Ethereum icon as default", () => {
    const ethIcon = CHAINS.find((c) => c.value === "eth")!.icon;
    expect(getChainIcon("unknown")).toBe(ethIcon);
  });
});

describe("getChainByValue", () => {
  it("finds chain by value", () => {
    const chain = getChainByValue("base");
    expect(chain).toBeDefined();
    expect(chain!.label).toBe("Base");
  });

  it("returns undefined for unknown", () => {
    expect(getChainByValue("zzz")).toBeUndefined();
  });
});
