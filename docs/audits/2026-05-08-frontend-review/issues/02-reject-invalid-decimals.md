---
title: "Reject invalid ERC20 `decimals` from API instead of falling back to 18"
labels: ["security", "critical", "area:web3", "area:deposit", "bug"]
---

# Summary

Replace `const decimals = token.decimals ?? 18;` with a hard-fail when `decimals` is `null`, undefined, or out of range. This is **layer 1 of the CRIT-2 mitigation** from the frontend pentest.

Part of [#0 — Token & decimals trust in deposit flow].

# Why this is critical

`DepositToken.decimals` is typed `number | null` in `lib/api.ts`. If the backend ever returns `null` for a non-18-decimals token (e.g. USDC=6, WBTC=8), the current fallback silently turns the user's intent into something 10⁶–10¹² times larger:

- User intends to deposit `100 USDC`.
- API returns `{ symbol: "USDC", decimals: null, … }`.
- `parseUnits("100", 18)` produces `100 × 10¹⁸`.
- `approve(TREASURY, 10²⁰)` is signed against the USDC contract — USDC interprets the value with its real 6 decimals: spender may pull up to **100 trillion USDC** (capped only by the user's balance).
- Treasury then calls `transferFrom(user, treasury, 10²⁰)` — full balance drain.

The approve amount is correctly bounded to `depositAmount`. The vulnerability is that `depositAmount` itself is wrong by 10¹².

This requires only one corrupted backend row — bug, migration error, partial compromise — to drain anyone who deposits.

# Acceptance criteria

- [ ] In `src/hooks/use-deposit.ts:74`, replace the `?? 18` fallback with strict validation:
  - `decimals` must be a non-null integer between 0 and 36 inclusive.
  - On failure, throw a typed error before any `readContract` / `writeContract` call.
- [ ] Mirror the same validation in `src/hooks/use-on-chain-balance.ts:29,37` (the balance display also calls `parseUnits` with `decimals ?? 18`).
- [ ] The error surfaces in the deposit dialog UI as a user-friendly message ("Token configuration is invalid. Please refresh and try again.") rather than an unhandled exception.
- [ ] Vitest: a new test in `src/hooks/__tests__/use-deposit.test.ts` (create if it doesn't exist) verifying:
  - `decimals: null` → throws before signing.
  - `decimals: -1` / `decimals: 100` → throws before signing.
  - `decimals: 6` (valid) → does not throw.
- [ ] No `?? 18` (or similar default-decimals fallback) remains anywhere in `src/hooks/` or `src/lib/`. `grep -rn "?? 18\|?? 6" src/ --include="*.ts"` returns clean.

# Files to change

- `src/hooks/use-deposit.ts` (line 74)
- `src/hooks/use-on-chain-balance.ts` (lines 29, 37)
- `src/hooks/__tests__/use-deposit.test.ts` (new or extended)

# Suggested patch sketch

```ts
// use-deposit.ts
function assertValidDecimals(decimals: number | null | undefined, symbol: string): asserts decimals is number {
  if (
    decimals == null ||
    !Number.isInteger(decimals) ||
    decimals < 0 ||
    decimals > 36
  ) {
    throw new Error(`Invalid decimals for ${symbol}`);
  }
}

// in mutationFn, before parseUnits:
assertValidDecimals(token.decimals, token.symbol);
const depositAmount = parseUnits(amount, token.decimals);
```

# Out of scope

- On-chain `decimals()` cross-check (issue #5 — defense in depth on top of this).
- Address validation (issue #3).
- Allowlist check (issue #4).
- Broader Zod validation of API responses (separate Medium finding).

# Estimated effort

~5 LOC + 3 unit tests. ~30 minutes.

# Dependencies

None. Can ship immediately.

# References

- Epic: #0
- Audit: `docs/audits/2026-05-08-frontend-review/security.md` (CRIT-2)
