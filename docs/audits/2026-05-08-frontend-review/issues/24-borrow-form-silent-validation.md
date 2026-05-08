---
title: "Replace silent validation gates in `useBorrowForm` with explicit toast feedback"
labels: ["bug", "medium", "ux", "area:borrow", "fail-loud"]
---

# Summary

`useBorrowForm.handleLimitSubmit` (and the market variant) has **5 validation gates that silently `return`** when blocked. The user clicks "Borrow", nothing happens, the button stays enabled, and there's no on-screen explanation. The most user-hostile of these is the `healthFactor < 1.0` gate — the user doesn't know they're at an unsafe HF, they just see a button that doesn't do anything.

The same file's APR-range validation already uses `toast.error(...)` for explicit feedback. This issue extends that pattern to the other five gates so every blocked submission has a reason on screen.

# Why

```ts
// src/hooks/use-borrow-form.ts handleLimitSubmit (around line 196-210)
const numericAmount = parseFloat(limitAmountInput.amount) || 0;

if (numericAmount <= 0 || isPending) return;                                    // silent
if (numericAmount * borrowTokenPrice > limitCalcs.availableQuota) return;       // silent
if (limitSelectedCollaterals.length === 0) return;                               // silent
if (limitCalcs.totalPortfolioValue === 0) return;                                // silent
if (limitCalcs.healthFactor < 1.0) return;                                       // silent — most confusing

const targetAPRNumeric = parseFloat(limitTargetAPR.replace(/,/g, ".")) || 0;
if (targetAPRNumeric <= 0 || targetAPRNumeric > MAX_APR_PCT) {
  toast.error(`Target APR must be between ${MIN_APR_PCT}% and ${MAX_APR_PCT}%`);  // explicit ✓
  return;
}
```

For comparison, `useLendForm.handleLimitSubmit` only has 2 silent gates (`numericAmount <= 0 || isPending` and a parallel one in market submit). Borrow form's silent-gate density is anomalous in the codebase.

**User experience:**

- User selects a high-LTV borrow that pushes HF below 1.0. Clicks Borrow. Nothing happens. No toast, no inline error, no disabled button.
- User assumes the button is broken or the page is loading. Clicks again. Same result.
- User reports a bug. Eventually a teammate spots that the HF is < 1.0 and the form is "doing the right thing" by not submitting.

The gate is correct (preventing a borrow that would liquidate immediately is the right behavior). The *silence* is the bug.

# Acceptance criteria

- [ ] Each of the 5 silent gates in `handleLimitSubmit` is replaced with an explicit `toast.error(...)` and a `return`. Gate-specific messages:

  | Gate | Message |
  |---|---|
  | `numericAmount <= 0` | (skip — empty input is obvious; just don't toast on idle clicks) |
  | `isPending` | (skip — disabled state should already be visible; just `return`) |
  | `numericAmount * borrowTokenPrice > availableQuota` | "Amount exceeds your available borrow capacity (${formatCompactCurrency(availableQuota)})." |
  | `selectedCollaterals.length === 0` | "Select at least one collateral asset to continue." |
  | `totalPortfolioValue === 0` | "Your selected collaterals have no balance. Top up first." |
  | `healthFactor < 1.0` | "Borrowing this much would drop your Health Factor below 1.0 (liquidation risk). Reduce the amount or add collateral." |

- [ ] Same treatment for the market submit handler if it has parallel silent gates (audit the file).
- [ ] **Better still**: the submit button itself should be `disabled` when any of these gates is currently failing, so the user can't even click. The toast is for the edge case where state changes between paint and click. AC: review the form for `disabled` prop usage; add the missing gates to it.
- [ ] Same review for `useLendForm` — its 2 silent gates are less harmful but still worth toasting (`numericAmount <= 0 || isPending`).
- [ ] Vitest covering: each gate triggers, the toast fires, no submit goes through. Use `toast` mock from sonner.

# Files to change

- `src/hooks/use-borrow-form.ts` (handleLimitSubmit + handleMarketSubmit)
- `src/hooks/use-lend-form.ts` (parallel cleanup)
- `src/components/centuari-borrow-dialog.tsx` (add `disabled` props on submit buttons covering the same gates — defense in depth so toast is the back-up, not the only signal)
- `src/components/centuari-lend-dialog.tsx` (same)
- `src/hooks/__tests__/use-borrow-form.test.ts` and `use-lend-form.test.ts`

# Suggested patch sketch

```ts
// use-borrow-form.ts
if (numericAmount <= 0 || isPending) return;

if (numericAmount * borrowTokenPrice > limitCalcs.availableQuota) {
  toast.error(
    `Amount exceeds your available borrow capacity (${formatCompactCurrency(limitCalcs.availableQuota)}).`,
  );
  return;
}
if (limitSelectedCollaterals.length === 0) {
  toast.error("Select at least one collateral asset to continue.");
  return;
}
if (limitCalcs.totalPortfolioValue === 0) {
  toast.error("Your selected collaterals have no balance. Top up first.");
  return;
}
if (limitCalcs.healthFactor < 1.0) {
  toast.error(
    "Borrowing this much would drop your Health Factor below 1.0 (liquidation risk). Reduce the amount or add collateral.",
  );
  return;
}
```

# Out of scope

- Reworking the form's overall validation architecture (e.g. moving to RHF with field-level errors). The form currently uses `useState` + manual handlers; this issue keeps that shape, just adds feedback. A larger RHF migration is a separate decision.
- Disabling the button entirely while no validation is in error — covered as part of AC, but if the team prefers toast-only, that's acceptable too.

# Estimated effort

~30 LOC + tests. ~1 hour.

# Dependencies

None.

# References

- Audit: `docs/audits/2026-05-08-frontend-review/security.md` (deep-dive Round 10, M-NEW-13)
- Cross-reference: #19 (mapStatus fail-loud) — same "fail loud not silent" theme.
