---
title: "feat: Token Metadata localStorage Cache (Frontend-Only)"
type: feat
status: active
date: 2026-05-03
origin: docs/brainstorms/2026-05-03-token-metadata-localstorage-cache-requirements.md
---

# feat: Token Metadata localStorage Cache (Frontend-Only)

## Overview

Persist `/api/deposit/tokens` metadata to `localStorage` (TTL 6 hours, per-chain key) so the frontend stops re-fetching the token list on every page reload. Hardcoded `TOKENS`, `MARKET_TOKEN_LIST`, and `TOKEN_LOGO_MAP` constants in `src/lib/tokens.ts` are removed. Helper `getTokenLogo` keeps its synchronous signature but reads from a module-level mirror hydrated from the cache. Two new synchronous accessors (`getAllTokens`, `getMarketTokenList`) replace the deleted constant exports for the two consumers that need them. Unused helpers (`getTokenIcon`, `getTokenByValue`) and types (`Token`, `TokenValue`) are deleted — sweep confirmed zero production consumers.

---

## Problem Frame

`useDepositTokens()` currently uses React Query with `staleTime: 5 min`, but React Query's cache is in-memory only — every hard reload triggers a fresh `/deposit/tokens` fetch even though the underlying data changes rarely. The hardcoded `TOKENS` / `MARKET_TOKEN_LIST` / `TOKEN_LOGO_MAP` in `src/lib/tokens.ts` have already drifted from backend (RWA tokens AAPLon, SLVon, TLTon are missing), creating a dual-source-of-truth maintenance burden.

The frontend should fetch the list once per chain per 6h window, persist it across sessions, and use it as the only source of token metadata. See origin: `docs/brainstorms/2026-05-03-token-metadata-localstorage-cache-requirements.md`.

---

## Requirements Trace

- R1. After first successful fetch, hard-reload does **not** trigger a network call to `/deposit/tokens` for at least 6 hours
- R2. `src/lib/tokens.ts` no longer contains `TOKENS`, `MARKET_TOKEN_LIST`, or `TOKEN_LOGO_MAP` constants
- R3. RWA tokens from backend (AAPLon, SLVon, TLTon) appear in any UI that displays the token list, with no code changes
- R4. Switching `NEXT_PUBLIC_CHAIN_ENV` between testnet and mainnet uses independent cache entries (no cross-chain leakage)
- R5. `getTokenLogo` keeps its current synchronous signature (no consumer handles Promise / loading state)
- R6. Helpers safe to invoke during SSR (return defaults, no `localStorage is not defined` errors)
- R7. Cache write failure (quota, private mode) does not crash the app

---

## Scope Boundaries

- Backend changes — origin doc explicitly scopes this FE-only; backend continues sending full metadata in other responses, FE simply does not depend on it
- Cross-tab `storage` event sync — TTL is short relative to typical session length; tabs converge on next reload
- Migration to address-based lookup — symbol-based lookup remains the contract
- TanStack Query Persister adoption — manual implementation chosen for narrow single-query scope
- Manual "refresh tokens" UI — TTL covers freshness
- SSR pre-population of token list — `localStorage` is browser-only

---

## Context & Research

### Relevant Code and Patterns

- `src/hooks/use-portfolio-from-storage.ts` — existing localStorage pattern in the repo. Demonstrates: lazy `useState` initializer with `typeof window === "undefined"` SSR guard, try/catch around `JSON.parse`. Mirror the SSR + try/catch parts; skip the `storage` event listener (out of scope per origin)
- `src/hooks/use-deposit-tokens.ts` — current hook to extend. Already wraps React Query with `staleTime: QUERY_CONFIG.DEPOSIT_TOKENS_STALE_TIME` and inline query key `["deposit-tokens"]`
- `src/lib/api.ts` (`DepositToken` interface, line 467) — backend response shape: `{ id, symbol, name, tokenAddress, decimals: number | null, imageUrl: string | null, chainId: number | null }`. Note `decimals`, `imageUrl`, `chainId` can be `null`
- `src/lib/chain-config.ts` — `ACTIVE_CHAIN` exported from viem (`arbitrum` or `arbitrumSepolia`); `ACTIVE_CHAIN.id` gives the numeric chain id used for cache key suffix
- `src/lib/query-keys.ts` — `QUERY_KEYS` constant + `invalidateUserQueries` helper. Add `DEPOSIT_TOKENS` here per project convention (no inline string keys)
- `src/lib/query-config.ts` — `DEPOSIT_TOKENS_STALE_TIME` will be the **single source of truth** for the 6h TTL; `token-cache.ts` imports from it (avoids two constants drifting)
- `src/lib/__tests__/tokens.test.ts` — existing test file; rewritten to cover the new dynamic-source contract
- `src/lib/positions-adapter.api.ts` (lines 61, 89) — adapter calls `getTokenLogo(tokenValue)` with **no** `assetImg` second argument; relies on the helper's lookup chain. Plan must preserve this behavior

### Importer Sweep Results

Source-of-truth scan for what actually depends on the constants and helpers being touched:

- `getTokenLogo` — 8 callsites across 6 files (`app/market/page.tsx`, `centuari-deposit-dialog.tsx`, `centuari-lend-dialog.tsx`, `lend-deposit-view.tsx`, `market/position-section.tsx`, `lib/positions-adapter.api.ts`). Signature `(tokenValue, assetImg?)` preserved exactly
- `MARKET_TOKEN_LIST` — only `src/components/market/position-section.tsx` (lines 123, 247) imports it; passed as `tokenList` prop
- `TOKENS` — only `src/components/select-token.tsx` (lines 14, 43) imports it; iterated with `.map()`
- `TOKEN_LOGO_MAP` — no external importers
- `getTokenIcon` — **0 production consumers** (only existing test file). Deleted in this plan
- `getTokenByValue` — **0 production consumers** (only existing test file). Deleted in this plan
- `Token` / `TokenValue` types — **0 production consumers**. Deleted in this plan
- `useDepositTokens` data field — 4 production consumers (`centuari-lend-dialog.tsx`, `centuari-deposit-dialog.tsx`, `faucet/faucet-token-grid.tsx`, `use-on-chain-balance.ts`). All depend on `data` array + `isLoading`. Confirms React Query layer must stay

### External References

None — local patterns sufficient (existing localStorage hook + existing React Query usage).

---

## Key Technical Decisions

- **Module-level mirror in `src/lib/token-cache.ts`** — single owner. `src/lib/tokens.ts` imports the mirror accessor; `getTokenLogo` stays synchronous. Avoids coupling helpers to React Query's `queryClient`
- **Eager hydration at module load** — `token-cache.ts` reads `localStorage` once when first imported in the browser and populates the in-memory `Map`. Subsequent helper calls are pure reads from the `Map` (no JSON.parse per lookup)
- **TTL single source of truth** — `DEPOSIT_TOKENS_STALE_TIME` in `src/lib/query-config.ts` is the only definition. `token-cache.ts` imports it. Avoids two constants drifting
- **Combined `setTokenCache(chainId, tokens)` API** — single function that writes localStorage AND hydrates mirror in one call. The two operations are always invoked together; collapsing into one removes a redundant call site and an entire shape of bug (caller forgets one of the two)
- **`gcTime: Infinity` on `useDepositTokens`** — prevents React Query from garbage-collecting the entry while no component is subscribed (cache survives tab switches, route changes). Token list is ~3 KB; no memory concern
- **`initialData` from cache, fed to React Query** — non-expired cached value seeds the query. Combined with `staleTime: 6h`, no fetch fires on mount when cache is fresh. Re-renders on refetch propagate naturally through React Query's normal subscriber notification (no separate broadcast mechanism needed)
- **Chain-scoped cache key: `centuari:tokens:v1:{chainId}`** — `v1` allows future schema bumps; chainId in path prevents cross-chain pollution; `centuari:` namespace prefix matches the `centuari_*` convention already used by `usePortfolioFromStorage`
- **Defensive `chainId` field inside cache value** — if the parsed JSON's `chainId` does not match the key's chainId, treat as corrupt and discard
- **Empty-cache fallback contract** — when mirror is empty, `getTokenLogo` returns `DEFAULT_LOGO`, `getAllTokens` returns `[]`, `getMarketTokenList` returns curated symbols with `DEFAULT_LOGO`. Matches today's behavior, no consumer needs to change
- **Aggressive YAGNI on unused helpers** — `getTokenIcon`, `getTokenByValue`, `DEFAULT_ICON`, `Token`, `TokenValue` deleted. Sweep confirmed zero production callsites. If a future need arises, re-adding is trivial
- **`MARKET_TOKEN_LIST` semantics** — the curated symbol set (`["usdc", "xsgd", "idrx"]`) is product policy, not metadata. Encode as `MARKET_TOKEN_SYMBOLS` constant in `tokens.ts` and have `getMarketTokenList()` join policy + cache lookups
- **All localStorage writes wrapped in try/catch** — quota errors and private-browsing failures must not crash the app; log warning, continue with in-memory state

---

## Open Questions

### Resolved During Planning

- **Where does the module-level mirror live?** — `src/lib/token-cache.ts` (single owner)
- **Cache schema versioning?** — `v1` literal in key suffix; bump to `v2` if shape changes (orphaned `v1` entries are harmless)
- **`MARKET_TOKEN_LIST` semantics when dynamic?** — Curated symbols stay as `MARKET_TOKEN_SYMBOLS` constant; `getMarketTokenList()` resolves logos via cache
- **Dual-mode test pattern (`.test.ts` + `.api.test.ts`) for `useDepositTokens`?** — No. Hook does not use the mock-adapter pattern. Single test file is sufficient
- **Test for "fetch did not fire"?** — `vi.fn()` mock for `getDepositTokens`; assert `mock.calls.length === 0`
- **TTL constant duplication?** — Resolved: only `DEPOSIT_TOKENS_STALE_TIME` in `query-config.ts`; `token-cache.ts` imports it
- **`writeTokenCache` + `hydrateMirror` redundancy?** — Resolved: collapsed into combined `setTokenCache(chainId, tokens)` public API
- **Keep or delete unused helpers (`getTokenIcon`, `getTokenByValue`)?** — Resolved: deleted. Zero production consumers per sweep
- **Mirror update broadcast mechanism?** — Not needed. React Query's normal subscriber re-render path triggers consumer components to re-render; their next call to `getTokenLogo` reads the freshly-hydrated mirror
- **`gcTime: Infinity` memory concern?** — Not a concern. Token list ~3 KB

### Deferred to Implementation

- **Whether to also extract a `MIRROR` const symbol** — if `getTokenMirror()` accessor proves awkward, may inline the `Map` reference. Decide at implementation time

---

## Implementation Units

- U1. **Create token cache primitives**

**Goal:** Provide the localStorage read/write/mirror primitives used by the hook and helpers. Pure data layer, no React.

**Requirements:** R1, R4, R6, R7

**Dependencies:** None

**Files:**
- Create: `src/lib/token-cache.ts`
- Test: `src/lib/__tests__/token-cache.test.ts`

**Approach:**
- Import `DEPOSIT_TOKENS_STALE_TIME` from `src/lib/query-config.ts` for TTL (single source of truth — no local TTL constant)
- Export `readTokenCache(chainId: number): DepositToken[] | null` — returns array if non-expired and chainId matches, else `null`
- Export `setTokenCache(chainId: number, tokens: DepositToken[]): void` — combined operation: write `{ chainId, fetchedAt: Date.now(), tokens }` JSON to localStorage (try/catch wrapped), then hydrate the in-memory mirror from `tokens`
- Export `getTokenMirror(): ReadonlyMap<string, DepositToken>` — returns the singleton `Map` keyed by `symbol.toLowerCase()`. `Readonly` typing prevents external mutation
- Constant: `TOKEN_CACHE_KEY_PREFIX = "centuari:tokens:v1:"`
- All `localStorage` access guarded by `typeof window !== "undefined"`
- Module-load side effect: if in browser and cache exists for `ACTIVE_CHAIN.id`, populate the mirror immediately so synchronous helpers work on first render
- Internal-only (not exported): the raw mirror `Map` and a private `hydrate(tokens)` helper used by both module-load and `setTokenCache`

**Patterns to follow:**
- SSR + try/catch shape from `src/hooks/use-portfolio-from-storage.ts`
- `centuari:` namespace prefix convention

**Test scenarios:**
- Happy path: `setTokenCache` writes to localStorage and `readTokenCache` returns the same tokens
- Happy path: `setTokenCache` populates the mirror — `getTokenMirror().get("usdc")` returns the token
- Happy path: TTL imported from `query-config.ts` is honored — read fresh entry returns data, expired returns `null`
- Edge case: read before any write returns `null`
- Edge case: read with TTL expired (`fetchedAt = Date.now() - 7h`) returns `null`
- Edge case: read with non-matching chainId in stored value (key 421614, value chainId 42161) returns `null`
- Edge case: malformed JSON in localStorage returns `null` (no throw)
- Edge case: per-chain isolation — `setTokenCache(A, ...)` does not affect `readTokenCache(B)`
- Edge case: empty `tokens` array round-trips correctly
- Error path: `localStorage.setItem` throws (quota / private mode) — `setTokenCache` swallows the localStorage error AND still updates the in-memory mirror (cache just doesn't persist)
- Error path: SSR — when `window` is undefined, `readTokenCache` returns `null`, `setTokenCache` is a no-op for storage but still populates the mirror, `getTokenMirror` returns an empty map
- Integration: module load auto-hydrates mirror from existing cache when `ACTIVE_CHAIN.id` matches

**Verification:**
- All test scenarios above pass
- No `TOKEN_CACHE_TTL_MS` or similar duplicate constant exists in `token-cache.ts`
- Functions produce no console errors under SSR (`vi.stubGlobal("window", undefined)`)

---

- U2. **Wire `useDepositTokens` to the cache and centralize the query key**

**Goal:** Hook becomes the cache writer. Add `DEPOSIT_TOKENS` to `QUERY_KEYS`, update TTL constant to 6h, and seed React Query from cache.

**Requirements:** R1, R4

**Dependencies:** U1

**Files:**
- Modify: `src/hooks/use-deposit-tokens.ts`
- Modify: `src/lib/query-keys.ts`
- Modify: `src/lib/query-config.ts`
- Test: `src/hooks/__tests__/use-deposit-tokens.test.ts`

**Approach:**
- `query-keys.ts`: add `DEPOSIT_TOKENS: "deposit-tokens"` to `QUERY_KEYS`. Do **not** add it to `invalidateUserQueries` — token list is not user-scoped and should not be invalidated by user mutations
- `query-config.ts`: change `DEPOSIT_TOKENS_STALE_TIME` from `5 * 60 * 1000` to `6 * 60 * 60 * 1000` (6 hours). Constant name preserved to avoid additional churn
- `use-deposit-tokens.ts`:
  - Replace inline `["deposit-tokens"]` with `[QUERY_KEYS.DEPOSIT_TOKENS, ACTIVE_CHAIN.id]`
  - Add `initialData: () => readTokenCache(ACTIVE_CHAIN.id) ?? undefined` so React Query treats the cached array as fresh and skips the fetch when present
  - Add `gcTime: Infinity`
  - On `queryFn` success, call `setTokenCache(ACTIVE_CHAIN.id, result)` — single combined call (writes localStorage + hydrates mirror)
  - Keep existing `staleTime` reference and `retry: 1`

**Patterns to follow:**
- Centralized query keys per `CLAUDE.md` data fetching rules (line 112)
- React Query `initialData` + `gcTime: Infinity` is a standard SWR-style cache hydration pattern

**Test scenarios:**
- Happy path: when cache empty, hook fires fetch and on success calls `setTokenCache` exactly once with the response
- Happy path: when cache fresh, hook returns cached data via `initialData` and `getDepositTokens` is **not** called (`vi.fn()` mock; assert zero invocations)
- Edge case: when cache present but TTL expired (`readTokenCache` returns `null`), hook still fires fetch
- Integration: chain-scoped query key — different `ACTIVE_CHAIN.id` produces a separate query entry (no shared cache)
- Error path: when `getDepositTokens` rejects, hook surfaces the error and does not crash; `setTokenCache` not called

**Verification:**
- Hook return shape unchanged; existing 4 consumers compile without modification
- `getDepositTokens` mock invocation count is 0 in the "cache fresh" test scenario

---

- U3. **Refactor `src/lib/tokens.ts` and delete unused exports**

**Goal:** Remove hardcoded constants and unused helpers. `getTokenLogo` reads from the mirror. Add `getAllTokens()` and `getMarketTokenList()` synchronous accessors.

**Requirements:** R2, R3, R5, R6

**Dependencies:** U1

**Files:**
- Modify: `src/lib/tokens.ts`
- Modify: `src/lib/__tests__/tokens.test.ts`

**Approach:**

Delete (zero production consumers per sweep):
- Constants: `TOKENS`, `MARKET_TOKEN_LIST`, `TOKEN_LOGO_MAP`, `DEFAULT_ICON`
- Helpers: `getTokenIcon`, `getTokenByValue`
- Types: `Token`, `TokenValue`

Keep:
- Constant: `DEFAULT_LOGO`

Add:
- Constant: `MARKET_TOKEN_SYMBOLS = ["usdc", "xsgd", "idrx"] as const` — product policy
- Function `getAllTokens(): DepositToken[]` — returns `Array.from(getTokenMirror().values())`
- Function `getMarketTokenList(): { logo: string; value: string; label: string }[]` — maps `MARKET_TOKEN_SYMBOLS` to `{ logo: getTokenLogo(symbol), value: symbol, label: symbol.toUpperCase() }` (matches the original `MARKET_TOKEN_LIST` shape exactly)

Refactor:
- `getTokenLogo(tokenValue, assetImg?)`:
  1. If `assetImg` starts with `/`, return it (preserved short-circuit for backend-provided imageUrl)
  2. Else look up `getTokenMirror().get(tokenValue.toLowerCase())?.imageUrl`
  3. Fall back to `DEFAULT_LOGO`

Rewrite `src/lib/__tests__/tokens.test.ts`:
- Drop `TOKENS`, `MARKET_TOKEN_LIST`, `getTokenIcon`, `getTokenByValue` test blocks
- In `beforeEach`, call `setTokenCache(ACTIVE_CHAIN.id, fixtureTokens)` to populate; in `afterEach`, clear localStorage and reset mirror (export an internal `__resetMirrorForTesting()` helper from `token-cache.ts` if needed, marked clearly as test-only)
- Test helpers in both states: empty mirror (defaults) and populated mirror (real lookup)

**Patterns to follow:**
- Inline test fixtures (project does not have a `makeDepositToken` factory yet; small inline `{ id: "x", symbol: "usdc", ... }` literals are sufficient for this scope)
- Synchronous helper signature parity — no async, no Promise

**Test scenarios:**
- Happy path: `getTokenLogo("usdc")` with mirror populated returns the cached `imageUrl`
- Happy path: `getTokenLogo("USDC")` (uppercase) returns the cached `imageUrl` (case-insensitive)
- Happy path: `getTokenLogo("usdc", "/custom/logo.png")` returns `/custom/logo.png` (assetImg short-circuit preserved)
- Edge case: `getTokenLogo("unknown")` with empty mirror returns `DEFAULT_LOGO`
- Edge case: `getTokenLogo("unknown")` with populated mirror returns `DEFAULT_LOGO`
- Edge case: `getTokenLogo("usdc")` when cached token has `imageUrl: null` falls through to `DEFAULT_LOGO`
- Happy path: `getAllTokens()` with populated mirror returns the array of all tokens
- Edge case: `getAllTokens()` with empty mirror returns `[]`
- Happy path: `getMarketTokenList()` returns 3 entries (`usdc`, `xsgd`, `idrx`) with logos resolved from mirror when populated
- Edge case: `getMarketTokenList()` with empty mirror returns 3 entries with `DEFAULT_LOGO` (UI does not break)
- Edge case: `getMarketTokenList()` shape exactly matches `{ logo: string; value: string; label: string }`
- Integration (SSR): all three remaining accessors callable when `window === undefined` without throwing

**Verification:**
- `grep -E "TOKEN_LOGO_MAP|^export const TOKENS|^export const MARKET_TOKEN_LIST|getTokenIcon|getTokenByValue|^export type Token" src/lib/tokens.ts` returns nothing
- `pnpm run test src/lib/__tests__/tokens.test.ts` passes
- `pnpm run build` succeeds (catches type errors if anything depended on removed exports)

---

- U4. **Migrate the two consumers off removed constants**

**Goal:** Replace `TOKENS` and `MARKET_TOKEN_LIST` imports with the new synchronous accessors. Verify behavior unchanged.

**Requirements:** R2, R3, R5

**Dependencies:** U3

**Files:**
- Modify: `src/components/select-token.tsx`
- Modify: `src/components/market/position-section.tsx`

**Approach:**
- `select-token.tsx` (line 14): replace `import { TOKENS } from "@/lib/tokens"` with `import { getAllTokens } from "@/lib/tokens"`. Line 43: replace `TOKENS.map(...)` with `getAllTokens().map(...)`. The iteration receives `DepositToken` objects now (with `symbol` / `imageUrl`) instead of `{ value, label, icon }`. Adapt JSX field references — likely `token.symbol` for value, `token.symbol.toUpperCase()` for label, `token.imageUrl ?? DEFAULT_LOGO` for icon (or use `getTokenLogo(token.symbol, token.imageUrl ?? undefined)` for the same fallback behavior as everywhere else)
- `position-section.tsx` (line 38): change `import { MARKET_TOKEN_LIST, getTokenLogo } from "@/lib/tokens"` to `import { getMarketTokenList, getTokenLogo } from "@/lib/tokens"`. Lines 123 and 247: replace `tokenList={MARKET_TOKEN_LIST}` with `tokenList={getMarketTokenList()}`
- Both files: do **not** convert to hooks or async. Synchronous accessors keep consumer changes minimal

**Patterns to follow:**
- Existing `tokenList` prop shape contract used by the `select-token` consumer in `position-section` — `getMarketTokenList()` is designed to match exactly

**Test scenarios:**
- Test expectation: none for new test files — both files are presentation. Existing market and portfolio integration coverage in `e2e/market.spec.ts` is sufficient
- Manual verification (during U4 work): run `pnpm run dev`, visit `/market`, confirm dropdown still lists USDC / XSGD / IDRX with correct logos; visit `select-token` consumer locations and confirm the full token list renders

**Verification:**
- `grep -rn "MARKET_TOKEN_LIST\|from \"@/lib/tokens\".*TOKENS" src/` returns no matches
- `pnpm run build` succeeds
- `pnpm run test` passes
- Browser smoke check: market page dropdown unchanged; `select-token` component renders all available tokens

---

## System-Wide Impact

- **Interaction graph:** `useDepositTokens` is the only writer to the cache (via `setTokenCache`). All token-metadata reads in production code go through helpers in `src/lib/tokens.ts`, which read from the mirror in `src/lib/token-cache.ts`. Mirror is hydrated by (a) module-load eager read of `localStorage` and (b) `useDepositTokens` `onSuccess` → `setTokenCache`
- **Error propagation:** localStorage write failures swallowed in `setTokenCache`; React Query handles fetch failures (`retry: 1`) and surfaces to consumers via `error` field — no change to existing error UX
- **State lifecycle risks:** mirror lifecycle = process lifetime. SSR: mirror empty, helpers return defaults. First client render triggers hydration and re-render with real values. Brief flash of default logo possible only on truly first visit (cache empty + fetch in flight) — acceptable per origin
- **API surface parity:** `getTokenLogo` signature preserved (R5). Net deletion: `getTokenIcon`, `getTokenByValue`, `Token`, `TokenValue`, `TOKENS`, `MARKET_TOKEN_LIST`, `TOKEN_LOGO_MAP`, `DEFAULT_ICON`. Net addition: `getAllTokens`, `getMarketTokenList`, `MARKET_TOKEN_SYMBOLS`
- **Integration coverage:** mirror sync between localStorage write and component re-read is verified by U2's "writeback then mirror returns new value" scenario and U3's helpers-with-populated-mirror scenarios
- **Unchanged invariants:** `useDepositTokens` return shape (`{ data, isLoading, error, ... }`) unchanged; `getTokenLogo` argument order preserved; `MARKET_TOKEN_LIST`-shaped `tokenList` prop contract preserved via `getMarketTokenList()` returning identical shape

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Stale cache after backend changes a token's `decimals` field — could cause financial calc errors | TTL 6h bounds the staleness window. If a critical correction is needed faster, bump cache key suffix from `:v1` to `:v2` and ship a FE deploy (orphans the old cache for all users) |
| Cache schema drift (we change shape later) | `:v1` versioning in key allows clean cutover; old `v1` entries become inert |
| `MARKET_TOKEN_SYMBOLS` policy drift | Constant lives next to `getMarketTokenList`; one place to edit. Could be promoted to backend-driven later |
| Helpers called server-side during SSR crash on `localStorage` access | All `localStorage` access in `token-cache.ts` is guarded by `typeof window !== "undefined"`; mirror is a plain `Map`. Verified by SSR-stub test scenario |
| Quota or private-browsing localStorage write failure | `setTokenCache` wraps localStorage write in try/catch; in-memory mirror still updates so the current session works (cache just doesn't persist that session) |
| `select-token.tsx` field-shape change (from `{ value, label, icon }` to `DepositToken`) breaks JSX | U4 includes manual browser smoke check at the consumer; `pnpm run build` catches type errors |
| Aggressive helper deletion (`getTokenIcon`, `getTokenByValue`) breaks something the sweep missed | `pnpm run build` will catch any missed reference. If a future need surfaces, re-adding is a 3-line change |

---

## Documentation / Operational Notes

- No user-facing docs change
- No migration runbook needed — cache is opportunistic
- `CLAUDE.md` (frontend) data-fetching rules already cover the patterns used; no updates required

---

## Sources & References

- **Origin document:** [docs/brainstorms/2026-05-03-token-metadata-localstorage-cache-requirements.md](../brainstorms/2026-05-03-token-metadata-localstorage-cache-requirements.md)
- Existing localStorage pattern: `src/hooks/use-portfolio-from-storage.ts`
- Backend response shape: `src/lib/api.ts` (`DepositToken` interface, line 467)
- Chain config: `src/lib/chain-config.ts` (`ACTIVE_CHAIN.id`)
- Live endpoint sample: https://app-testnet.centuari.finance/api/deposit/tokens
