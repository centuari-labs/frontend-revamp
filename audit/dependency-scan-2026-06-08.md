# frontend-revamp — Dependency Scan (2026-06-08)

External-audit prep, hub-only scope. Tool: `pnpm audit` (pnpm 10.23.0).
Raw machine-readable output: [`dependency-scan-2026-06-08.json`](./dependency-scan-2026-06-08.json)
(regenerated **after** the patches below — it reflects the post-patch lockfile).

## Summary

| Severity | Pre-patch | Post-patch | Disposition |
|---|---|---|---|
| Critical | 1 | **0** | Patched (vitest) |
| High | 30 | **29** | 1 patched (next); 29 accepted (transitive) |
| Moderate | 52 | 52 | Accepted (transitive; not triaged individually) |
| Low | 3 | 3 | Accepted |

`pnpm audit` exits non-zero whenever any advisory exists, so a non-zero exit is
expected here and is not a gate failure.

## Patched (low-risk, directly controllable)

| Package | Where | Change | Advisory | Rationale |
|---|---|---|---|---|
| `vitest` | devDependency | `^4.0.18` → `^4.1.8` (installed 4.1.8) | **CRITICAL** GHSA — Vitest UI server arbitrary file read (`<4.1.0`) | Dev-only test runner, never shipped; the UI server is not run in CI/headless. Minor bump within v4, fully patched. Full suite (57 files / 678 tests) green after bump. |
| `next` | dependency (`16.2.5` → `16.2.7`) | patch-level bump | **HIGH** GHSA-xxxx — App Router Middleware / Proxy bypass (`>=16.0.0 <16.2.6`) | Patch-level security release within the same minor; the one production-shipped high in our direct control. Unit suite green; full `next build` runs in CI on the PR. |

After these two bumps: **0 critical, 29 high**.

## Accepted high-severity findings (29)

None of the remaining highs are in a package we declare directly at a vulnerable
version; every one is a transitive dependency whose version is pinned by a parent
we do not control. Forcing them via `pnpm.overrides` would risk breaking the
parent (notably Privy's auth stack), so they are **accepted and tracked**, not
force-patched, in this audit window.

### A. `@privy-io/react-auth` transitive chain (~21 advisories)

`axios` ×12, `hono` ×3, `h3` ×2, `preact` ×1, `lodash` ×1, `defu` ×1, `js-cookie` ×1, `picomatch` ×1.

- **Path:** `@privy-io/react-auth@3.7.0 → x402 / wagmi → … → {axios,hono,h3,…}`.
- **Why not patched:** these are 3–6 levels deep under Privy; the fixed versions
  are not yet pulled by Privy's published dependency ranges. An override could
  desync Privy's auth runtime.
- **Exploitability in this context:** most are server-oriented CVEs (axios
  NO_PROXY / Proxy-Authorization leakage, SSRF, MITM; hono JWT-middleware algorithm
  confusion; h3 request smuggling / SSE injection). This bundle is a browser SPA
  that only talks to our own backend — it does not run an axios HTTP proxy server,
  a hono server, or an h3 server, so the primary attack surfaces are not reachable
  from the shipped frontend. Residual risk: prototype-pollution gadgets (axios/defu/
  lodash/js-cookie) — low impact in a first-party SPA.
- **Disposition:** ACCEPT for the audit window. **Action item:** upgrade
  `@privy-io/react-auth` once Privy ships releases that bump these transitives;
  re-run this scan after the upgrade.

### B. Dev/build-tooling transitives — not shipped to production (8)

`undici` ×3 (via `jsdom`), `vite` ×2 + `picomatch` ×1 (via `@vitejs/plugin-react`).

- **Why not patched:** `undici` is pinned by `jsdom@28`; `vite`/`picomatch` by
  `@vitejs/plugin-react@5`. Both are test/build-only devDependencies.
- **Exploitability:** zero production exposure — these never enter the browser
  bundle; they run only in the local/CI test and build toolchain.
- **Disposition:** ACCEPT (dev-only). Will resolve naturally on the next
  `jsdom` / `@vitejs/plugin-react` major-version refresh.

### C. `socket.io-parser` (1) — via `socket.io-client`

- **Advisory:** unbounded binary-attachment allocation → client-side DoS (`<4.2.6`).
- **Why not patched:** transitive under `socket.io-client@4.8.3`, which has not
  bumped its parser pin. Patch is `>=4.2.6`.
- **Exploitability:** the DoS requires a malicious **server** sending crafted
  frames; this client connects only to our own first-party backend, so the threat
  model does not apply under normal operation.
- **Disposition:** ACCEPT. Monitor `socket.io-client` upstream; revisit if a
  patched release lands.

## Moderate / low (55)

52 moderate + 3 low, all transitive (same Privy / dev-tooling chains). Not triaged
individually for this hub-only audit window — none are production-shipped at a
directly-controllable version. Recommend re-running `pnpm audit` after the Privy
upgrade in item A, which clears the bulk of these.

## Reproduce

```bash
cd frontend-revamp
pnpm install --frozen-lockfile
pnpm audit --json > audit/dependency-scan-2026-06-08.json   # exits 1 if any advisory
pnpm audit                                                  # human-readable table
```
