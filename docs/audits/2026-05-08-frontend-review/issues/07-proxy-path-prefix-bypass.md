---
title: "Tighten proxy path allowlist — `market`/`deposit`/`withdraw` allow arbitrary suffix"
labels: ["security", "high", "area:proxy", "bug"]
---

# Summary

The catch-all proxy at `src/app/api/[...path]/route.ts` matches three of its allowed prefixes (`market`, `deposit`, `withdraw`) without a trailing slash. `path.startsWith(prefix)` therefore accepts arbitrary suffixes like `marketing`, `market-admin`, `deposit-internal`, `withdrawals-batch`. Any backend endpoint whose name happens to start with one of those strings becomes reachable through the proxy with the user's JWT attached.

This is a frontend proxy hardening fix — it does not depend on whether such endpoints exist on the backend today. The point is to *not* expose them by default.

Standalone issue (not part of the deposit-trust epic [#0]).

# Why

Current code:

```ts
const ALLOWED_PATH_PREFIXES = [
  "auth/",      // ✓ trailing slash
  "market",     // ✗ no slash
  "orders/",    // ✓
  "portfolio/", // ✓
  "deposit",    // ✗ no slash
  "withdraw",   // ✗ no slash
  "faucet/",    // ✓
];

function isPathAllowed(path: string): boolean {
  return ALLOWED_PATH_PREFIXES.some(
    (prefix) => path === prefix.replace(/\/$/, "") || path.startsWith(prefix),
  );
}
```

For `prefix = "market"`, `path.startsWith("market")` accepts:

- `"market"` ✓ intended (exact)
- `"market/asset-id"` ✓ intended (subpath)
- `"marketing"` ✗ **unintended**
- `"market-admin"` ✗ **unintended**
- `"market-debug-internal"` ✗ **unintended**

Same for `deposit` → `deposit-admin`, `deposit-internal-tools`, `depositories`. Same for `withdraw` → `withdraw-batch`, `withdrawals-internal`.

**Why this is High:**

- Frontend-only fix; trivial.
- Blast radius depends on backend: any internal/admin endpoint whose path collides becomes reachable from any browser with a valid JWT.
- Even if backend is clean today, the proxy should not be a shape constraint that any future endpoint must avoid.

**Why this is not Critical:**

- It does not enable JWT theft or fund drain on its own.
- The user's own JWT is still required by the backend.
- Exploitability depends on a backend endpoint actually existing with a colliding prefix and weaker authz than expected.

# Acceptance criteria

- [ ] All entries in `ALLOWED_PATH_PREFIXES` end with a trailing `/`. The list now means "this prefix plus a subpath", not "any string starting with this".
- [ ] Endpoints that legitimately exist as exact paths without subpath (`POST /deposit`, `POST /withdraw`, `GET /market`) are accepted via a separate `ALLOWED_EXACT_PATHS` list.
- [ ] `isPathAllowed` is rewritten to check `ALLOWED_EXACT_PATHS` first, then `ALLOWED_PATH_PREFIXES` with `startsWith`. The existing `path === prefix.replace(/\/$/, "")` shortcut goes away.
- [ ] Negative tests added to `src/app/api/__tests__/proxy-route.test.ts` for each of the colliding cases — must return 403:
  - `marketing`
  - `market-admin`
  - `marketers/list`
  - `deposit-admin`
  - `deposit-internal/refund`
  - `depositories`
  - `withdrawal`
  - `withdrawals-internal`
  - `withdraw-batch/run`
  - `faucet-admin` (defensive — `faucet/` is already correct, but include for completeness)
- [ ] Existing happy-path tests still pass (each entry in the existing `it.each` block must continue to be allowed).
- [ ] No behavior change visible to legitimate clients of the dApp — verify by smoke-testing deposit, withdraw, market view, orders, portfolio, and faucet flows in the dev environment.

# Files to change

- `src/app/api/[...path]/route.ts` (lines 8-22)
- `src/app/api/__tests__/proxy-route.test.ts` (extend negative-test block at lines 92-109)

# Suggested patch

```ts
// src/app/api/[...path]/route.ts

/**
 * Allowed API path prefixes. A request matches if its path either:
 *   - equals one of ALLOWED_EXACT_PATHS exactly, or
 *   - starts with one of ALLOWED_PATH_PREFIXES (which always end with "/").
 *
 * Trailing slashes prevent prefix collisions: "deposit/" matches "deposit/x"
 * but NOT "deposit-admin".
 */
const ALLOWED_PATH_PREFIXES = [
  "auth/",
  "market/",
  "orders/",
  "portfolio/",
  "deposit/",
  "withdraw/",
  "faucet/",
] as const;

const ALLOWED_EXACT_PATHS = new Set<string>([
  "market",   // GET /market
  "deposit",  // POST /deposit
  "withdraw", // POST /withdraw
]);

function isPathAllowed(path: string): boolean {
  if (ALLOWED_EXACT_PATHS.has(path)) return true;
  return ALLOWED_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}
```

# Suggested test additions

```ts
// src/app/api/__tests__/proxy-route.test.ts (in the "blocks disallowed path" describe block)

it.each([
  "marketing",
  "market-admin",
  "marketers/list",
  "deposit-admin",
  "deposit-internal/refund",
  "depositories",
  "withdrawal",
  "withdrawals-internal",
  "withdraw-batch/run",
  "faucet-admin",
])("blocks prefix-collision path: %s", async (path) => {
  const req = makeRequest(path);
  const res = await GET(req, makeParams(path));

  expect(res.status).toBe(403);
  expect(mockFetch).not.toHaveBeenCalled();
});
```

# Out of scope

- Adding body-size cap / timeout / abort to the proxy (separate hardening — tracked under audit H-2 in `security.md`; create a follow-up issue when ready).
- Removing the localhost fallback for `BACKEND_URL` (tracked under H-2).
- Streaming the upstream response body (tracked under H-2).
- Backend-side authz audit of any specific endpoint — out of scope for the frontend.

# Estimated effort

~10 LOC code + ~10 LOC test. ~30 minutes including local run.

# Dependencies

None. Can ship immediately. Independent of the deposit-trust epic.

# References

- Audit: `docs/audits/2026-05-08-frontend-review/security.md` (deep-dive H finding, post-pentest)
- Existing tests: `src/app/api/__tests__/proxy-route.test.ts`
