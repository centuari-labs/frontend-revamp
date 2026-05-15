---
title: "Fee logic divergence — `fee-calculations.ts` always taker rate; dialogs over-display limit fees by 2×"
labels: ["bug", "medium", "area:dialogs", "ux", "trust"]
---

# Summary

Two fee modules exist in `src/lib/`: `fee-utils.ts` (canonical, used by forms) and `fee-calculations.ts` (used by dialogs). They are not just duplicate code — they have **divergent logic**. The duplicate always applies the taker fee rate (0.2%), regardless of order type. Limit-order dialogs therefore display a `transactionFee` that is 2× the actual fee charged by the matching engine.

# Why

`fee-utils.ts` (canonical):

```ts
export const FEE_CONFIG = {
  SETTLEMENT_FEE_BPS: 1,        // 0.01%
  SETTLEMENT_FEE_MAX_USD: 0.05,
  MAKER_FEE_BPS: 10,            // 0.1% — limit orders
  TAKER_FEE_BPS: 20,            // 0.2% — market orders
};

export function calculateOrderFees(amount: number, orderType: "limit" | "market"): OrderFees {
  // Picks MAKER_FEE_BPS for limit, TAKER_FEE_BPS for market.
}
```

`fee-calculations.ts` (used by dialogs):

```ts
const TAKER_FEE_RATE = 0.002;   // 0.2% — ALWAYS
export function calculateFees(amount: number) {
  const tradeFee = amount * TAKER_FEE_RATE;  // No orderType parameter
  // ...
}
```

Call sites today:

- `centuari-borrow-dialog.tsx:30,104` — uses `calculateFees` (always taker rate)
- `centuari-lend-dialog.tsx:30,148` — uses `calculateFees` (always taker rate)
- `use-borrow-form.ts:109,112` — uses `useTransactionFees` → canonical (correct)
- `use-lend-form.ts:150,160` — uses `useTransactionFees` → canonical (correct)

So the **forms** show the correct fee; the **dialogs** show 2× the actual fee for limit orders.

**Impact:**

- Not a fund loss — users actually pay *less* than the dialog quotes.
- It is a trust / data-integrity issue: the dialog quote and the fee actually charged on-chain (per backend matching engine) disagree. Users discovering this in transaction history may suspect a backend bug or worse.
- Conventions: CLAUDE.md mandates a single source of truth for fee constants and calculation, mirroring the matching engine. Two divergent implementations is the worst-of-both-worlds.

# Acceptance criteria

- [ ] `src/lib/fee-calculations.ts` is deleted.
- [ ] `centuari-borrow-dialog.tsx` and `centuari-lend-dialog.tsx` consume the canonical fee path: either via `useTransactionFees` (preferred — already used by the forms) or by calling `calculateOrderFees` from `fee-utils.ts` directly with the correct `orderType`.
- [ ] The dialog passes the actual order type into the fee calculation. If the dialog supports both limit and market in one view, the fee re-computes when the user toggles.
- [ ] `grep -rn "fee-calculations\|calculateFees\b" src/` returns no matches after the change.
- [ ] Visual smoke test: open lend dialog with a limit order amount, the displayed `transactionFee` matches what the existing market-page form would display for the same `(amount, "limit")` pair.
- [ ] Vitest: assert that for `(amount, "limit")` the dialog's displayed fee equals `calculateOrderFees(amount, "limit").totalFee`.

# Files to change

- **Delete:** `src/lib/fee-calculations.ts`
- `src/components/centuari-borrow-dialog.tsx` (lines 30, 104) — swap import and call
- `src/components/centuari-lend-dialog.tsx` (lines 30, 148) — swap import and call
- Tests covering each dialog's fee row

# Suggested patch sketch

```tsx
// src/components/centuari-borrow-dialog.tsx
- import { calculateFees } from "@/lib/fee-calculations";
+ import { useTransactionFees } from "@/hooks/use-transaction-fees";

// inside the component:
- const { transactionFee, amountToPay } = calculateFees(numericAmount);
+ const { transactionFee, amountToPay } = useTransactionFees(numericAmount, orderType);
//                                                                          ^^^^^^^^^
//                                              "limit" | "market" — passed by the dialog
```

If the dialog doesn't currently know its `orderType`, surface it through props or context. The bug is partly *because* `calculateFees` removed the parameter.

# Out of scope

- Reconciling the matching-engine constants with the frontend. CLAUDE.md says fee-utils mirrors the matching engine; verify the values are still in sync as part of this PR (visual diff against the matching-engine source if accessible). If they aren't, file a separate issue.
- Refactoring fee display into a `FeeBreakdown` shared sub-component (already tracked under conventions audit CONV-M6 / Component Rule 9).

# Estimated effort

~15 LOC + tests. ~1 hour including manual smoke.

# Dependencies

None. Independent of the deposit-trust epic.

# References

- Audit: `docs/audits/2026-05-08-frontend-review/security.md` (deep-dive Round 3, M-6)
- Convention finding: `docs/audits/2026-05-08-frontend-review/conventions.md` (CONV-C1 — was flagged as "duplicate"; this issue upgrades it once the divergent logic was confirmed)
- Existing canonical hook: `src/hooks/use-transaction-fees.ts`
