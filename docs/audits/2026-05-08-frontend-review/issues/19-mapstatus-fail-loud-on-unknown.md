---
title: "`mapStatus` silently coerces unknown order statuses to `\"OPEN\"` — fail loudly instead"
labels: ["bug", "medium", "area:positions", "data-integrity"]
---

# Summary

`mapStatus` in `src/lib/positions-adapter.api.ts:47` accepts any string from the backend; if it doesn't match one of `"OPEN" | "FILLED" | "CANCELLED" | "PARTIALLY_FILLED"`, it silently rewrites it to `"OPEN"`. Closed-but-unknown-status orders therefore appear active in the positions table, inviting the user to interact with positions the backend has already moved on from.

# Why

```ts
function mapStatus(backendStatus: string): PositionStatus {
  const valid: PositionStatus[] = ["OPEN", "FILLED", "CANCELLED", "PARTIALLY_FILLED"];
  return (valid.includes(backendStatus as PositionStatus) ? backendStatus : "OPEN") as PositionStatus;
}
```

Concrete failure modes once the backend introduces a new status (likely candidates: `"SETTLED"`, `"EXPIRED"`, `"LIQUIDATED"`, `"PENDING_SETTLEMENT"`, `"PARTIAL_REPAY"`):

1. **Backend deploys a new status before the frontend.** Every position with that status flips to "OPEN" silently. Users see active positions that aren't. Cancel/edit attempts hit the backend, fail with a confusing error.
2. **A backend bug returns a typo'd status** (e.g. `"open"` lowercase). The status fails the case-sensitive match, falls through to `"OPEN"`. Now the adapter cannot distinguish a real OPEN from a typo'd one — the deploy-time signal is suppressed.
3. **Defensive-coding muscle memory.** This pattern teaches the team that "unknown things become OPEN", which is the exact opposite of the security posture for status enums (Type Rule 3 in CLAUDE.md prefers type guards).

The cast `as PositionStatus` is a runtime assertion that silently lies to TypeScript downstream. Type Rule 3 forbids exactly this pattern.

# Acceptance criteria

- [ ] `mapStatus` either:
  - **Throws** on unknown — surfaces the issue immediately, gets caught by the generic API error path. *Risk: a single new backend status crashes the whole positions table.* OK only if positions queries are tightly bounded and an error toast / fallback view exists.
  - **OR returns an explicit `"UNKNOWN"` variant** added to `PositionStatus`. The status pill in the table renders the literal "Unknown — please refresh" with no actions enabled. **Recommended.**
- [ ] If returning `"UNKNOWN"`, log a `console.warn` with `{ backendStatus, orderId }` so the discrepancy is visible in dev / Sentry without blocking the user.
- [ ] If choosing the recommended option, update `PositionStatus` in `src/types/positions.ts` to include `"UNKNOWN"`, and add a render branch in `src/components/market/position-section.tsx` and any other status pill for "Unknown" treatment.
- [ ] Action buttons (Edit / Cancel) on positions in `"UNKNOWN"` state are **disabled** with a tooltip: "Status unrecognized — refresh to retrieve the latest order state."
- [ ] Vitest:
  - `mapStatus("OPEN")` returns `"OPEN"`.
  - `mapStatus("SETTLED")` returns `"UNKNOWN"` (no longer silently `"OPEN"`).
  - `mapStatus("open")` returns `"UNKNOWN"` (case-sensitivity preserved).
- [ ] Remove the `as PositionStatus` cast in favor of a proper type guard:

    ```ts
    const VALID_STATUSES = ["OPEN", "FILLED", "CANCELLED", "PARTIALLY_FILLED"] as const;
    type ValidStatus = typeof VALID_STATUSES[number];
    function isValidStatus(s: string): s is ValidStatus {
      return (VALID_STATUSES as readonly string[]).includes(s);
    }

    function mapStatus(backendStatus: string): PositionStatus {
      if (isValidStatus(backendStatus)) return backendStatus;
      console.warn(`Unknown order status: ${backendStatus}`);
      return "UNKNOWN";
    }
    ```

# Files to change

- `src/lib/positions-adapter.api.ts` (line 47, plus the cast cleanup)
- `src/types/positions.ts` — extend `PositionStatus` enum
- `src/components/market/position-section.tsx` — render branch
- `src/components/portfolio/tables/data-table-all-position.tsx` — disable actions on UNKNOWN
- `src/lib/__tests__/positions-adapter.api.test.ts` (new or extended)

# Out of scope

- Backend status-enum versioning / contract — that's a backend concern.
- Migrating other discriminated-union casts (audit CONV-H7 covers them; track under #16's first-pass fixes or a separate code-quality PR).
- A general "loud failures over silent corrections" sweep across the codebase — track separately if desired.

# Estimated effort

~25 LOC + tests + UI branch. ~1 hour.

# Dependencies

None hard. Plays well with #16 (stricter type discipline) — the new type guard pattern is what `noUncheckedIndexedAccess` and `noImplicitReturns` push the codebase toward.

# References

- Audit: `docs/audits/2026-05-08-frontend-review/security.md` (deep-dive Round 7, M-NEW-3)
- CLAUDE.md: Type Rule 3 — "Type guards — use `isLendPosition()`, `isBorrowPosition()` etc. Never cast."
