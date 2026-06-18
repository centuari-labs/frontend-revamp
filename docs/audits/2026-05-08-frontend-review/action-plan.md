# Action Plan

Smallest blast radius first. Each row is one PR.

## 1. Quick wins, no design decisions (~30 min total)

| # | Change | File | Source |
|---|---|---|---|
| 1.1 | Rename `centuari-calender.tsx` → `centuari-calendar.tsx` | `src/components/centuari-calender.tsx` (+ 1 import in `app/portfolio/transaction-history/page.tsx`) | conventions L |
| 1.2 | Replace `props: any` with `React.SVGProps<SVGSVGElement>` | `icons/ic-target-centuari.tsx:3`, `icons/ic-atom-centuari.tsx:2`, `icons/ic-lighting-centuari.tsx:3` | conventions H6 / react H |
| 1.3 | Delete redundant `staleTime: 10_000` (matches global default) | `src/contexts/user-details-context.tsx:44` | both reviews M |
| 1.4 | Add `runtime` + `dynamic` + `Cache-Control: no-store` to proxy route | `src/app/api/[...path]/route.ts` | react NEXT-M3 |
| 1.5 | Strip / dev-gate `console.log`s leaking wallet state | `embedded-wallet-guard.tsx:33-43`, `use-on-chain-balance.ts:50`, `data-table-all-position.tsx:177`, `select-single-token.tsx:67` | sec M-1 |

## 2. Security highs (1–2 PRs)

| # | Change | File | Source |
|---|---|---|---|
| 2.1 | `isAddress(TREASURY_ADDRESS)` sanity check before any `writeContract`; surface a typed error if misconfigured | `src/hooks/use-deposit.ts:23-24, 118-158` | sec H-1 |
| 2.2 | Throw on missing `BACKEND_URL`; reject `content-length > 1MB`; `AbortController` 15s timeout; stream `upstream.body` through | `src/app/api/[...path]/route.ts` | sec H-2 |

## 3. Conventions janitorial (3 PRs)

| # | Change | File | Source |
|---|---|---|---|
| 3.1 | Delete `src/lib/fee-calculations.ts`; route the two dialogs through `useTransactionFees` | `lib/fee-calculations.ts` (-38 LOC), `centuari-borrow-dialog.tsx:30,104`, `centuari-lend-dialog.tsx:30,148` | conventions C |
| 3.2 | Add 8 new `QUERY_KEYS.*`; migrate 7 hooks off hardcoded keys | `lib/query-keys.ts` + 7 hook files | both reviews H |
| 3.3 | Replace inline success `useState` with `useSuccessDialog()` | `centuari-{withdraw,borrow,repay,lend,deposit}-dialog.tsx`, `data-table-all-position.tsx:84` | conventions H |
| 3.4 | Replace discriminated-union casts with `isLendPosition`/`isBorrowPosition` guards | `market/position-section.tsx:408,414,432,451`, `data-table-all-position.tsx:92`, `lib/positions-adapter.{api,mock}.ts` | conventions H |

## 4. Validation backbone (1 PR introducing a helper, then mechanical edits)

| # | Change | File | Source |
|---|---|---|---|
| 4.1 | Introduce `lib/safe-parse.ts` (Zod helper) and Zod schemas for `apiClient` envelope, addresses (`viem.isAddress`), decimals (`z.number().int().min(0).max(36)`) | new file + `lib/api-client.ts:58` + `lib/api.ts` | sec M-2 / conventions Type Rule 2 |
| 4.2 | Validate WS `prices-snapshot` / `prices-update` payloads with `z.record(z.string(), z.number().finite().nonnegative())` | `contexts/price-context.tsx:28-34`, `lib/socket.ts` | sec M-3 |
| 4.3 | Replace `JSON.parse(stored)` with `safe-storage.ts` helper | `hooks/use-portfolio-from-storage.ts:12,41,56,83`, `data-table-assets.tsx:83-149`, `lib/utils.ts:232` | sec M-4 |
| 4.4 | Treat `decimals == null` as a hard error in `useDeposit` / `useOnChainBalance` | `use-deposit.ts:74`, `use-on-chain-balance.ts:29,37` | sec L-2 |

## 5. Re-render hot path (1 PR per item)

| # | Change | File | Source |
|---|---|---|---|
| 5.1 | Order book stable keys (`${side}-${row.apr}`); `React.memo(OrderRowView)`; pre-reverse `displayBorrow` in the hook | `components/market/order-book.tsx:25-32, 94, 99, 111, 174` | react PERF-C4 |
| 5.2 | `PriceProvider` → `useSyncExternalStore` per-asset subscribers (or selector context) | `contexts/price-context.tsx:22-58` | react PERF-H1 |
| 5.3 | `useMarketDetail` returns memoized object via TanStack `select` | `hooks/use-market-detail.ts:37-54`, `use-market-data.ts:11-19` | react TQ-M |

## 6. Bundle work (1 RFC + 1 implementation PR)

| # | Change | File | Source |
|---|---|---|---|
| 6.1 | RFC: which heavy modules to lazy-load (Privy, Wagmi connector list, Recharts, GSAP, Toaster) | n/a | react PERF-C2 |
| 6.2 | `next/dynamic({ ssr: false })` for the agreed list | `components/provider.tsx`, chart components, navbar | react PERF-C2 |
| 6.3 | Add `images.remotePatterns` for `assets.coingecko.com`, `experimental.optimizePackageImports` for `lucide-react` | `next.config.ts` | react NEXT-M2 |
| 6.4 | Replace 13+ raw `<img>` with `next/image`; add `priority` to LCP logo | `app/loading.tsx:11`, `loading-screen.tsx:11`, `centuari-navbar.tsx:337`, etc. | react NEXT-M1 |

## 7. Streaming & RSC (1 RFC + several follow-up PRs)

| # | Change | File | Source |
|---|---|---|---|
| 7.1 | Wrap `useSearchParams` in `<Suspense>` (or migrate to `app/market/[asset]/page.tsx`) | `app/market/page.tsx:18` | react PERF-C3 |
| 7.2 | Add per-route `loading.tsx`, `error.tsx`, `not-found.tsx` | `app/{market,portfolio,faucet,points}/` | react NEXT-H1 |
| 7.3 | Add per-page `metadata` / `generateMetadata` (Next 15 async params) | `app/{market,portfolio,faucet,points}/page.tsx` | react NEXT-H2 |
| 7.4 | Incremental RSC migration starting with `app/page.tsx` → `TokenGrid` as a client island | `app/page.tsx`, `components/home/token-grid.tsx` | react PERF-C1 |

## 8. React 19 idioms (1 PR per area)

| # | Change | File | Source |
|---|---|---|---|
| 8.1 | Drop `forwardRef` wherever the component owns its props (12 files) | listed in react R19-H1 | react R19-H1 |
| 8.2 | Replace effect-based form-prefill with lazy initial state / event handler; remove all 3 `eslint-disable react-hooks/exhaustive-deps` | `use-borrow-form.ts:122-147,167-200`, `use-lend-form.ts:122-147` | react R19-M1 |

## 9. Decomposition (one PR per dialog)

| # | Change | File | LOC | Source |
|---|---|---|---|---|
| 9.1 | Extract `useWithdrawDialog()` + sub-views | `centuari-withdraw-dialog.tsx` | 510 → ≤300 | conventions C |
| 9.2 | Extract `useRepayDialog()` + sub-views | `centuari-repay-dialog.tsx` | 447 | conventions C |
| 9.3 | Extract `useLendDialog()` + sub-views | `centuari-lend-dialog.tsx` | 421 | conventions C |
| 9.4 | Extract `useLoginForm()` (CLAUDE.md form rule 3) | `centuari-login-dialog.tsx` | 409 | conventions C |
| 9.5 | Extract `useDepositDialog()` | `centuari-deposit-dialog.tsx` | 390 | conventions C |
| 9.6 | Extract `useSellPositionDialog()` | `centuari-sell-position-dialog.tsx` | 370 | conventions C |
| 9.7 | Extract `useBorrowDialog()` | `centuari-borrow-dialog.tsx` | 348 | conventions C |
| 9.8 | Decompose `use-borrow-form.ts` and `use-lend-form.ts` into focused sub-hooks | `hooks/use-borrow-form.ts` (396), `hooks/use-lend-form.ts` (351) | conventions C |
| 9.9 | Build the missing shared sub-components — `FeeBreakdown`, `OrderSuccessDialog`, `DepositFlowView` (or strike from CLAUDE.md) | new files | conventions C |

## 10. Stylistic sweep (one PR each)

| # | Change | File | Source |
|---|---|---|---|
| 10.1 | Eliminate inline `style={{...}}` (36 occurrences); use Tailwind / CSS-vars for dynamic values | listed in conventions Rule 5 | conventions C |
| 10.2 | Wrap all template-literal / concatenated classNames in `cn()` (32 occurrences) | listed in conventions Rule 2 | conventions H |
| 10.3 | Replace 30+ hardcoded hex/rgba with design tokens (`primary-blue-*`, `success-*`, etc.) | listed in conventions Rule 1 | conventions M |
| 10.4 | Replace `bg-x dark:bg-y` patterns with CSS variables / `next-themes` tokens | listed in conventions Rule 4 | conventions M |
| 10.5 | Snake_case → camelCase prop codemod (92 occurrences across 8 files) | listed in conventions Naming | conventions H |

## 11. Architectural decisions (RFC, not code)

These are policy choices, not bugs. Decide and document.

| # | Question | Source |
|---|---|---|
| 11.1 | Mock-adapter pattern: commit to it (build 14 missing adapter pairs) or strike from CLAUDE.md | conventions Hook Rule 4 |
| 11.2 | shadcn `components/ui/` discipline: revert custom files (`glass-card.tsx`, `section-error.tsx`, modified `dialog.tsx`/`multi-select.tsx`) or update CLAUDE.md | conventions Rule 6 |
| 11.3 | `AccessCodeGate` semantics: keep as UI-only overlay (document explicitly) or harden to actually withhold children when unauthenticated | sec Info-1 |
| 11.4 | CSP `'unsafe-inline'` / `'unsafe-eval'` removal — needs a Privy-compatible nonce strategy | sec L-3 |

---

## Suggested rollout

- **Week 1:** Section 1 (quick wins) + Section 2 (security highs) + Section 3 (janitorial). All small, all reviewable in <30 min each.
- **Week 2:** Section 4 (validation) + Section 5 (re-render hot path). The validation PR is high-leverage; the order book fix is a correctness bug.
- **Week 3:** Section 6 (bundle) + Section 7 (streaming/RSC) RFCs. Implementation rolls into following weeks.
- **Week 4+:** Section 8 (React 19) + Section 9 (decomposition) + Section 10 (style sweep), in parallel with Section 7 implementation.
- **Async:** Section 11 RFCs can run alongside everything else — they're decisions, not code.
