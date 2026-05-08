---
title: "Health factor: fix Infinity-from-API handling + reconcile borrow/repay formula divergence"
labels: ["bug", "medium", "area:web3", "area:health-factor", "data-integrity", "ux"]
---

# Summary

Two related health-factor bugs surfaced in deep-dive Round 9. Both are in display/derivation paths, both involve user-visible numbers that drive borrow/repay decisions, and both share the same fix surface — a small `lib/health-factor.ts` module that consolidates the math.

1. **`UserDetailsResponse.healthFactor` is typed `number` but at runtime can be `null`** (when the user has no debt). Display code treats `null`/`0` as "Danger", so a user with zero debt — the safest state possible — is shown a red "Danger" pill.
2. **Borrow and repay projections use different debt fields in the same formula** (`settledDebtUsd` vs `totalDebtUsd`). Either one is wrong, or both are correct for protocol-specific reasons that aren't documented anywhere — and a future maintainer has no way to tell.

Cross-reference: M-2 (no Zod validation) is the upstream root for #1; this issue is a concrete consequence and a forcing function to fix the type lie.

# Bug 1 — Infinity-from-API rendered as "Danger"

**Files:** `src/lib/api.ts:259`, `src/components/centuari-health-factor.tsx:25-39`, `src/components/centuari-repay-dialog.tsx:99`.

API contract:

```ts
/** Health factor; may be Infinity when there is no debt. */
healthFactor: number;
```

But `JSON.stringify(Infinity)` produces `null`. So when the user has no debt, the wire payload is `null` (or the backend may have substituted `0` or a large finite number — we don't know without coordination).

Display gates:

```ts
// centuari-health-factor.tsx:25-39
const getHFPercentage = (hf: number | undefined): number => {
  if (!hf || hf <= 0) return 0;
  return getHealthFactorPercentage(hf);
};

const getSegment = (hf: number | undefined) => {
  if (!hf || hf <= 0) {
    return { color: "bg-red-500", label: "Danger", ... };
  }
  ...
};

// centuari-repay-dialog.tsx:99
const currentHealthFactor = userDetails?.healthFactor ?? 0;
```

`null` and `0` both fall into the "Danger" branch. A user with **no debt** therefore sees a red "Danger" pill on the portfolio page and the repay dialog. UX-fatal: scares users away from the dApp on first authenticated render.

**Fix:**

- Update the API type to `healthFactor: number | null` and document explicitly: "`null` means no debt (Infinity in math); a positive finite number means current HF; `0` or a non-positive finite number is invalid backend data".
- Add a Zod schema for `UserDetailsResponse` (this is a forcing function for M-2 — narrow scope: just this response).
- Add a `HealthFactorState = "no-debt" | "healthy" | "danger" | "unknown"` discriminated union derived from the raw value:

  ```ts
  // src/lib/health-factor.ts
  export type HealthFactorState =
    | { kind: "no-debt" }
    | { kind: "healthy"; value: number; segment: HealthSegment }
    | { kind: "danger"; value: number; segment: HealthSegment }
    | { kind: "unknown" };

  export function classifyHealthFactor(raw: number | null | undefined): HealthFactorState {
    if (raw == null) return { kind: "no-debt" };
    if (!Number.isFinite(raw) || raw <= 0) return { kind: "unknown" };
    const segment = getSegmentFor(raw);
    return raw < 1 ? { kind: "danger", value: raw, segment } : { kind: "healthy", value: raw, segment };
  }
  ```

- Update `centuari-health-factor.tsx` to render a distinct "No debt" / "—" pill with neutral / green styling for `kind: "no-debt"`, instead of falling into the "Danger" branch.
- Update repay-dialog `currentHealthFactor` derivation to use `classifyHealthFactor` and surface the no-debt state (a user repaying when they have no debt shouldn't be able to enter the repay dialog at all, but defensively handle it).

# Bug 2 — Borrow and repay HF projections use different debt fields (THREE copies of the math)

**Files:**

- `src/hooks/use-borrow-calculations.ts:25` (borrow projection — used by market-page form)
- `src/components/centuari-borrow-dialog.tsx:130-141` (borrow projection — **inlined** in the dialog body, separate copy)
- `src/components/centuari-repay-dialog.tsx:114-117` (repay projection)

Round-12 deep dive verified that the borrow dialog body inlines the same projection math instead of consuming `useBorrowCalculations`. Three places in the codebase compute "what is the health factor after this action" — all subtly different, none documented relative to the others.

```ts
// use-borrow-calculations.ts (borrow projection — canonical-ish)
const numerator = (apiCollateralUsd - apiSettledDebtUsd) * apiWeightedLtv;
const healthFactor = numerator / projectedDebt;   // projectedDebt = settledDebtUsd + newBorrowUsd
//                                  ^^^^^^^^^^^^^^^^
//                  numerator: collateral − SETTLED debt

// centuari-borrow-dialog.tsx:130-141 (inlined duplicate of the above)
const numerator = (apiCollateralUsd - apiSettledDebtUsd) * apiWeightedLtv;
const calculatedHF = numerator / projectedDebt;
// ^ identical math, just inlined. Three sites of drift instead of one.

// centuari-repay-dialog.tsx (repay projection)
const newHealthFactor = newTotalDebtUsd > 0 && collateralUsd > 0 && weightedLtv > 0
  ? ((collateralUsd - totalDebtUsd) * weightedLtv) / newTotalDebtUsd
  //                  ^^^^^^^^^^^^^^^                ^^^^^^^^^^^^^^^^
  //                  numerator: collateral − TOTAL debt
  //                  denominator: NEW total debt (post-repay)
  : ...;
```

Plus, `centuari-borrow-dialog.tsx:142-150` inlines the entire `getHealthFactorPercentage` cascade **even though `getHealthFactorPercentage` is imported at line 27 and is the canonical implementation**. Dead-import + duplicate-math.

The borrow path subtracts **`settledDebtUsd`** from collateral; the repay path subtracts **`totalDebtUsd`**. `UserDetailsResponse` has three debt fields:

- `settledDebtUsd`
- `pendingDebtUsd`
- `totalDebtUsd`

The relationship between them isn't documented in the frontend type. Without that relationship, we cannot verify whether borrow or repay (or both) is doing the right math.

Concrete failure modes:

- If borrow is correct (use `settledDebtUsd`), the repay dialog's `newHealthFactor` understates by treating already-settled portions as still-debt.
- If repay is correct (use `totalDebtUsd`), the borrow projection overstates available collateral by ignoring pending debt.
- If they're both right because the protocol distinguishes settled vs pending in a way that reverses for borrow vs repay — that's plausible, but the frontend has no inline rationale, and a future maintainer who unifies them will introduce a regression.

**Fix:**

- Centralize HF projection in `src/lib/health-factor.ts`:

  ```ts
  export function projectHealthFactorForBorrow(args: {
    collateralUsd: number;
    settledDebtUsd: number;
    weightedLtv: number;
    newBorrowUsd: number;
  }): number { /* ... */ }

  export function projectHealthFactorForRepay(args: {
    collateralUsd: number;
    totalDebtUsd: number;
    weightedLtv: number;
    repayUsd: number;
  }): number { /* ... */ }
  ```

- Both functions live next to each other, so any contributor reading one sees the other and can compare. If they should converge to a single function with a `direction: "borrow" | "repay"` parameter, do that — the goal is **one canonical place** for the math.
- Add an inline comment block documenting which debt field is used and why (coordinate with backend team if the rationale is non-obvious — this is a small backend-coordination ask, not blocking).
- Add unit tests covering: zero-debt borrow, zero-collateral, full-repay (HF → no-debt), partial-repay, full-collateralization (HF >> 1).

# Acceptance criteria

- [ ] New `src/lib/health-factor.ts` module with `classifyHealthFactor`, `projectHealthFactorForBorrow`, `projectHealthFactorForRepay`, plus the existing `getHealthFactorPercentage` (move it from `lib/utils.ts` to keep all HF math in one place).
- [ ] `UserDetailsResponse.healthFactor` type updated to `number | null`. Add inline comment "null = no debt" and link to this issue.
- [ ] Add Zod schema for `UserDetailsResponse` validating `healthFactor` (`z.number().finite().nonnegative().nullable()`). Apply it in `getUserDetails` (`lib/api.ts:280`).
- [ ] `centuari-health-factor.tsx` consumes `classifyHealthFactor`. Renders distinct "No debt" pill for `kind: "no-debt"` (neutral/green color, label "No debt", no progress bar). Renders existing tiers for healthy/danger.
- [ ] `useBorrowCalculations` calls `projectHealthFactorForBorrow` instead of inlining the math.
- [ ] `centuari-borrow-dialog.tsx` (lines 130-150) **stops inlining** the projection math and the percentage cascade. Consume `useBorrowCalculations` (or directly `projectHealthFactorForBorrow` + `getHealthFactorPercentage` from the new module). Remove the dead duplicate code.
- [ ] `centuari-repay-dialog.tsx` calls `projectHealthFactorForRepay` instead of inlining the math.
- [ ] Backend coordination (small): confirm what `healthFactor` looks like over the wire when the user has no debt. Document the answer inline in `lib/health-factor.ts` (comment block at the top: "Backend convention as of [date]: …"). If the wire format is something other than `null` (e.g. a sentinel `9999`), update the Zod schema and `classifyHealthFactor` accordingly.
- [ ] Vitest covering both formula paths and the classify function. Critical cases:
  - `classifyHealthFactor(null)` → `{ kind: "no-debt" }`
  - `classifyHealthFactor(0)` → `{ kind: "unknown" }`
  - `classifyHealthFactor(0.5)` → `{ kind: "danger", value: 0.5, ... }`
  - `classifyHealthFactor(2.5)` → `{ kind: "healthy", value: 2.5, ... }`
  - `projectHealthFactorForBorrow` with zero existing debt → matches direct math
  - `projectHealthFactorForRepay` full-repay → returns `Infinity` or sentinel (decide convention)
- [ ] Manual smoke: log in as a user with no debt; verify the portfolio page and repay dialog do not show "Danger".

# Files to change

- `src/lib/health-factor.ts` (new)
- `src/lib/api.ts` (line 259 type comment + Zod schema for `UserDetailsResponse`)
- `src/components/centuari-health-factor.tsx` (lines 25-90 simplified via `classifyHealthFactor`)
- `src/hooks/use-borrow-calculations.ts` (line 25 onwards) — call new helper
- `src/components/centuari-borrow-dialog.tsx` (lines 130-150) — remove inlined math + dead-import duplication
- `src/components/centuari-repay-dialog.tsx` (lines 99, 114-117) — call new helper, render no-debt branch
- `src/lib/utils.ts` — move `getHealthFactorPercentage` out (re-export from `health-factor.ts` to avoid breaking imports during migration)
- `src/lib/__tests__/health-factor.test.ts` (new)

# Out of scope

- A general Zod validation pass across all API responses — covered under audit M-2 / future validation backbone work.
- Reworking the visual design of the health-factor pill — this issue keeps the existing visual language and only adds a new "no-debt" branch.
- Re-running the borrow/repay formulas against on-chain reality — that's a protocol audit concern; this issue only ensures the frontend is internally consistent and matches what the backend says.

# Estimated effort

~150 LOC across 6 files + tests + small backend coordination ask. ~3-4 hours including manual smoke + tests. Best landed after #16 (typecheck restored — the `number | null` widening would otherwise let consumers compile-pass while breaking at runtime).

# Dependencies

- **Soft dep on #16** (typecheck enforcement).
- Backend coordination on the `healthFactor` wire format. Non-blocking — implement against the inferred convention (`null` for no-debt) and revise if backend reports otherwise.

# References

- Audit: `docs/audits/2026-05-08-frontend-review/security.md` (deep-dive Round 9, M-NEW-8 + M-NEW-9)
- Cross-references: M-2 (no Zod validation), #19 (mapStatus fail-loud — same "fail loud" theme), CONV-M1 (inline tokenPrice duplication).
