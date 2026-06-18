# Frontend Review — 2026-05-08

Three-lens audit of `src/` (excluding `app/sandbox/` per request):

1. Pentest-style security audit
2. React 19 + Next.js 15 best-practices review
3. CLAUDE.md convention compliance

## Documents

- [`security.md`](./security.md) — OWASP-style findings, Privy/Wagmi/Web3 risk, proxy hardening
- [`react-nextjs.md`](./react-nextjs.md) — RSC boundaries, bundle, hooks, React 19 idioms
- [`conventions.md`](./conventions.md) — CLAUDE.md rule violations with file:line tables
- [`action-plan.md`](./action-plan.md) — prioritized PR sequence, smallest blast radius first
- [`forward-looking-hardening.md`](./forward-looking-hardening.md) — playbook for what to harden when Next.js features (middleware, Server Actions, ISR, etc.) get adopted
- [`issues/`](./issues/) — 15 ready-to-paste GitHub issues plus `create-issues.sh` for bulk submission

## TL;DR

1. **Two security highs** — sanity-check `TREASURY_ADDRESS` before any `writeContract` (`use-deposit.ts:23-24`); add body-size cap + timeout + abort to the proxy route (`app/api/[...path]/route.ts`).
2. **Bundle/perf is the biggest non-security regression risk** — every page is `"use client"`, zero `next/dynamic`, `useSearchParams` is not Suspense-wrapped (`app/market/page.tsx:18`), and the order book uses index keys (`market/order-book.tsx`).
3. **Conventions are drifting fast** — duplicate fee module (`lib/fee-calculations.ts`), 7 dialogs over the 300-LOC cap, snake_case props in 8 files, mock-adapter pattern abandoned everywhere except positions, `useSuccessDialog` bypassed in 5 dialogs.

## Severity counts

| Severity | Security | React/Next | Conventions |
|---|---|---|---|
| Critical | 0 | 4 | 4 |
| High | 2 | 4 | 8 |
| Medium | 4 | 5 | 8 |
| Low / Info | 4 | 1 | 3 |

## Scope

- **In:** `src/app/` (excl. sandbox), `src/components/`, `src/hooks/`, `src/lib/`, `src/contexts/`, `src/types/`, `next.config.ts`
- **Out:** `src/app/sandbox/`, backend (`BACKEND_URL`), Privy SDK internals, smart contracts, dependency CVE scan, build-time CDN integrity

## Things done well (calibration)

- Provider stack composition is clean and ordered correctly; each context value is memoized.
- Socket.io ref-counted singleton with 1s release survives React Strict Mode double-mounts (`lib/socket.ts`) — non-trivial, often missed.
- Proxy `[...path]` route blocks path traversal (`..`, `//`), allowlists headers, drops cookies — covered by tests.
- CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy all set in `next.config.ts:21-56`.
- `next/font/local` for Switzer with the variable-font CSS variable pattern is correct.
- TypeScript strict largely holds — `any` count is low (5 source files).
- `apiClient` envelope unwrapping + typed `AuthError` on 401 is a clean pattern.
- Test infrastructure follows conventions: `renderHookWithProviders`, fixtures in `__tests__/helpers/fixtures/`.
