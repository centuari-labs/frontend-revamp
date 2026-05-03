# Token Metadata localStorage Cache (Frontend-Only)

**Date:** 2026-05-03
**Status:** Ready for Planning
**Scope:** Frontend-only (no backend changes required)

## What We're Building

Persist the token metadata list (`/api/deposit/tokens`) to `localStorage` so the frontend fetches it from the backend at most once every 6 hours per chain, instead of re-fetching on every page reload. The hardcoded `TOKENS`, `MARKET_TOKEN_LIST`, and `TOKEN_LOGO_MAP` in `src/lib/tokens.ts` are removed — the helper functions stay (same signatures) but read from a module-level mirror hydrated from the cache.

### Current Behavior
```
Page load → useDepositTokens() → React Query fetch (in-memory only)
Page reload → React Query cache lost → fetch again
Hardcoded TOKENS / MARKET_TOKEN_LIST / TOKEN_LOGO_MAP in src/lib/tokens.ts
  → out of sync with backend (RWA tokens AAPLon/SLVon/TLTon missing)
```

### Target Behavior
```
First page load:
  localStorage miss → fetch /deposit/tokens → write to localStorage with
  { chainId, tokens, fetchedAt } → hydrate module-level mirror

Subsequent page loads (within 6h):
  localStorage hit + not expired → hydrate mirror synchronously, skip backend fetch

After 6h TTL:
  localStorage hit + expired → background refetch → overwrite cache (new tokens auto-saved)

Chain switch:
  Different chainId → different cache key → independent lifecycle per chain
```

## Why This Approach

- **Removes per-reload backend hit.** React Query's `staleTime: 5 min` only helps within a session. localStorage persists across hard reloads and tab restores, the actual reload pattern that drives unnecessary `/deposit/tokens` calls today.
- **Single source of truth in FE.** Hardcoded `TOKENS`/`MARKET_TOKEN_LIST` in `src/lib/tokens.ts` already drift from backend (RWA tokens missing). Removing them eliminates the dual-source maintenance burden.
- **Zero consumer churn.** Helper functions (`getTokenLogo`, `getTokenIcon`, `getTokenByValue`) keep the same synchronous signatures. Components are not refactored to handle async / loading state for token lookup.
- **No backend coordination needed.** Backend continues to send full metadata in other responses (positions, orders, etc.) — frontend simply ignores the duplicated fields and uses cached metadata as truth.

## Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Scope | Frontend-only | No backend changes; ships independently |
| Storage | `localStorage` | Persists across reloads/sessions; small payload (~11 entries) fits well within quota |
| Invalidation | TTL 6 hours | Balance between backend hit reduction and freshness; refetch overwrites with backend truth so new tokens auto-appear |
| Cache key | `centuari:tokens:v1:{chainId}` | Per-chain isolation; `v1` enables schema bumps |
| Hardcoded list | Removed | `TOKENS`, `MARKET_TOKEN_LIST`, `TOKEN_LOGO_MAP` deleted from `src/lib/tokens.ts` |
| Helper signatures | Unchanged | `getTokenLogo`, `getTokenIcon`, `getTokenByValue` remain synchronous; internally read from module-level mirror |
| Empty-cache fallback | Default values | When mirror is empty (truly first load before fetch resolves), helpers return `DEFAULT_LOGO` / `undefined` — no hardcoded fallback list |
| Library choice | Manual implementation | TanStack Persister is overkill for a single-query persistence need; custom code is ~80 lines |

## Scope

### Files to Create
- `src/lib/token-cache.ts` — `readTokenCache(chainId)`, `writeTokenCache(chainId, tokens)`, module-level mirror (`Map<symbol, DepositToken>`), TTL check, schema versioning constant

### Files to Modify
- `src/hooks/use-deposit-tokens.ts` — Add `initialData` from `readTokenCache`, set `staleTime: 6h` and `gcTime: Infinity`, call `writeTokenCache` on success
- `src/lib/tokens.ts` — Remove `TOKENS`, `MARKET_TOKEN_LIST`, `TOKEN_LOGO_MAP`. Refactor `getTokenLogo`, `getTokenIcon`, `getTokenByValue` to read from module mirror
- `src/lib/query-keys.ts` — Add `DEPOSIT_TOKENS: "deposit-tokens"` to `QUERY_KEYS` (currently the key is hardcoded inline in the hook)
- `src/lib/query-config.ts` — Replace `DEPOSIT_TOKENS_STALE_TIME` value with `6 * 60 * 60 * 1000` (6 hours)

### Files to Audit (consumers of removed exports)
Any file that imports `TOKENS`, `MARKET_TOKEN_LIST`, `TOKEN_LOGO_MAP` directly must be updated. Most should already use the helper functions, but a sweep is needed:
- Market dropdowns / header / position-section components that import `MARKET_TOKEN_LIST`
- Any direct `TOKEN_LOGO_MAP` lookups outside `getTokenLogo`

## Behavioral Spec

### Cache Lifecycle
1. **App boot** — `src/lib/token-cache.ts` checks `localStorage["centuari:tokens:v1:{ACTIVE_CHAIN.id}"]` synchronously, hydrates the in-memory `Map` if present and non-expired
2. **`useDepositTokens()` first call** — uses hydrated cache as `initialData`. If TTL not expired, no network request fires. If expired or missing, React Query fetches in background
3. **On fetch success** — `writeTokenCache` overwrites localStorage entry with fresh data + new `fetchedAt`, then re-hydrates the module mirror
4. **TTL check** — `(Date.now() - fetchedAt) > 6h` → treat as miss, trigger refetch but still return stale data to consumers (stale-while-revalidate)

### Cache Schema
```
Key:   centuari:tokens:v1:{chainId}
Value: { chainId: number, fetchedAt: number, tokens: DepositToken[] }
```
The `chainId` inside the value is a defensive check — if it does not match the cache key's chainId, treat as corrupt and discard.

### Helper Behavior When Cache Empty
- `getTokenLogo(value, assetImg?)` — returns `assetImg` if it starts with `/`, otherwise `DEFAULT_LOGO`
- `getTokenIcon(value)` — returns `DEFAULT_ICON`
- `getTokenByValue(value)` — returns `undefined`

This matches the existing fallback contract; no consumer needs to change.

### Lookup Key
Helpers continue to look up by **lowercased symbol** (e.g., `"usdc"`, `"btc"`). The mirror is keyed by `token.symbol.toLowerCase()`. Lookup-by-address is out of scope (would require touching every consumer).

## Out of Scope / Non-Goals

- **Backend changes.** Other API responses (positions, orders, balances) continue to send full token metadata. FE simply ignores those fields and uses cached metadata as truth.
- **Cross-tab sync.** No `storage` event listener. If tab A refetches and tab B is open, tab B keeps its in-memory mirror until next reload. Acceptable because TTL is short relative to typical session length.
- **Migration to address-based lookup.** Symbol-based lookup remains the contract. Future improvement, not this scope.
- **TanStack Query Persister.** Considered and rejected — overkill for single-query persistence.
- **Manual "refresh tokens" UI button.** Not needed; TTL covers freshness.
- **SSR pre-population.** localStorage is browser-only; helpers must be safe to call on the server (return defaults). No server-side hydration of token list.

## Assumptions & Open Questions

- **Auth requirement.** Current `useDepositTokens` passes JWT to `getDepositTokens(jwt)`. Assumption: endpoint works with empty token (current code passes `jwt ?? ""`). If auth is strictly required, first-load fetch must wait for `useAuthToken` to resolve — same as current behavior, no change.
- **DepositToken shape stability.** Current shape has `decimals: number | null` and `imageUrl: string | null`. Helpers must tolerate `null`s gracefully (already handled in `getTokenLogo`).
- **Chain switching UX.** Project has env-time toggle via `NEXT_PUBLIC_CHAIN_ENV`, not runtime user toggle. Per-chain key still useful for the env-flip case (separate browser localStorage entries per chain), and forward-compatible if runtime switching is added later.
- **Cache pollution / corruption.** If localStorage is full or write fails, the write step must swallow errors (don't crash the app). Read-side already returns "miss" on parse errors.

## Success Criteria

- After first successful fetch, hard-reloading the page does **not** trigger a network call to `/deposit/tokens` for at least 6 hours
- `src/lib/tokens.ts` no longer contains `TOKENS`, `MARKET_TOKEN_LIST`, or `TOKEN_LOGO_MAP` constants
- All RWA tokens from backend (AAPLon, SLVon, TLTon) appear in any UI that displays the token list, without code changes
- Switching `NEXT_PUBLIC_CHAIN_ENV` between testnet and (future) mainnet uses independent cache entries — no cross-chain leakage
- `getTokenLogo`, `getTokenIcon`, `getTokenByValue` keep current synchronous signatures (no consumer needs to handle Promise / loading state)
- Helpers safe to invoke during SSR (return defaults, no `localStorage is not defined` errors)

## Handoff Notes for Planning

Key implementation questions for `/ce-plan` to resolve:
1. Whether the module-level mirror lives inside `src/lib/token-cache.ts` (preferred — single owner) or inside `src/lib/tokens.ts`
2. How `useDepositTokens` should expose `initialData` without re-running the cache read on every render (memoize at module load)
3. Exact `gcTime` for the React Query cache (likely `Infinity` so RQ doesn't garbage-collect between component unmounts)
4. Sweep strategy for finding all `MARKET_TOKEN_LIST` / `TOKEN_LOGO_MAP` direct importers (grep-based audit)
