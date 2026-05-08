---
title: "Low-severity cleanup bundle (7 items) — dead code, headers, env strictness, locale parsing, dead localStorage hook"
labels: ["chore", "low", "cleanup", "area:config"]
---

# Summary

Seven small, independent cleanups bundled into one PR. Each is sub-30-LOC; doing them as separate PRs would create more review noise than the changes themselves. None is a security vulnerability on its own; collectively they reduce attack surface, fix a UX papercut, and tighten configuration.

The seven items:

1. Delete `submitDeposit` dead code in `lib/api.ts:500-510`.
2. `useSyncAccount` should not force-logout on every backend error during `/auth/login`.
3. Add `images.remotePatterns` to `next.config.ts` for `assets.coingecko.com`.
4. Remove deprecated `X-XSS-Protection` header from `next.config.ts`.
5. `IS_MAINNET` should fail loudly on unrecognized `NEXT_PUBLIC_CHAIN_ENV` values rather than silently picking testnet.
6. `parseNumberFromSeparator` is locale-fragile — handles US thousand-separators but corrupts Indonesian-locale input.
7. Delete `usePortfolioFromStorage` dead-code hook + its three orphan localStorage keys.

# Item 1 — Delete `submitDeposit` dead code

**File:** `src/lib/api.ts:500-510`

```ts
export function submitDeposit(
  assetId: string,
  amount: string,
  token: string,
): Promise<DepositResponse> {
  return apiClient<DepositResponse>("/deposit", {
    method: "POST",
    body: { assetId, amount },
    token,
  });
}
```

`grep -rn "submitDeposit" src/` returns only the definition — never called. The actual deposit flow uses `confirmDeposit` after on-chain success.

**AC:**
- Function deleted.
- No imports break.
- Backend endpoint `POST /deposit` may or may not still exist; the proxy still forwards it because of the `deposit/` prefix allowlist (issue #07 will tighten this further). Coordinate with backend on whether the endpoint should be retired too.

# Item 2 — Soften `useSyncAccount` failure handling

**File:** `src/hooks/use-sync-account.ts:43-49`

```ts
.catch((err) => {
  console.error("Failed to sync account:", err);
  hasSynced.current = false;
  logout();
  disconnect();
  localStorage.removeItem(LS_USERNAME_KEY);
});
```

Today: any error during `POST /auth/login` (5xx, network blip, timeout) destroys the Privy session, disconnects Wagmi, and clears the username. User must re-authenticate from scratch.

The intent is to handle expired/invalid auth (401-class). Treat 5xx and network errors as transient.

**AC:**
- Distinguish `AuthError` (401) from other errors.
- On `AuthError`: keep the existing destructive cleanup (forces re-auth — correct behavior).
- On other errors: log, reset `hasSynced.current = false` so a subsequent retry can fire, but don't logout/disconnect. Surface a non-blocking toast via the existing notification mechanism.
- Add a Vitest covering both branches.

**Suggested patch:**

```ts
.catch((err) => {
  console.error("Failed to sync account:", err);
  hasSynced.current = false;
  if (err instanceof AuthError) {
    logout();
    disconnect();
    localStorage.removeItem(LS_USERNAME_KEY);
  }
  // else: leave session alone; next sync attempt will retry.
});
```

# Item 3 — Add `images.remotePatterns`

**File:** `next.config.ts:18-20`

Today:

```ts
images: {
  formats: ["image/avif", "image/webp"],
},
```

`next/image` rejects external URLs that aren't in `remotePatterns`. The result: every component that wants to render `https://assets.coingecko.com/...` falls back to raw `<img>`, losing AVIF/WebP / lazy-load / intrinsic sizing.

**AC:**

```ts
images: {
  formats: ["image/avif", "image/webp"],
  remotePatterns: [
    { protocol: "https", hostname: "assets.coingecko.com" },
    { protocol: "https", hostname: "avatars.githubusercontent.com" },
    { protocol: "https", hostname: "auth.privy.io" },
  ],
},
```

(Hostnames matched to the existing CSP `img-src` allowlist for consistency.)

This issue does *not* require migrating existing `<img>` calls to `<Image>` — that's tracked under the React/Next audit (NEXT-M1). It just unblocks the migration.

# Item 4 — Remove deprecated `X-XSS-Protection`

**File:** `next.config.ts:39-42`

```ts
{
  key: "X-XSS-Protection",
  value: "1; mode=block",
},
```

Modern browsers ignore this header (Chrome removed support in 2019; Firefox never supported it; Edge follows Chrome). It can in fact introduce vulnerabilities in legacy IE that are no longer relevant. Best practice is to omit it entirely and rely on CSP.

**AC:**
- Header removed from the array.
- No other reference to `X-XSS-Protection` in the codebase.

# Item 5 — `IS_MAINNET` strict-equality footgun

**File:** `src/lib/chain-config.ts:3`

```ts
const IS_MAINNET = process.env.NEXT_PUBLIC_CHAIN_ENV === "mainnet";
export const ACTIVE_CHAIN = IS_MAINNET ? arbitrum : arbitrumSepolia;
```

Any value other than the exact string `"mainnet"` (typo `"mainet"`, `"MAINNET"`, undefined) silently picks Arbitrum Sepolia. A typo in the production deploy env therefore ships testnet to mainnet users — broken UX and worse, suspicious to security tooling that sees mainnet domain serving testnet token addresses.

**AC:**
- Reject unrecognized values explicitly:

```ts
const env = process.env.NEXT_PUBLIC_CHAIN_ENV;
if (env !== "mainnet" && env !== "testnet" && env !== undefined) {
  throw new Error(`Unrecognized NEXT_PUBLIC_CHAIN_ENV: ${env}`);
}
const IS_MAINNET = env === "mainnet";
```

- Document the allowed values in `.env.example` / README.
- Default behavior when env is `undefined` stays as testnet (current dev behavior). Only typoed/misspelled values throw.

# Item 6 — `parseNumberFromSeparator` locale-fragile

**File:** `src/lib/utils.ts`

```ts
export function parseNumberFromSeparator(value: string): string {
  if (!value) return "";
  // Remove all non-digit characters except decimal point
  return value.replace(/[^\d.]/g, "");
}
```

Strips everything except digits and periods. Behaviour:

- US locale: `"1,234.56"` → `"1234.56"` ✓ (commas stripped, period stays as decimal).
- Indonesian locale: `"1.234,56"` (period as thousand-sep, comma as decimal) → `"1.234.56"` → `parseFloat = 1` ❌ (treats period as decimal, parses up to second period).
- Exponential: `"1.5e10"` → `"1.510"` (silently corrupted). At least bounded — the user gets a wrong but small number instead of `1.5 × 10¹⁰`.

Codebase elsewhere uses comma-as-decimal for **display** (`formattedAPR.replace(".", ",")`, "5,0%"). Input handling assumes US locale; display assumes Indonesian. Inconsistent.

**AC:**

- Decide on a single locale convention for the input layer. Recommended: keep US convention (period as decimal, comma as thousand-sep stripped) since `parseFloat` only handles US. Document this choice inline.
- Strip both period and comma at the thousand-separator level, then accept either as decimal. Or constrain inputs more aggressively: digits + a single decimal separator + a max length.
- Reject exponential notation explicitly (`.replace(/[^\d.]/g, "")` already does this incidentally, but a typed-input `<input type="text" pattern="[0-9.,]*" inputMode="decimal">` would let the browser block e/E earlier).
- Add a Vitest covering: US input (`"1,234.56"`), Indonesian input (`"1.234,56"` — current parser fails this), exponential input (`"1e10"` — should not silently truncate).

# Item 7 — Delete `usePortfolioFromStorage` dead-code hook

**Files:** `src/hooks/use-portfolio-from-storage.ts`, `src/hooks/__tests__/use-portfolio-from-storage.test.ts`

`grep -rn "usePortfolioFromStorage" src/` shows only:

- The definition file
- The hook's own test file
- One stale `vi.mock(...)` in `use-lend-dialog-data.api.test.ts` for a hook that doesn't actually import it (vestigial mock)

**No production component imports the hook.** It reads/writes three localStorage keys (`centuari_portfolio`, `centuari_total_debt`, `centuari_collateral`) that no production code consumes either. Audit M-4 (in `security.md`) was originally raised against the assumption this hook was wired into the borrow flow; Round 10 verified it is not.

**AC:**

- Delete `src/hooks/use-portfolio-from-storage.ts`.
- Delete `src/hooks/__tests__/use-portfolio-from-storage.test.ts`.
- Remove the stale `vi.mock("@/hooks/use-portfolio-from-storage", ...)` from `src/hooks/__tests__/use-lend-dialog-data.api.test.ts:38-42` (also unused).
- Add a one-time migration step (optional): a tiny `useEffect` in the root layout that calls `localStorage.removeItem(...)` for the three keys. Without it, users who previously had mock-mode data leave orphan keys forever. Migration is purely cosmetic; not strictly required.
- `grep -rn "centuari_portfolio\|centuari_total_debt\|centuari_collateral" src/` returns no matches after the change (test fixtures may keep the strings — that's fine).

This collapses the M-4 risk class entirely: there is no code path that parses unvalidated localStorage data into UI in production.

# Acceptance criteria (whole PR)

- [ ] All seven items completed.
- [ ] Unit tests for items 2, 5, 6 (the others are deletions / config — covered by smoke).
- [ ] After item 7, the audit's M-4 finding (`localStorage` JSON unvalidated parsing) closes — `grep` for the three storage keys returns clean.
- [ ] Smoke test: home, market, portfolio, faucet, deposit dialog open, login flow — all still work.
- [ ] `pnpm run lint` clean.

# Out of scope

- Migrating raw `<img>` calls to `next/image` — separate (NEXT-M1).
- Tightening CSP (`unsafe-inline`/`unsafe-eval`) — separate, requires Privy-compatible nonce strategy (audit L-3).
- Backend `/deposit` endpoint retirement (item 1) — coordinate separately.

# Estimated effort

~30 minutes total. Single small PR.

# Dependencies

None.

# References

- Audit: `docs/audits/2026-05-08-frontend-review/security.md` (deep-dive Round 3, L-4 through L-8)
