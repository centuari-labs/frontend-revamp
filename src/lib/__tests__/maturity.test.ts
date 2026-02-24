import { describe, it, expect, vi, afterEach } from "vitest";
import {
  getAvailableMaturityTimestamps,
  getDefaultMaturityTimestamp,
  formatMaturityTimestamp,
  normalizeMaturity,
  isValidMaturityTimestamp,
} from "@/lib/maturity";

describe("getAvailableMaturityTimestamps", () => {
  it("returns exactly 3 timestamps", () => {
    const ts = getAvailableMaturityTimestamps();
    expect(ts).toHaveLength(3);
  });

  it("returns timestamps on the 1st of each month", () => {
    const ts = getAvailableMaturityTimestamps();
    for (const t of ts) {
      const d = new Date(t);
      expect(d.getDate()).toBe(1);
    }
  });

  it("returns consecutive months after now", () => {
    const ts = getAvailableMaturityTimestamps();
    const months = ts.map((t) => new Date(t).getMonth());
    expect(months[1]).toBe((months[0] + 1) % 12);
    expect(months[2]).toBe((months[1] + 1) % 12);
  });

  it("timestamps are in the future", () => {
    const now = Date.now();
    const ts = getAvailableMaturityTimestamps();
    for (const t of ts) {
      expect(t).toBeGreaterThan(now - 86400000); // within a day tolerance
    }
  });
});

describe("getDefaultMaturityTimestamp", () => {
  it("returns the first available maturity", () => {
    const def = getDefaultMaturityTimestamp();
    const all = getAvailableMaturityTimestamps();
    expect(def).toBe(all[0]);
  });
});

describe("formatMaturityTimestamp", () => {
  it("formats timestamp to human-readable date", () => {
    const ts = new Date(2026, 2, 1).getTime(); // Mar 1 2026
    expect(formatMaturityTimestamp(ts)).toBe("1 Mar 2026");
  });
});

describe("normalizeMaturity", () => {
  it("returns value when valid number", () => {
    expect(normalizeMaturity(12345)).toBe(12345);
  });

  it("returns default for undefined", () => {
    const def = getDefaultMaturityTimestamp();
    expect(normalizeMaturity(undefined)).toBe(def);
  });

  it("returns default for NaN", () => {
    const def = getDefaultMaturityTimestamp();
    expect(normalizeMaturity(NaN)).toBe(def);
  });
});

describe("isValidMaturityTimestamp", () => {
  it("returns true for valid maturity", () => {
    const ts = getAvailableMaturityTimestamps()[0];
    expect(isValidMaturityTimestamp(ts)).toBe(true);
  });

  it("returns false for invalid timestamp", () => {
    expect(isValidMaturityTimestamp(99999)).toBe(false);
  });
});
