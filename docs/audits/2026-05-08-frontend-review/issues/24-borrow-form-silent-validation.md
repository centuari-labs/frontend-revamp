---
title: "Replace silent validation gates: `useBorrowForm`, withdraw dialog, maturity dropdown"
labels: ["bug", "medium", "ux", "area:borrow", "area:withdraw", "fail-loud"]
---

# Summary

Three sibling "fail silently" patterns across the borrow form, the withdraw dialog, and the maturity dropdown. Each one accepts a click that won't lead to a successful submit, and gives the user no on-screen explanation. Bundled here because the fix is the same shape: replace silent `return` with an explicit `toast.error(...)`, AND/OR `disabled` the submit button when the gate is in error state.

Specifically:

1. **`useBorrowForm`** has 5 silent validation gates (vs `useLendForm`'s 2). The `healthFactor < 1.0` silent gate is the most user-hostile.
2. **`centuari-withdraw-dialog`** computes `exceedsBalance` for inline display but doesn't gate the submit on it — clicks fire even when amount > balance.
3. **Maturity dropdown** in borrow/lend forms can render client-computed timestamps that don't match the backend's `upcomingMaturities`. Submit throws "Auth token and market IDs required" — confusing error.

The same APR-range validation in this file already uses `toast.error(...)` correctly. This issue extends that pattern to the rest.

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

## Part 1 — `useBorrowForm` silent gates

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

## Part 2 — Withdraw dialog `exceedsBalance` gate (Round-11 add)

`centuari-withdraw-dialog.tsx:62-65` already computes:

```ts
const exceedsBalance =
  selectedAsset != null && amountNum > selectedAsset.availableBalance;
```

…but `handleWithdraw` (line 104-107) does not check it:

```ts
const handleWithdraw = async () => {
  if (isProcessing || !withdrawAmount || !selectedAsset) return;
  await withdraw(selectedAsset.assetId, withdrawAmount);   // fires even when exceedsBalance = true
};
```

- [ ] Add an early return in `handleWithdraw` when `exceedsBalance` is true, with `toast.error("Amount exceeds available balance.")`.
- [ ] Disable the submit button when `exceedsBalance` is true (defense in depth — the toast is for race cases).
- [ ] Vitest in `centuari-withdraw-dialog.test.tsx` (new or extended): assert that submitting with `amountNum > availableBalance` does not call `withdraw`.

## Part 3 — Maturity dropdown filter (Round-11 add)

`useBorrowForm` (and `useLendForm`) build the maturity dropdown from:

```ts
const availableMaturities = useMemo(() => {
  if (maturityOptions && maturityOptions.length > 0) return maturityOptions;
  return getAvailableMaturityTimestamps();   // ← fallback computes "next 3 months" from local clock
}, [maturityOptions]);
```

If `upcomingMaturities` (from `useMarketDetail`) is empty/loading, the dropdown shows client-computed timestamps. At submit time:

```ts
const resolvedMarketId = upcomingMaturities.find(m => m.maturity === limitMaturity)?.marketId;
const result = await authFetch(async (token) => submitLimit(
  { ..., maturity: limitMaturity, ... },
  assetIdProp && resolvedMarketId ? { token, marketIds: { ... } } : undefined,
));
```

If `resolvedMarketId === undefined`, `submitLimit` is called with `undefined` as the second arg, and `useSubmitOrder` throws **"Auth token and market IDs required"** at `use-submit-order.ts:36`. User-confusing error.

- [ ] Build the maturity dropdown options **only** from `upcomingMaturities` (backend-driven). Drop the `getAvailableMaturityTimestamps()` fallback for the dropdown.
- [ ] If `upcomingMaturities` is empty/loading, render the dropdown disabled with placeholder "Loading available terms…" or "No active terms — try again later".
- [ ] Defensive `useEffect`: if `limitMaturity` is set but no longer matches any `upcomingMaturities` entry (e.g. user kept the dialog open across a market refresh), reset it to the first available option.
- [ ] If a submit somehow still slips through with no matching market id, catch the throw with a user-friendly toast: "This market term is no longer available. Please re-select."
- [ ] Vitest covering: empty `upcomingMaturities` → dropdown disabled → submit button disabled.

## Vitest summary

- [ ] All gates trigger their toast and prevent submit. Use `toast` mock from sonner.

# Files to change

- `src/hooks/use-borrow-form.ts` (handleLimitSubmit + handleMarketSubmit + maturity dropdown source)
- `src/hooks/use-lend-form.ts` (parallel cleanup + maturity dropdown source)
- `src/components/centuari-borrow-dialog.tsx` (add `disabled` props on submit buttons covering the same gates — defense in depth so toast is the back-up, not the only signal)
- `src/components/centuari-lend-dialog.tsx` (same)
- `src/components/centuari-withdraw-dialog.tsx` (add `exceedsBalance` gate to `handleWithdraw`, disable submit button when in error state)
- `src/hooks/__tests__/use-borrow-form.test.ts` and `use-lend-form.test.ts`
- `src/components/__tests__/centuari-withdraw-dialog.test.tsx` (new or extended)

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

~60 LOC across 5 files + tests. ~2 hours including manual smoke on each affected dialog.

# Dependencies

None.

# References

- Audit: `docs/audits/2026-05-08-frontend-review/security.md` (deep-dive Round 10, M-NEW-13)
- Cross-reference: #19 (mapStatus fail-loud) — same "fail loud not silent" theme.
