---
title: "APR units inconsistent across normalizer / display / updater — likely live 100× bug"
labels: ["bug", "high", "area:web3", "area:positions", "trust"]
---

# Summary

The `apr` field on `Position` is read and written under three different unit assumptions across the codebase. At least one consumer is wrong by a factor of 100. Either the positions table is showing rates as **"500%" when they should be "5%"**, or clicking "Save" on an existing order at 5% silently submits the order at **500% (50,000 bps)** to the backend. Possibly both.

This is the kind of bug that erodes user trust on the spot ("why is my 5% lend shown as 500%?") and, in the worst case, lets an unintentional 100× rate change slip through `useUpdateOpenOrder`.

# The conflict

```ts
// src/lib/positions-adapter.api.ts (sender to backend)
export function aprToBasisPoints(aprDecimal: number): number {
  return Math.round(aprDecimal * 10000);   // 0.05  → 500   bps
}

// src/lib/positions-adapter.api.ts:64,92 (receiver from backend — POSITIONS)
apr: order.rate / 100,                     // ?     → ?

// src/components/market/position-section.tsx:113 (display)
{((position.apr ?? 0) * 100).toFixed(1)}%  // assumes apr is DECIMAL → 0.05 prints "5,0%"

// src/hooks/use-update-open-order.ts:20 (updater)
rate: position.apr * 10000,                // assumes apr is DECIMAL → 0.05 sends 500 bps

// src/hooks/use-orderbook.ts:33 (receiver — ORDERBOOK)
apr: level.rate / 100,                     // comment claims "rate is percent (e.g. 4.5)"

// src/hooks/use-recent-trades.ts:30 (receiver — RECENT TRADES)
const apr = event.rate / 10000;            // explicitly treats rate as bps

// src/components/market/order-book.tsx:12 (DISPLAY for both above)
const formatAPR = (apr: number): string => `${(apr * 100).toFixed(2)}%`;
//                                            ^ assumes apr is DECIMAL
```

# Three-way contradiction confirmed in deep-dive Round 8

The same backend feeds three event/response types and the frontend treats each one differently:

| Source | Conversion | Implied unit of `rate` |
|---|---|---|
| `useOrderbook` (orderbook events) | `rate / 100` | percent (e.g. 4.5) |
| `useRecentTrades` (trade events) | `rate / 10000` | bps (e.g. 450) |
| `positions-adapter.api.ts` (positions response) | `rate / 100` | percent (matches orderbook) |
| `aprToBasisPoints` (writer) | `decimal * 10000` | bps (matches recent-trades) |

`formatAPR` (the shared display formatter) assumes its input is decimal in `[0, 1]`. So whatever convention the backend actually uses, **at least one of these hooks renders rates 100× wrong**.

**Live smoke test that proves the bug** (no need to run code review — the symptom is observable):

> Open the same market on a deployed app. The orderbook panel shows a rate at the top of one side; the recent-trades panel will eventually show a trade at that same rate (markets clear at the touched limit). If the orderbook says "4.50%" and the trades panel says "450.00%" (or vice versa), the contradiction is live. If they match, then either the backend is sending different units to different events (which is the bug to fix) or the codebase happens to be self-consistent in a way the static read can't tell.

The probable culprit (highest-confidence guess from the code's structure):

- Backend is consistent — all events send rate as **bps** (matches what `aprToBasisPoints` writes; matches `useRecentTrades`).
- `useOrderbook`'s comment is incorrect; the divisor should be `/ 10000`, not `/ 100`.
- `positions-adapter.api.ts` similarly should use `/ 10000`.
- Once those two are fixed, every `apr` in the codebase is decimal in `[0, 1]`, `formatAPR` is correct, and `aprToBasisPoints` / `position.apr * 10000` round-trip cleanly.

Three of the four code paths (`aprToBasisPoints`, the display formatter, and the updater) consistently assume `apr` is a **decimal in [0, 1]**. The fourth — the receiver — applies `/ 100` to the backend's `order.rate`, which only produces a decimal if `order.rate` was a *percent number* (5 for 5%), not bps (500 for 5%).

If the backend echoes back what `aprToBasisPoints` sent (i.e. bps), then `order.rate / 100` produces 5 (not 0.05), and:

| Code path | What it sees | What it does |
|---|---|---|
| Display: `5 * 100 = 500` | percent | renders **"500,0%"** |
| Updater: `5 * 10000 = 50_000` | bps | sends **50,000 bps = 500%** to backend |

Both are off by 100× in the same direction.

If the backend instead stores rates as a "percent number" and echoes that (`order.rate = 5` for 5%), then `apr = 5 / 100 = 0.05` (decimal) and the display + updater work — but `aprToBasisPoints` would have been *wrong on the way in*. There is no consistent reading that makes all four paths agree.

The mock adapter in `src/lib/positions-adapter.mock.ts:67` even calls this out in a comment: *"Per-token numeric Lend APR as percentage (e.g. 6.5). Use `/ 100` for decimal in `position.apr`."* — i.e. mocks store decimal `position.apr`. The api adapter does not.

# Acceptance criteria

- [ ] Pick a single canonical unit for `Position.apr`. **Recommended: decimal in `[0, 1]`** (e.g. `0.05` for 5%) — that's what 3 of 4 paths assume, and matches `aprToBasisPoints`.
- [ ] Introduce a **second** helper symmetric to `aprToBasisPoints`:

    ```ts
    export function basisPointsToApr(rateBps: number): number {
      return rateBps / 10000;
    }
    ```

- [ ] In `positions-adapter.api.ts:64, 92`, replace `apr: order.rate / 100` with `apr: basisPointsToApr(order.rate)` — assuming backend `rate` is bps. **Confirm** that's the backend's actual unit (POST request payload from `aprToBasisPoints` already establishes this, but verify at least one round-trip end-to-end).
- [ ] In `src/hooks/use-orderbook.ts:33`, replace `apr: level.rate / 100` with `apr: basisPointsToApr(level.rate)` — and **delete the misleading comment** ("rate comes as percentage") that contradicts the actual backend convention.
- [ ] Verify `src/hooks/use-recent-trades.ts:30` — its existing `event.rate / 10000` matches the canonical `basisPointsToApr` formula. If you introduce the helper, refactor this site to use it for consistency (`apr: basisPointsToApr(event.rate)`).
- [ ] **Live smoke test**: deploy and open a market with active liquidity. Compare the rate shown at the top of the orderbook against the rate shown for the most recent trade. They must match (orders clear at the touched limit). If they don't match, the fix is incomplete — re-investigate.
- [ ] Verify the display and updater do not need changes (they already assume decimal).
- [ ] **Add unit tests** for the round-trip:

    ```ts
    test("apr round-trip preserves rate within rounding error", () => {
      const original = 0.0537;
      const sentBps = aprToBasisPoints(original);    // 537
      const received = basisPointsToApr(sentBps);    // 0.0537
      expect(Math.abs(received - original)).toBeLessThan(1 / 10_000);
    });
    ```

- [ ] **Manual smoke**: deploy/run locally, open positions table, verify rates display realistically (no 500% on routine orders). Open an existing order, click "Save" without changes, verify backend receives the same bps as the original (check Network tab).
- [ ] Add a Vitest covering `useUpdateOpenOrder` mutation payload: given `position.apr = 0.05`, the call to `updateOrder` receives `{ rate: 500 }`, not `50_000`.
- [ ] Audit other consumers of `position.apr`. From `grep`:

  - `src/components/portfolio/tables/data-table-all-position.tsx:189, 208` — passes `apr={position.apr ?? 0}` to a child.
  - `src/components/market/position-section.tsx:113` — display, `* 100`.
  - `src/hooks/use-update-open-order.ts:20` — updater, `* 10000`.
  - `src/lib/positions-adapter.mock.ts:164, 217` — average APR in merge logic. With apr as decimal, the math is fine.

  Verify each consumer agrees with the canonical decimal interpretation. If a consumer applies its own `/ 100` or `* 100` and the canonical fix breaks that, fix the consumer.

# Files to change

- `src/lib/positions-adapter.api.ts` (lines 64, 92, plus add `basisPointsToApr`)
- `src/hooks/use-orderbook.ts` (line 33) — switch divisor to `/ 10000`, delete misleading comment
- `src/hooks/use-recent-trades.ts` (line 30) — refactor to use `basisPointsToApr` for consistency
- `src/lib/__tests__/positions-adapter.api.test.ts` (or new) — round-trip tests
- `src/hooks/__tests__/use-orderbook.test.ts` and `use-recent-trades.test.ts` — assert rate normalization
- `src/hooks/__tests__/use-update-open-order.test.ts` — payload assertion
- Possibly the consumers above if they relied on the old (broken) value

# Out of scope

- Changing the wire format with the backend (still bps).
- Reformatting display (the user-visible "5,0%" stays).
- Refactoring `position.apr` to a typed wrapper / branded type — nice-to-have, but `noUncheckedIndexedAccess` (#16) won't catch this class of bug; only an explicit branded type would. Track separately if desired.

# Estimated effort

~30 LOC + tests + manual verification. ~1-2 hours including reproducing the symptom on a running build.

# Dependencies

- Best landed alongside #16 (re-enable typecheck) so future regressions in this area get caught earlier.
- Independent of the deposit-trust epic.

# References

- Audit: `docs/audits/2026-05-08-frontend-review/security.md` (deep-dive Round 7, H-NEW-3)
- Cross-reference: `src/lib/positions-adapter.mock.ts:67` (comment confirms mock convention is decimal — api adapter diverges)
