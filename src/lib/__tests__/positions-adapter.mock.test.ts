import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  getBestLendAPRDisplay,
  getBestBorrowAPRDisplay,
  getCollateralFactorDisplay,
  getBestLendAPR,
  getBestBorrowAPR,
  getOpenOrders,
  getAllTransactions,
  getAllPositions,
  submitOpenOrder,
  submitFilledLendPosition,
  submitFilledBorrowPosition,
  updateOpenOrder,
  updateFilledPosition,
  deleteOpenOrder,
  deleteFilledPosition,
  withdrawLendPosition,
  repayBorrowPosition,
  buildLendLimitPosition,
  buildLendMarketPosition,
  buildBorrowLimitPosition,
  buildBorrowMarketPosition,
  mockDelay,
} from "@/lib/positions-adapter.mock";
import {
  makeLendPosition,
  makeBorrowPosition,
} from "@/__tests__/helpers/fixtures/positions";

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

// Helper to advance past mockDelay
async function advanceDelay() {
  vi.advanceTimersByTime(1600);
  // Flush microtasks
  await vi.runAllTimersAsync();
}

// ─── APR helpers ─────────────────────────────────────────────────────

describe("APR helpers", () => {
  it("getBestLendAPRDisplay returns string for known token", () => {
    expect(getBestLendAPRDisplay("usdc")).toBe("6,5%");
    expect(getBestLendAPRDisplay("xsgd")).toBe("5,2%");
  });

  it("getBestBorrowAPRDisplay returns string for known token", () => {
    expect(getBestBorrowAPRDisplay("usdc")).toBe("10,1%");
  });

  it("getCollateralFactorDisplay returns string", () => {
    expect(getCollateralFactorDisplay("usdc")).toBe("75%");
  });

  it("getBestLendAPR returns numeric percentage", () => {
    expect(getBestLendAPR("usdc")).toBe(6.5);
    expect(getBestLendAPR("idrx")).toBe(7.1);
  });

  it("getBestBorrowAPR returns numeric percentage", () => {
    expect(getBestBorrowAPR("usdc")).toBe(10.1);
    expect(getBestBorrowAPR("usdt")).toBe(9.8);
  });

  it("returns fallback for unknown token", () => {
    expect(getBestLendAPRDisplay("zzz")).toBe("6,0%");
    expect(getBestBorrowAPR("zzz")).toBe(9.5);
  });
});

// ─── Storage read helpers ────────────────────────────────────────────

describe("storage read helpers", () => {
  it("getOpenOrders returns empty array when no data", () => {
    expect(getOpenOrders()).toEqual([]);
  });

  it("getAllTransactions returns empty array when no data", () => {
    expect(getAllTransactions()).toEqual([]);
  });

  it("getAllPositions returns both", () => {
    const result = getAllPositions();
    expect(result).toHaveProperty("openOrders");
    expect(result).toHaveProperty("allTransactions");
  });
});

// ─── submitOpenOrder ─────────────────────────────────────────────────

describe("submitOpenOrder", () => {
  it("adds position to open orders storage", async () => {
    const pos = makeLendPosition({ status: "pending" });
    const promise = submitOpenOrder(pos);
    await advanceDelay();
    const result = await promise;

    expect(result.id).toBe(pos.id);
    const stored = getOpenOrders();
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(pos.id);
  });

  it("appends to existing orders", async () => {
    const pos1 = makeLendPosition({ id: "a" });
    const pos2 = makeLendPosition({ id: "b" });

    const p1 = submitOpenOrder(pos1);
    await advanceDelay();
    await p1;

    const p2 = submitOpenOrder(pos2);
    await advanceDelay();
    await p2;

    expect(getOpenOrders()).toHaveLength(2);
  });
});

// ─── submitFilledLendPosition ────────────────────────────────────────

describe("submitFilledLendPosition", () => {
  it("adds new lend position to transactions", async () => {
    const pos = makeLendPosition();
    const promise = submitFilledLendPosition(pos, {
      amountInUsd: 1000,
      tokenValue: "usdc",
    });
    await advanceDelay();
    await promise;

    expect(getAllTransactions()).toHaveLength(1);
  });

  it("merges with existing position of same token+maturity", async () => {
    const maturity = Date.now() + 86400000;
    const pos1 = makeLendPosition({
      id: "a",
      tokenValue: "usdc",
      maturity,
      amount: 1000,
      apr: 0.06,
    });
    const pos2 = makeLendPosition({
      id: "b",
      tokenValue: "usdc",
      maturity,
      amount: 500,
      apr: 0.08,
    });

    const p1 = submitFilledLendPosition(pos1, { amountInUsd: 1000, tokenValue: "usdc" });
    await advanceDelay();
    await p1;

    const p2 = submitFilledLendPosition(pos2, { amountInUsd: 500, tokenValue: "usdc" });
    await advanceDelay();
    const merged = await p2;

    expect(getAllTransactions()).toHaveLength(1);
    expect(merged.amount).toBe(1500);
    // Weighted APR: (1000*0.06 + 500*0.08) / 1500 = 100/1500 = 0.0667
    expect(merged.apr).toBeCloseTo(0.0667, 3);
  });

  it("updates portfolio balance", async () => {
    localStorage.setItem(
      "centuari_portfolio",
      JSON.stringify({ usdc: 5000 }),
    );

    const pos = makeLendPosition({ tokenValue: "usdc" });
    const promise = submitFilledLendPosition(pos, {
      amountInUsd: 1000,
      tokenValue: "usdc",
    });
    await advanceDelay();
    await promise;

    const portfolio = JSON.parse(localStorage.getItem("centuari_portfolio")!);
    expect(portfolio.usdc).toBe(4000);
  });

  it("updates total supply", async () => {
    const pos = makeLendPosition();
    const promise = submitFilledLendPosition(pos, {
      amountInUsd: 2000,
      tokenValue: "usdc",
    });
    await advanceDelay();
    await promise;

    expect(parseFloat(localStorage.getItem("centuari_total_supply")!)).toBe(2000);
  });
});

// ─── submitFilledBorrowPosition ──────────────────────────────────────

describe("submitFilledBorrowPosition", () => {
  it("adds new borrow position to transactions", async () => {
    const pos = makeBorrowPosition();
    const promise = submitFilledBorrowPosition(pos, { amount: 500 });
    await advanceDelay();
    await promise;

    expect(getAllTransactions()).toHaveLength(1);
  });

  it("merges with existing position (weighted APR + union collateral)", async () => {
    const maturity = Date.now() + 86400000;
    const pos1 = makeBorrowPosition({
      id: "a",
      tokenValue: "usdc",
      maturity,
      amount: 1000,
      apr: 0.10,
      collateralTokens: ["btc"],
    });
    const pos2 = makeBorrowPosition({
      id: "b",
      tokenValue: "usdc",
      maturity,
      amount: 500,
      apr: 0.12,
      collateralTokens: ["eth"],
    });

    const p1 = submitFilledBorrowPosition(pos1, { amount: 1000 });
    await advanceDelay();
    await p1;

    const p2 = submitFilledBorrowPosition(pos2, { amount: 500 });
    await advanceDelay();
    const merged = await p2;

    expect(getAllTransactions()).toHaveLength(1);
    expect(merged.amount).toBe(1500);
    expect(merged.collateralTokens).toContain("btc");
    expect(merged.collateralTokens).toContain("eth");
  });

  it("updates total debt", async () => {
    const pos = makeBorrowPosition();
    const promise = submitFilledBorrowPosition(pos, { amount: 300 });
    await advanceDelay();
    await promise;

    expect(parseFloat(localStorage.getItem("centuari_total_debt")!)).toBe(300);
  });
});

// ─── updateOpenOrder ─────────────────────────────────────────────────

describe("updateOpenOrder", () => {
  it("replaces existing order by id", async () => {
    const pos = makeLendPosition({ id: "x", amount: 100, status: "pending" });
    const p1 = submitOpenOrder(pos);
    await advanceDelay();
    await p1;

    const updated = { ...pos, amount: 200 };
    const p2 = updateOpenOrder(updated);
    await advanceDelay();
    await p2;

    const orders = getOpenOrders();
    expect(orders).toHaveLength(1);
    expect(orders[0].amount).toBe(200);
  });

  it("appends if id not found", async () => {
    const pos = makeLendPosition({ id: "new", status: "pending" });
    const promise = updateOpenOrder(pos);
    await advanceDelay();
    await promise;

    expect(getOpenOrders()).toHaveLength(1);
  });
});

// ─── deleteOpenOrder ─────────────────────────────────────────────────

describe("deleteOpenOrder", () => {
  it("removes order by id", async () => {
    const pos = makeLendPosition({ id: "del" });
    const p1 = submitOpenOrder(pos);
    await advanceDelay();
    await p1;

    expect(getOpenOrders()).toHaveLength(1);

    const p2 = deleteOpenOrder("del");
    await advanceDelay();
    await p2;

    expect(getOpenOrders()).toHaveLength(0);
  });
});

// ─── deleteFilledPosition ────────────────────────────────────────────

describe("deleteFilledPosition", () => {
  it("removes filled position by id", async () => {
    const pos = makeLendPosition({ id: "fp1" });
    const p1 = submitFilledLendPosition(pos, { amountInUsd: 100, tokenValue: "usdc" });
    await advanceDelay();
    await p1;

    expect(getAllTransactions()).toHaveLength(1);

    const p2 = deleteFilledPosition("fp1");
    await advanceDelay();
    await p2;

    expect(getAllTransactions()).toHaveLength(0);
  });
});

// ─── withdrawLendPosition ────────────────────────────────────────────

describe("withdrawLendPosition", () => {
  it("reduces position amount", async () => {
    const pos = makeLendPosition({ id: "w1", marketId: "market-w1", amount: 1000 });
    const p1 = submitFilledLendPosition(pos, { amountInUsd: 1000, tokenValue: "usdc" });
    await advanceDelay();
    await p1;

    const p2 = withdrawLendPosition({
      marketId: "market-w1",
      amount: 400,
      tokenValue: "usdc",
    });
    await advanceDelay();
    await p2;

    const positions = getAllTransactions();
    expect(positions).toHaveLength(1);
    expect(positions[0].amount).toBe(600);
  });

  it("removes position when amount below 0.01", async () => {
    const pos = makeLendPosition({ id: "w2", marketId: "market-w2", amount: 5 });
    const p1 = submitFilledLendPosition(pos, { amountInUsd: 5, tokenValue: "usdc" });
    await advanceDelay();
    await p1;

    const p2 = withdrawLendPosition({
      marketId: "market-w2",
      amount: 5,
      tokenValue: "usdc",
    });
    await advanceDelay();
    await p2;

    expect(getAllTransactions()).toHaveLength(0);
  });

  it("increases portfolio balance", async () => {
    localStorage.setItem("centuari_portfolio", JSON.stringify({ usdc: 1000 }));
    const pos = makeLendPosition({ id: "w3", marketId: "market-w3", amount: 500 });
    const p1 = submitFilledLendPosition(pos, { amountInUsd: 500, tokenValue: "usdc" });
    await advanceDelay();
    await p1;

    const p2 = withdrawLendPosition({
      marketId: "market-w3",
      amount: 200,
      tokenValue: "usdc",
    });
    await advanceDelay();
    await p2;

    const portfolio = JSON.parse(localStorage.getItem("centuari_portfolio")!);
    expect(portfolio.usdc).toBe(700);
  });
});

// ─── repayBorrowPosition ─────────────────────────────────────────────

describe("repayBorrowPosition", () => {
  it("reduces borrow amount", async () => {
    const pos = makeBorrowPosition({ id: "r1", marketId: "market-r1", amount: 1000 });
    const p1 = submitFilledBorrowPosition(pos, { amount: 1000 });
    await advanceDelay();
    await p1;

    const p2 = repayBorrowPosition({
      marketId: "market-r1",
      amount: 300,
      futureAmount: 310,
      tokenValue: "usdc",
    });
    await advanceDelay();
    await p2;

    const positions = getAllTransactions();
    expect(positions).toHaveLength(1);
    expect(positions[0].amount).toBe(700);
  });

  it("removes position when amount below 0.01", async () => {
    const pos = makeBorrowPosition({ id: "r2", marketId: "market-r2", amount: 10 });
    const p1 = submitFilledBorrowPosition(pos, { amount: 10 });
    await advanceDelay();
    await p1;

    const p2 = repayBorrowPosition({
      marketId: "market-r2",
      amount: 10,
      futureAmount: 10.5,
      tokenValue: "usdc",
    });
    await advanceDelay();
    await p2;

    expect(getAllTransactions()).toHaveLength(0);
  });

  it("reduces total debt", async () => {
    localStorage.setItem("centuari_total_debt", "5000");
    const pos = makeBorrowPosition({ id: "r3", marketId: "market-r3", amount: 1000 });
    const p1 = submitFilledBorrowPosition(pos, { amount: 1000 });
    await advanceDelay();
    await p1;

    const p2 = repayBorrowPosition({
      marketId: "market-r3",
      amount: 400,
      futureAmount: 420,
      tokenValue: "usdc",
    });
    await advanceDelay();
    await p2;

    const debt = parseFloat(localStorage.getItem("centuari_total_debt")!);
    expect(debt).toBe(5600);
  });
});

// ─── build helpers ───────────────────────────────────────────────────

describe("buildLendLimitPosition", () => {
  it("creates lend limit position with correct fields", () => {
    const pos = buildLendLimitPosition({
      tokenValue: "usdc",
      tokenLogo: "/tokens/usdc-icon.webp",
      tokenLabel: "USDC",
      amount: 100,
      amountInUsd: 100,
      targetApr: 0.065,
      maturity: 1000,
    });
    expect(pos.type).toBe("lend");
    expect(pos.orderType).toBe("limit");
    expect(pos.apr).toBe(0.065);
    expect(pos.status).toBe("pending");
    expect(pos.id).toMatch(/^lend-usdc-/);
  });

  it("preserves editing position id", () => {
    const existing = makeLendPosition({ id: "keep-me" });
    const pos = buildLendLimitPosition({
      tokenValue: "usdc",
      tokenLogo: "/tokens/usdc-icon.webp",
      tokenLabel: "USDC",
      amount: 100,
      amountInUsd: 100,
      targetApr: 0.065,
      maturity: 1000,
      editingPosition: existing,
    });
    expect(pos.id).toBe("keep-me");
  });
});

describe("buildLendMarketPosition", () => {
  it("creates lend market position with best APR", () => {
    const pos = buildLendMarketPosition({
      tokenValue: "usdc",
      tokenLogo: "/tokens/usdc-icon.webp",
      tokenLabel: "USDC",
      amount: 100,
      amountInUsd: 100,
      maturity: 1000,
    });
    expect(pos.type).toBe("lend");
    expect(pos.orderType).toBe("market");
    expect(pos.status).toBe("success");
    // APR should be getBestLendAPR("usdc") / 100 = 0.065
    expect(pos.apr).toBeCloseTo(0.065, 3);
  });
});

describe("buildBorrowLimitPosition", () => {
  it("creates borrow limit position", () => {
    const pos = buildBorrowLimitPosition({
      tokenValue: "usdt",
      tokenLogo: "/tokens/centuari-usdt.png",
      tokenLabel: "USDT",
      amount: 500,
      maturity: 2000,
      targetApr: 0.1,
      collateralTokens: ["btc", "eth"],
    });
    expect(pos.type).toBe("borrow");
    expect(pos.orderType).toBe("limit");
    expect(pos.collateralTokens).toEqual(["btc", "eth"]);
    expect(pos.status).toBe("pending");
  });
});

describe("buildBorrowMarketPosition", () => {
  it("creates borrow market position with best APR", () => {
    const pos = buildBorrowMarketPosition({
      tokenValue: "usdc",
      tokenLogo: "/tokens/usdc-icon.webp",
      tokenLabel: "USDC",
      amount: 300,
      maturity: 3000,
      collateralTokens: ["eth"],
    });
    expect(pos.type).toBe("borrow");
    expect(pos.orderType).toBe("market");
    expect(pos.status).toBe("success");
    expect(pos.apr).toBeCloseTo(0.101, 3);
  });
});

// ─── mockDelay ───────────────────────────────────────────────────────

describe("mockDelay", () => {
  it("resolves after default delay", async () => {
    let resolved = false;
    const p = mockDelay().then(() => {
      resolved = true;
    });
    expect(resolved).toBe(false);
    vi.advanceTimersByTime(1500);
    await p;
    expect(resolved).toBe(true);
  });

  it("respects custom delay", async () => {
    let resolved = false;
    const p = mockDelay(500).then(() => {
      resolved = true;
    });
    vi.advanceTimersByTime(499);
    await Promise.resolve();
    expect(resolved).toBe(false);
    vi.advanceTimersByTime(2);
    await p;
    expect(resolved).toBe(true);
  });
});
