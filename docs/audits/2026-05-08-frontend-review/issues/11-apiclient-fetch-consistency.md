---
title: "Migrate `getMyAssets` / `getOrderHistory` / `getTransactionHistory` / `getMyPositions` to `apiClient`"
labels: ["chore", "medium", "area:api", "bug"]
---

# Summary

Four functions in `lib/api.ts` use raw `fetch()` instead of the centralized `apiClient` wrapper. They miss the `AuthError` typed-throw, the centralized error-message extraction, and the `Authorization` header consistency. CLAUDE.md says all fetch should go through `apiClient`; these four are the last holdouts.

# Why

The offending functions:

- `getMyAssets` — `lib/api.ts:324-355`
- `getMyPositions` — `lib/api.ts:206-247` *(added in deep-dive Round 8 — initially missed)*
- `getOrderHistory` — `lib/api.ts:620-669`
- `getTransactionHistory` — `lib/api.ts:694-768`

Each does roughly:

```ts
const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
const res = await fetch(`/api/portfolio/...?${searchParams.toString()}`, { headers });
if (!res.ok) {
  throw new Error(`API error: ${res.status} ${res.statusText}`);  // generic
}
const json = await res.json();
return { ...json };
```

Versus `apiClient` (`lib/api-client.ts:29`):

```ts
if (res.status === 401) throw new AuthError(message);  // typed → triggers fresh-token retry in useAuthToken.authFetch
// extracts NestJS-shaped error.message; falls back gracefully
```

**Concrete consequences:**

1. **No 401 retry.** A transient 401 at the moment of token refresh — common — surfaces as a generic error to the user instead of being silently retried. `useAuthToken.authFetch` is designed to retry once, but only when the underlying call throws `AuthError`.
2. **No backend error message.** The user sees "API error: 400 Bad Request" instead of the actual NestJS-formatted reason.
3. **CLAUDE.md violation** (Data fetching Rule 1): all fetch must live in `lib/api.ts` and go through the `apiClient` wrapper.
4. **Surface for further inconsistency** — every contributor who touches one of these functions has to remember to handle 401s manually.

# Acceptance criteria

- [ ] `apiClient` accepts an optional `query?: Record<string, string | number | undefined>` parameter (or a `URLSearchParams`) so callers don't need to build query strings by hand.
- [ ] `getMyAssets`, `getMyPositions`, `getOrderHistory`, `getTransactionHistory` are rewritten to call `apiClient` with method `"GET"`, `token`, and the new `query` parameter. The pagination / filter logic stays the same.
- [ ] `grep -rn "fetch(\`/api" src/lib/api.ts` returns no matches.
- [ ] All three functions still return the same response shape (the small "meta normalization" that wraps the backend's `meta` block stays — just move it to live around the `apiClient` call, or do it inside `apiClient` if the shape generalizes).
- [ ] The existing tests for these functions still pass. Add a test that verifies a 401 from one of these endpoints triggers `AuthError` (not a generic `Error`).
- [ ] Manual smoke: open Portfolio → Assets, Order History, Transaction History tabs after the change. No regressions in pagination / filters / empty states.

# Files to change

- `src/lib/api-client.ts` — extend signature with `query?` parameter
- `src/lib/api.ts` (lines 206-247, 324-355, 620-669, 694-768) — rewrite four functions
- Any existing tests for these functions (`src/hooks/__tests__/use-my-assets.test.ts`, `use-my-positions.test.ts`, `use-order-history.test.ts`, `use-transaction-history.test.ts`)

# Suggested patch sketch

```ts
// src/lib/api-client.ts
export async function apiClient<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    token?: string;
    query?: Record<string, string | number | undefined>;
  } = {},
): Promise<T> {
  const { query, ...rest } = options;
  const qs = query
    ? "?" + new URLSearchParams(
        Object.entries(query)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)]),
      ).toString()
    : "";
  // ... rest of the existing implementation, with `${API_URL}${path}${qs}`
}
```

```ts
// src/lib/api.ts
export async function getMyAssets(
  token: string,
  params?: { page?: number; limit?: number },
): Promise<MyAssetsResponse> {
  const json = await apiClient<{ data: MyAssetItem[]; meta?: Meta }>("/portfolio/my-assets", {
    token,
    query: { page: params?.page ?? 1, limit: params?.limit ?? 10 },
  });
  // existing meta normalization unchanged
}
```

# Out of scope

- Adding Zod schemas for these responses (tracked under M-2 / a future validation backbone PR — see action-plan.md section 4).
- Refactoring the response-shape normalization. Keep behavior identical in this PR.
- Migrating other endpoints to use `query` (the rest already use `apiClient` correctly).

# Estimated effort

~40 LOC across 5 files + test updates. ~1-1.5 hours.

# Dependencies

None.

# References

- Audit: `docs/audits/2026-05-08-frontend-review/security.md` (deep-dive Round 3, M-8)
- CLAUDE.md: Data fetching Rule 1 (centralized API functions in `lib/api.ts` via `apiClient`)
