# CLAUDE.md — Centuari Frontend (Next.js)

Centuari is a cross-chain fixed-rate credit protocol on Arbitrum. This is the frontend-revamp: ground-up UI redesign. Faucet and landing page are complete; market and portfolio flows are active development.

## Model Routing

Default: claude-sonnet-4-6. Escalate to claude-opus-4-6 ONLY for: new transaction construction patterns, security audits on tx/wallet/approval changes, multi-layer security debugging, or Playwright strategy for critical financial flows. Never use haiku.

## Stack

Next.js 15.5.7 · React 19.1.0 · TypeScript strict · TailwindCSS v4 · shadcn/ui (new-york) · Radix · TanStack Query v5 · RHF + Zod v4 · Privy 3.7.0 + Wagmi 3.0.1 · Viem 2.39.3 · Socket.io-client · Vitest 4.0.18 · Playwright 1.58.2 · Biome 2.2.6 · pnpm

## Commands

```bash
pnpm run dev          # next dev --turbopack -p 3200
pnpm run build        # production build
pnpm run test         # vitest run
pnpm run test:watch   # vitest watch
pnpm run test:e2e     # playwright test
npx tsc --noEmit      # typecheck (no script — run directly)
npx biome check src/  # lint
npx playwright test --ui  # headed debug mode
npx playwright install    # install browsers (first-time setup)
```

## Architecture

```
src/app/         Next.js App Router (market, portfolio, faucet, points, sandbox, api/)
src/components/  shadcn ui/ (READ-ONLY) + market/ + portfolio/ + centuari-*.tsx
src/hooks/       41+ custom hooks (data, blockchain, forms, mutations)
src/lib/         api-client.ts, utils.ts, chain-config.ts, socket.ts, tokens, portfolio-data
src/types/       TypeScript definitions
src/contexts/    PriceProvider (Socket.io), auth context
```

Provider stack: ThemeProvider > PrivyProvider > QueryClientProvider > WagmiProvider > EmbeddedWalletGuard > PriceProvider > TourProvider

Data flow: Component > Hook > TanStack Query > apiClient (/api proxy) > Backend REST | Socket.io > Real-time | Wagmi/Viem > Chain (deposit only)

**Key fact:** Only `src/hooks/use-deposit.ts` makes on-chain transactions (ERC20 approve + Treasury.deposit). All other ops (lend, borrow, repay, withdraw) are backend API calls with JWT auth via `src/lib/api-client.ts`.

**Contract interaction:** ABIs in `abis/` dir (typed `as const`). `erc20Abi` from viem. Addresses from env only. Tx lifecycle: check allowance → approve exact → wait receipt → re-estimate gas → execute → wait receipt → confirm with backend → invalidate queries. Errors: wagmi throws → mutation catch → `mutation.error.message` to UI. Full pattern in `tx-builder-patterns` skill.

## Client Environment Variables

```
NEXT_PUBLIC_PRIVY_APP_ID        NEXT_PUBLIC_WS_URL
NEXT_PUBLIC_CHAIN_ENV           NEXT_PUBLIC_USE_MOCK
NEXT_PUBLIC_RPC_URL             NEXT_PUBLIC_TREASURY_ADDRESS
```

None contain secrets. `BACKEND_URL` is server-side only.

## Security Invariants

1. `to` address in every tx = `NEXT_PUBLIC_TREASURY_ADDRESS` from env. Never from user input, URL, or API.
2. Token approvals = exact amount. Never `MaxUint256`. Canonical: `use-deposit.ts:90`.
3. Receipt `status === "reverted"` checked after every on-chain tx.
4. Network = `ACTIVE_CHAIN` verified before any on-chain tx.
5. `dangerouslySetInnerHTML` only in `components/ui/chart.tsx` (shadcn read-only). Banned everywhere else.
6. User input never flows into contract params, HTML, or URL construction without validation.
7. `next.config.ts` has X-Frame-Options DENY, HSTS, nosniff. **Missing: CSP** — add before production.
8. WebSocket price data (`price-context.tsx`) has TS types but NO Zod runtime validation. **Known gap.**
9. Wallet addresses must be checksummed (viem `getAddress()`) before contract calls and display.
10. `use-wallet-disconnect-listener.ts` handles account change — logs out on address mismatch. Chain change must halt pending tx flows.
11. No private keys, JWTs, or sensitive position data in localStorage/sessionStorage. Only UI prefs and non-sensitive portfolio balances.

## Financial Display Rules

1. **Health factor** from backend `user-details` API. Formula: `HF = ((C_usd - D_settled) * LTV_weighted) / (D_settled + borrowAmount)`. Source: `use-borrow-calculations.ts`.
2. **HF colors:** >=2.5 green, >=1.5 blue, >=1.2 yellow, >=1.0 orange, <1.0 red. Source: `centuari-health-factor.tsx`.
3. **Settlement fee:** `min(amount * 0.0001, $0.05)`. Must show before confirm. Constants: `SETTLEMENT_FEE_BPS=1`, `MAX=$0.05`.
4. **Trade fees:** Maker 10 BPS (0.1%), Taker 20 BPS (0.2%).
5. **Collateral withdrawal:** projected HF < 1.0 = confirm button DISABLED, not just warned.
6. **Token amounts:** `truncateBalance()` floors (never rounds). Internal arithmetic at full precision (BigInt/parseUnits).
7. **APR/APY:** Always labeled. Protocol uses simple interest (APR). Never display one as the other.

## Known Attack Vectors (DeFi frontend, 2025-2026)

- **DNS hijacking** (Curve, Curvance, Maple Finance 2026) — Defense: DNSSEC, IPFS backup, SRI on scripts
- **npm supply chain** (React CVE-2025-55182) — Defense: pin exact versions, `pnpm audit` in CI
- **XSS wallet drainer** (SEAL advisory) — Defense: strict CSP, no dangerouslySetInnerHTML, sanitize input
- **Blind signing** — Defense: decode and display calldata before sign, simulate every tx
- **Tx parameter tampering** (to/amount from URL/API) — Defense: all addresses from config, validate amounts
- **Unlimited approval phishing** — Defense: exact-amount approvals only (already implemented)
- **WebSocket data injection** — Defense: Zod schema validation on all WS messages (known gap)

## Playwright E2E Backlog (0 browser UI tests exist)

Wallet connection · Lend order flow · Borrow order flow · Deposit (on-chain) · Withdraw (HF guard) · Repay (fee display) · HF display correctness · Order book WS updates · Network mismatch · Tx failure UX

**Unit test gaps:** APR/APY conversion functions · Address checksum validation · Price feed error/fallback handling

## Code Conventions

- **Files:** kebab-case. Components `PascalCase`, hooks `useCamelCase`, constants `SCREAMING_SNAKE`.
- **Components:** one per file. `centuari-*` prefix for domain components wrapping shadcn. Never modify `components/ui/`.
- **Hooks:** one per file. Wrap TanStack Query — never use `useQuery`/`useMutation` directly in components. Mock adapter pattern: `*-adapter.api.ts` + `*-adapter.mock.ts`.
- **Styling:** Tailwind only via `cn()`. No inline styles. Mobile-first. Dark mode via CSS vars + next-themes.
- **Forms:** React Hook Form + Zod. Extract complex form logic to `use-*-form.ts` hooks.
- **Types:** Strict mode. No `any`. Zod for runtime validation of external data. Shared types in `types/`.
- **Formatting:** Biome 2.2.6 — tab indent JS/TS, double quotes, space indent CSS/JSON.

## Gotchas

- HF can change between form open and sign — re-fetch before submission
- WS reconnection: show stale indicator, not stale data as current
- Privy embedded vs external wallet: different signing flows, test both
- Chain switch: wagmi may return stale data for 1-2 blocks
- Token decimals: USDC/USDT=6, USDe=18, RWA=varies. Always use `token.decimals`
- Backend response double-wrap: `{ statusCode, data: { statusCode, data: {...} } }`
- Mock vs real: `NEXT_PUBLIC_USE_MOCK=true` uses localStorage adapters

## Self-Improvement

After security finding → update Security Invariants. After display bug → add to Gotchas. After new tx flow → /write-e2e-tests mandatory. After dep upgrade on wallet/tx libs → /security-review. New model gen → /improve-workflow.
