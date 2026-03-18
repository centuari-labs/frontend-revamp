---
title: "fix: Fast Borrow Health Factor — Use Real Debt from UserDetailsContext"
type: fix
status: completed
date: 2026-03-18
---

# fix: Fast Borrow Health Factor — Use Real Debt from UserDetailsContext

## Overview

The homepage fast borrow dialog (`CentuariBorrowDialog`) and market page borrow form both calculate health factor with `totalDebt = 0` because `useBorrowDialogData()` and `useBorrowPortfolioData()` hardcode it. This means health factor is always inflated — users see a safer-looking position than reality.

**Root cause:** Two hooks hardcode `totalDebt: 0` instead of reading from the existing `UserDetailsContext` which provides `totalDebtUsd` from `/portfolio/user-details`.

## Problem Statement

```
Current flow:
useBorrowDialogData() → totalDebt: 0 (hardcoded)
                       ↓
CentuariBorrowDialog → HF = (collateral × LT) / (0 + newBorrow)  ← always too high

useBorrowPortfolioData() → totalDebt: 0 (hardcoded)
                          ↓
useBorrowForm() → useBorrowCalculations(portfolio, 0, amount, ...) ← same bug
```

**Expected flow:**
```
UserDetailsContext → totalDebtUsd (real value from /portfolio/user-details)
                   ↓
useBorrowDialogData() → totalDebt: totalDebtUsd
                       ↓
CentuariBorrowDialog → HF = (collateral × LT) / (totalDebtUsd + newBorrow) ← correct
```

## Proposed Solution

Update two hooks to read `totalDebtUsd` from `UserDetailsContext`. No new hooks, no formula changes.

### Files to Modify

#### 1. `src/hooks/use-borrow-dialog-data.ts`

**What:** Import and use `useUserDetailsContext()` to get `totalDebtUsd`.

**Change:**
```typescript
// Before
return {
  portfolio,
  totalDebt: 0,  // ← hardcoded
  ...
}

// After
import { useUserDetailsContext } from "@/contexts/user-details-context";

// Inside the hook:
const { userDetails } = useUserDetailsContext();

return {
  portfolio,
  totalDebt: userDetails?.totalDebtUsd ?? 0,  // ← real value
  ...
}
```

**Impact:** Fixes the homepage `CentuariBorrowDialog` health factor calculation.

#### 2. `src/hooks/use-borrow-portfolio-data.ts`

**What:** Same change — read `totalDebtUsd` from context.

```typescript
// Before
return {
  portfolio,
  totalDebt: 0,  // ← hardcoded
  ...
}

// After
import { useUserDetailsContext } from "@/contexts/user-details-context";

const { userDetails } = useUserDetailsContext();

return {
  portfolio,
  totalDebt: userDetails?.totalDebtUsd ?? 0,
  ...
}
```

**Impact:** Fixes the market page `BorrowForm` health factor calculation.

### No Changes Needed

- **`use-borrow-calculations.ts`** — Formula is correct, just receives wrong input
- **`centuari-borrow-dialog.tsx`** — Inline HF calc uses `totalDebt` from hook, will auto-fix
- **`use-borrow-form.ts`** — Passes `totalDebt` from hook to calculations, will auto-fix
- **`UserDetailsContext`** — Already provides `totalDebtUsd`, already in provider tree

## Acceptance Criteria

- [x] `useBorrowDialogData()` returns real `totalDebt` from `UserDetailsContext.totalDebtUsd`
- [x] `useBorrowPortfolioData()` returns real `totalDebt` from `UserDetailsContext.totalDebtUsd`
- [x] Health factor in homepage borrow dialog reflects existing debt (not just new borrow)
- [x] Health factor in market page borrow form reflects existing debt
- [x] Available quota = `(collateralValue × LTV) - totalDebtUsd` (not just `collateralValue × LTV`)
- [x] When `totalDebtUsd` is not yet loaded, default to 0 (graceful fallback)
- [x] `pnpm build` passes clean
- [x] Existing borrow dialog tests still pass

## Edge Cases

| Scenario | Expected Behavior |
|----------|------------------|
| User has no existing debt | `totalDebtUsd = 0`, same as current behavior |
| User has debt but no collateral | HF = 0, submit disabled |
| UserDetailsContext not loaded yet | `totalDebt` defaults to 0, loading state shown |
| User in mock mode (USE_MOCK=true) | Falls back to 0 (mock mode doesn't call user-details) |

## Verification

```bash
cd frontend-revamp
pnpm build                    # Build passes
pnpm vitest run src/hooks/__tests__/use-borrow-dialog-data*  # Existing tests
```

Manual verification:
1. Open homepage → click Borrow on any token
2. Enter borrow amount → health factor should account for existing debt
3. If user has $2000 existing debt and $10,000 collateral (LT=0.80):
   - Old: HF = (10000 × 0.80) / (0 + 1000) = 8.00
   - New: HF = (10000 × 0.80) / (2000 + 1000) = 2.67

## References

- `src/hooks/use-borrow-dialog-data.ts` — Homepage borrow data hook (hardcodes totalDebt: 0)
- `src/hooks/use-borrow-portfolio-data.ts` — Market page borrow data hook (hardcodes totalDebt: 0)
- `src/contexts/user-details-context.tsx` — Provides totalDebtUsd from /portfolio/user-details
- `src/hooks/use-borrow-calculations.ts` — Health factor formula (correct, receives wrong input)
- `src/lib/api.ts:221-254` — UserDetailsResponse type with totalDebtUsd field
