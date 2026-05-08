# CLAUDE.md Convention Compliance

Audit of `src/` against the rules in `/CLAUDE.md`. Sandbox excluded.

## Summary

| Severity | Category | Count |
|---|---|---|
| **Critical** | Inline styles (`style={{...}}`) | 36 occurrences across 24 files |
| **Critical** | Inline `tokenPrice` calculation duplicating `getTokenPrice()` | 4 occurrences |
| **Critical** | Duplicate fee logic (`fee-calculations.ts` mirrors `fee-utils.ts`) | 1 file (38 LOC vs 12 LOC) |
| **Critical** | Dialog components > 300 LOC | 7 files |
| **Critical** | Hooks > 200 LOC | 2 files (`use-borrow-form.ts` 396, `use-lend-form.ts` 351) |
| **High** | shadcn `components/ui/` files modified | 2 files (`multi-select.tsx`, `dialog.tsx`) |
| **High** | Inline `useState` for success state instead of `useSuccessDialog()` | 5 dialog files |
| **High** | Hardcoded query keys (string literals) | 7 hooks |
| **High** | `any` type usage | 5 occurrences |
| **High** | Direct cast to discriminated-union types | 6 occurrences |
| **High** | Snake_case props (`token_image`, etc.) | 92 occurrences across 8 dialog files |
| **High** | className concatenation without `cn()` | 32 occurrences |
| **Medium** | Hardcoded hex colors in className/JSX | 30+ occurrences |
| **Medium** | `useQuery`/`useQueryClient` in components | 2 files |
| **Medium** | Hardcoded `dark:` classes (light/dark conditional) | 2 occurrences (post-sandbox-exclusion) |
| **Medium** | Redundant `staleTime: 10_000` matching global default | 1 occurrence |
| **Medium** | `use-` prefix on non-hook component file | 2 files |
| **Low** | Type alias name collision (`PositionProps` in two files) | 2 files |
| **Low** | File typo `centuari-calender.tsx` | 1 file |
| **Low** | Mock-adapter pattern partially adopted | 14 hooks fetch without `*-adapter.api.ts/.mock.ts` split |

## Violations by rule

### Component Rule 5 — No inline styles (`style={{...}}`)

| File:line | Notes |
|---|---|
| src/app/layout.tsx:30 | root layout uses `style={{}}` |
| src/components/select-maturity.tsx:84 | `paddingLeft` |
| src/components/lend-main-view.tsx:86 | `opacity` |
| src/components/centuari-withdraw-dialog.tsx:162 | `opacity` |
| src/components/centuari-withdraw-dialog.tsx:307 | `opacity` |
| src/components/borrow-main-view.tsx:122 | `opacity` |
| src/components/select-single-token.tsx:89 | inline style block |
| src/components/borrow-deposit-view.tsx:27 | `opacity` |
| src/components/wrong-network-banner.tsx:69 | `zIndex` |
| src/components/centuari-glass-surface.tsx:81, 88 | `boxShadow`/inline gradient |
| src/components/collateral-list-display.tsx:57 | `zIndex: 10 - index` |
| src/components/lend-deposit-view.tsx:93 | `opacity` |
| src/components/centuari-health-factor.tsx:202, 212, 223, 236, 242 | width/transform/etc. |
| src/components/ui/progress.tsx:25 | (shadcn — see Rule 6 violation) |
| src/components/centuari-navbar.tsx:326, 354, 367 | `backgroundColor`, masks |
| src/components/ui/toggle-group.tsx:37 | (shadcn — see Rule 6) |
| src/components/ui/chart.tsx:298 | (shadcn) |
| src/components/home/home-header.tsx:26 | inline style |
| src/components/market/mobile-lend-borrow-buttons.tsx:55, 80 | inline styles |
| src/components/ui/multi-select.tsx:781, 832, 882 | (shadcn) |
| src/components/portfolio/portfolio-chart.tsx:71 | inline style |
| src/components/leaderboard/point-badge.tsx:23, 27 | dynamic size, transform |
| src/components/ui/glass-card.tsx:31, 37 | (shadcn) |
| src/components/market/order-book.tsx:42, 254, 264, 286 | dynamic widths/heights |
| src/components/faucet/faucet-header.tsx:12 | inline style |
| src/components/product-tour/centuari-tour-tooltip.tsx:30, 42 | `pointerEvents` |

For genuinely dynamic values (`width: ${pct}%`), use a CSS custom property: `style={{ '--w': pct }}` then `className="w-[var(--w)]"`.

### Component Rule 6 — shadcn `components/ui/` is read-only

| File:line | Notes |
|---|---|
| src/components/ui/multi-select.tsx:8 | Imports `tokenList` from `@/lib/portfolio-data` — domain coupling inside shadcn primitive |
| src/components/ui/multi-select.tsx (1128 LOC total) | Largest file in repo; not stock |
| src/components/ui/dialog.tsx:8 | Imports `CentuariGlassLayers` from `@/components/centuari-glass-surface` — primitive depends on domain wrapper |
| src/components/ui/glass-card.tsx | Non-stock; not part of shadcn's official `new-york` set |
| src/components/ui/section-error.tsx | Same |

Move `glass-card.tsx`/`section-error.tsx` out of `ui/`, refactor `dialog.tsx`/`multi-select.tsx` to remove domain dependencies.

### Component Rule 7 — Domain components combining shadcn primitives must use `centuari-` prefix

These compose shadcn primitives but lack the prefix:

`amend-dialog.tsx`, `transaction-success-dialog.tsx`, `tx-success-auto-close-dialog.tsx`, `use-all-assets-as-collateral-dialog.tsx`, `use-asset-as-collateral-dialog.tsx`, `dialog-token-header.tsx`, `lend-main-view.tsx`, `borrow-main-view.tsx`, `lend-deposit-view.tsx`, `borrow-deposit-view.tsx`, `order-type-tabs.tsx`, `select-token.tsx`, `select-single-token.tsx`, `select-chain.tsx`, `select-maturity.tsx`, `network-switcher.tsx`, `health-factor-badge.tsx`, `maturity-toggle.tsx`, `loading-screen.tsx`, `page-container.tsx`, `stat-card.tsx`, `stat-row.tsx`, `wrong-network-banner.tsx`, `access-code-gate.tsx`, `embedded-wallet-guard.tsx`, `collateral-empty-state.tsx`, `collateral-list-display.tsx`, `target-apr-maturity-input.tsx`, `currency-value.tsx`, `tier-emblem.tsx` (≥25 violations).

Critical: `use-all-assets-as-collateral-dialog.tsx` and `use-asset-as-collateral-dialog.tsx` export React components but use the `use-` prefix reserved for hooks (Naming rule 2). Rename to `centuari-*-dialog.tsx`.

### Component Rule 8 — Dialog components < 300 LOC

| File | LOC | Action |
|---|---|---|
| src/components/centuari-withdraw-dialog.tsx | 510 | Decompose select-token/enter-amount steps |
| src/components/centuari-repay-dialog.tsx | 447 | Extract success view, summary panel |
| src/components/centuari-lend-dialog.tsx | 421 | Extract `lend` and `deposit-collateral` view modes |
| src/components/centuari-login-dialog.tsx | 409 | Decompose email/social flows |
| src/components/centuari-deposit-dialog.tsx | 390 | Extract token-selection step |
| src/components/centuari-sell-position-dialog.tsx | 370 | Extract summary/success |
| src/components/centuari-borrow-dialog.tsx | 348 | Mirror lend-dialog refactor |

Combined: 2 895 LOC.

### Component Rule 9 — Shared sub-components must not be duplicated

| Component | Status |
|---|---|
| `FeeBreakdown` | **Not present.** Fee data inlined into `market/lend-form.tsx`, `market/borrow-form.tsx`, `centuari-lend-dialog.tsx`, `centuari-borrow-dialog.tsx` — each renders its own `transactionFee` block. |
| `OrderSuccessDialog` | **Not present.** Bespoke dialogs exist instead: `transaction-success-dialog.tsx`, `tx-success-auto-close-dialog.tsx`. |
| `DepositFlowView` | **Not present.** Each dialog inlines its own `viewMode === "deposit-collateral"` logic. |

Either build the components or strike the rule from CLAUDE.md.

### Hook Rule 7 — Hooks < 200 LOC

| File | LOC |
|---|---|
| src/hooks/use-borrow-form.ts | 396 |
| src/hooks/use-lend-form.ts | 351 |
| src/hooks/use-deposit.ts | 200 (boundary) |

`use-borrow-form` mixes 8 `useState`, 3 `useEffect`, fee derivation, and submit handling — decompose into focused sub-hooks (`use-borrow-limit-form`, `use-borrow-market-form`, `use-borrow-collateral-derivation`).

### Hook Rule 8 — No duplicated calculations across 2+ hooks

| Calculation | Locations |
|---|---|
| `selectedToken.label.toUpperCase().slice(0, 4)` | use-borrow-form.ts:244, use-borrow-form.ts:306, use-lend-form.ts:215, use-lend-form.ts:275 |
| `asset.symbol.toLowerCase() === <value>.toLowerCase()` lookup | use-lend-dialog-data.ts:19-22, use-borrow-portfolio-data.ts:36, use-on-chain-balance.ts:21-24, use-lend-form.ts:65, use-lend-form.ts:111, use-positions.ts:15 |
| `wallet.address.toLowerCase() === addr.toLowerCase()` | use-deposit.ts:85, use-network-switch.ts:15-20, use-wallet-disconnect-listener.ts:30-31 |
| Inline `tokenPrice = availableBalanceUsd / availableBalance` | components/centuari-withdraw-dialog.tsx:67, components/centuari-repay-dialog.tsx:91, components/portfolio/tables/data-table-assets.tsx:230 |

Move to `lib/utils.ts` (e.g., `getTokenSymbolSlug`, `findAssetBySymbol`, reuse `getTokenPrice`).

### Hook Rule 9 — Use `useSuccessDialog()` micro-hook for success state

| File:line | Inline state |
|---|---|
| src/components/centuari-withdraw-dialog.tsx:43 | `useState(false)` for showSuccessDialog |
| src/components/centuari-borrow-dialog.tsx:86-87 | `showSuccessDialog`, `successAmount` |
| src/components/centuari-repay-dialog.tsx:69-70 | `showSuccessDialog<boolean>`, `successAmount<string>` |
| src/components/centuari-lend-dialog.tsx:90-91 | `showSuccessDialog`, `successAmount` |
| src/components/centuari-deposit-dialog.tsx:49-52 | `showSuccessDialog`, `successData<{...}>` |
| src/components/portfolio/tables/data-table-all-position.tsx:84 | `WithdrawSuccessMessage \| null` inline |

### Hook Rule 4 — Mock adapter pattern

Only `positions-adapter.api.ts` + `positions-adapter.mock.ts` exist. The pattern is otherwise abandoned:

| Hook fetching data | Missing adapter pair |
|---|---|
| src/hooks/use-market-data.ts | none |
| src/hooks/use-market-detail.ts | none |
| src/hooks/use-orderbook.ts | none |
| src/hooks/use-deposit-tokens.ts | none |
| src/hooks/use-deposit-balance.ts | none |
| src/hooks/use-rate-history.ts | none |
| src/hooks/use-lend-borrow-assets.ts | none |
| src/hooks/use-my-portfolio.ts | none |
| src/hooks/use-my-assets.ts | none |
| src/hooks/use-my-positions.ts | none |
| src/hooks/use-open-orders.ts | none |
| src/hooks/use-order-history.ts | none |
| src/hooks/use-transaction-history.ts | none |
| src/hooks/use-recent-trades.ts | none |
| src/hooks/use-on-chain-balance.ts | none |

`src/lib/use-mock.ts` exports `USE_MOCK = false` but no source-side hook reads it (only test files reference it). Either commit to the pattern (build adapters) or formally retire it from CLAUDE.md.

### Hook Rule 3 / Data fetching rule — `useQuery`/`useMutation` not in components, and `useQueryClient` only via wrapper

| File:line | Issue |
|---|---|
| src/components/centuari-user-menu.tsx:19, 71 | `useQueryClient` in component |
| src/components/centuari-lend-dialog.tsx:35, 78 | `useQueryClient` + manual `invalidateUserQueries` invocation in component |

Move into dedicated hooks.

### Data fetching Rule 3 — Query keys centralized in `lib/query-keys.ts`

| File:line | Hardcoded key |
|---|---|
| src/hooks/use-market-detail.ts:24 | `["market-detail", assetId]` |
| src/hooks/use-market-data.ts:6 | `["market"]` |
| src/hooks/use-open-orders.ts:40 | `[ ... ]` literal array |
| src/hooks/use-deposit-tokens.ts:12 | `["deposit-tokens"]` |
| src/hooks/use-order-history.ts:40 | inline literal |
| src/hooks/use-deposit-balance.ts:12 | `["deposit-balance", assetId]` |
| src/hooks/use-rate-history.ts:14 | `["rate-history", assetId]` |
| src/hooks/use-transaction-history.ts:37 | inline literal |

### Data fetching Rule 5 — No redundant `staleTime` matching default

| File:line | Issue |
|---|---|
| src/contexts/user-details-context.tsx:44 | `staleTime: 10_000` duplicates global default in `provider.tsx:16` |

### Data fetching Rule 6 — Polling intervals from `lib/query-config.ts`

| File:line | Issue |
|---|---|
| src/contexts/user-details-context.tsx:45 | `refetchInterval: 15_000` (hardcoded) |

### Styling Rule 1 — Tailwind tokens; no hardcoded hex/rgb in className strings

Sample (cap 20):

| File:line | Hex |
|---|---|
| src/app/portfolio/page.tsx:269 | `bg-[#2A4AC2]` |
| src/app/portfolio/page.tsx:274 | `bg-[#AAC7F9]` |
| src/app/portfolio/page.tsx:279 | `bg-[#4F8FFD]` |
| src/components/select-maturity.tsx:82 | `bg-[#1a1d24] border-[#2a2e38]` |
| src/components/centuari-token-card.tsx:141 | `bg-[#1D7656]/30` |
| src/components/currency-value.tsx:18 | `text-[#2B2F37]` default prop |
| src/components/centuari-add-collateral.tsx:31 | `bg-[#1D7656]/50` |
| src/components/centuari-chart.tsx:71-150 | 9 hardcoded hex |
| src/components/centuari-navbar.tsx:131-373 | 6 hardcoded `rgba()` + `#fff` |
| src/components/tier-emblem.tsx:63, 68, 75 | 4 hardcoded hex gradients |
| src/components/select-single-token.tsx:87 | `bg-[#1a1d24] border-[#2a2e38]` |
| src/components/leaderboard/point-badge.tsx:35-69 | 4 hex strokes/fills |
| src/components/leaderboard/leaderboard-table.tsx:93, 253 | `fillColor="#10C16E"` |
| src/components/wrong-network-banner.tsx:71 | `bg-[#111]` |
| src/components/centuari-health-factor.tsx:36-87 | 10+ hex constants in lookup table |
| src/app/points/page.tsx:239 | `stroke="#374151"` |
| src/components/centuari-glass-surface.tsx:53-90 | 12 `rgba()` literals |

Total > 30 occurrences. None reference design tokens.

### Styling Rule 2 — `cn()` for conditional classes; no string concatenation

32 occurrences (cap 20):

| File:line | Pattern |
|---|---|
| src/app/layout.tsx:24 | `className={\`${switzer.variable} ...\`}` |
| src/app/portfolio/page.tsx:285, 290 | template-literal classes |
| src/components/currency-value.tsx:34 | `className={decimalClassName}` (untransformed) |
| src/components/centuari-input.tsx:72 | `className={"mb-1.5 ..."}` (pointless object expression) |
| src/components/centuari-table.tsx:347 | template literal with conditional |
| src/components/centuari-token-card.tsx:88 | template literal with ternary |
| src/components/centuari-alert.tsx:22 | `\`...${className}\`` with prop interpolation |
| src/components/order-type-tabs.tsx:32, 38 | passes raw `glassTabClassName` |
| src/components/network-switcher.tsx:68 | template literal |
| src/components/centuari-health-factor.tsx:201, 211 | template literal with `${color}` |
| src/components/centuari-navbar.tsx:386, 490 | template literals |
| src/components/tables/shared-columns.tsx:278 | template literal |
| src/components/tables/centuari-data-table.tsx:79, 86 | template literals |
| src/components/leaderboard/dialogs/submit-proof-dialog.tsx:65 | template literal |
| src/components/leaderboard/leaderboard-table.tsx:208 | template literal |
| src/components/home/token-grid-skeleton.tsx:18 | template literal |
| src/components/market/order-book.tsx:39, 47, 118 | template literals |
| src/components/market/lend-form.tsx:107, 219, 240 | template literals |
| src/components/market/apr-history-card.tsx:63, 68 | raw class variable |
| src/components/market/transaction-summary.tsx:46 | template literal |
| src/components/collateral-empty-state.tsx:29 | inline ternary in `className` |

### Styling Rule 4 — Dark mode via CSS vars; no hardcoded `dark:` light/dark conditions

| File:line | Issue |
|---|---|
| src/components/centuari-input.tsx:35 | `bg-input/30 dark:bg-input/50` |
| src/components/target-apr-maturity-input.tsx:52 | `dark:bg-input/30` |
| src/components/centuari-badge.tsx:20 | `bg-amber-600 dark:bg-amber-400` |
| src/components/market/lend-borrow-card.tsx:33, 39 | dark/light conditional chain |

### Type Rule 1 — No `any`

| File:line | Pattern |
|---|---|
| src/components/centuari-typography.tsx:67 | `CentuariProps<any>` |
| src/components/centuari-chart.tsx:40 | `payload?: any[]` |
| src/components/centuari-chart.tsx:63 | `payload?: any` |
| src/components/icons/ic-target-centuari.tsx:3 | `props: any` |
| src/components/icons/ic-atom-centuari.tsx:2 | `props: any` |
| src/components/icons/ic-lighting-centuari.tsx:3 | `props: any` |

### Type Rule 3 — Type guards over direct casts

| File:line | Cast |
|---|---|
| src/components/portfolio/tables/data-table-all-position.tsx:92 | `(allData as PositionProps[])` |
| src/components/market/position-section.tsx:408 | `o.status as PositionStatus` |
| src/components/market/position-section.tsx:414 | `})) as Position[]` |
| src/components/market/position-section.tsx:432 | `})) as Position[]` |
| src/components/market/position-section.tsx:451 | `})) as Position[]` |
| src/hooks/use-positions.ts:40 | `[] as Position[]` |
| src/lib/positions-adapter.mock.ts:161 | `existing[matchIdx] as LendPosition` |
| src/lib/positions-adapter.mock.ts:214 | `existing[matchIdx] as BorrowPosition` |
| src/lib/positions-adapter.api.ts:44 | double cast `as PositionStatus` |

Use `isLendPosition()`/`isBorrowPosition()` from `src/types/positions.ts:52,56`.

### Type Rule 2 — Zod for runtime validation of external data

`lib/api.ts` (lines 224, 336, 649, 721, 799) and `lib/api-client.ts:29` parse JSON without Zod validation. WebSocket messages in `lib/socket.ts` similarly are not parsed via Zod. (Cross-ref: SEC-M2, SEC-M3 in `security.md`.)

### Naming — Snake_case props on dialog components

92 occurrences across 8 dialog files. Should be camelCase per CLAUDE.md.

| File | Snake-case prop names |
|---|---|
| src/components/centuari-token-card.tsx (lines 23-118) | `token_image`, `token_name`, `token_symbol`, `asset_id`, `market_id` |
| src/components/centuari-lend-dialog.tsx | same prop set |
| src/components/centuari-borrow-dialog.tsx | same |
| src/components/centuari-repay-dialog.tsx | `token_image`, `token_name`, `token_symbol` |
| src/components/centuari-sell-position-dialog.tsx | same |
| src/components/centuari-deposit-dialog.tsx | snake-case props in body |
| src/components/centuari-withdraw-dialog.tsx | mixed |
| src/components/dialog-token-header.tsx | snake_case passthrough |

`lend-main-view.tsx` already uses camelCase — codebase contradicts itself.

### Naming — `use-` prefix reserved for hooks

| File | Issue |
|---|---|
| src/components/use-all-assets-as-collateral-dialog.tsx | React component, not a hook |
| src/components/use-asset-as-collateral-dialog.tsx | Same |

Rename to `centuari-...-dialog.tsx`.

### Naming — File typo

| File | Issue |
|---|---|
| src/components/centuari-calender.tsx | "calender" → "calendar" (referenced in `app/portfolio/transaction-history/page.tsx:3`) |

### Fee/financial Rule 1 — Single source of truth in `lib/fee-utils.ts`

Critical duplicate:

| File:line | Issue |
|---|---|
| src/lib/fee-calculations.ts:1-12 | Re-declares `SETTLEMENT_FEE_RATE`, `SETTLEMENT_FEE_CAP`, `TAKER_FEE_RATE`; exports `calculateFees()` |
| src/components/centuari-borrow-dialog.tsx:30, 104 | Imports `calculateFees` from `fee-calculations` |
| src/components/centuari-lend-dialog.tsx:30, 148 | Same |

Hooks correctly use `lib/fee-utils.ts` via `useTransactionFees`. Delete `fee-calculations.ts`, migrate the two dialogs.

### Fee/financial Rule 2 — `getTokenPrice()` from `lib/utils.ts`

| File:line | Inline calculation |
|---|---|
| src/components/centuari-withdraw-dialog.tsx:67-70 | `selectedAsset.availableBalanceUsd / selectedAsset.availableBalance` |
| src/components/centuari-repay-dialog.tsx:91-93 | Same formula |
| src/components/centuari-deposit-dialog.tsx | computes price inline |
| src/components/portfolio/tables/data-table-assets.tsx:230 | Inverse formula `walletBalance = amountInUsd / token.price` |

`getTokenPrice(amountInUsd, walletBalance)` exists at `lib/utils.ts:12`.

### Form rule 3 — Complex forms have `use-*-form.ts` hook

`src/components/centuari-login-dialog.tsx:33-81` defines `emailFormSchema` + `useForm` inline. Extract to `hooks/use-login-form.ts`.

### Test rules

Tests follow conventions correctly (`renderHookWithProviders`, fixtures in `src/__tests__/helpers/fixtures/positions.ts`). No violations.

## Top 10 worst offenders

| Rank | File | LOC | Primary issues |
|---|---|---|---|
| 1 | src/components/ui/multi-select.tsx | 1128 | shadcn read-only violation; 3 inline `style={{}}`; massive non-stock file |
| 2 | src/lib/api.ts | 842 | 5 direct `fetch()` calls (acceptable here); no Zod validation |
| 3 | src/components/portfolio/tables/data-table-assets.tsx | 658 | snake-case props; inline `walletBalance` price calc; 10 `useState/useEffect`; JSON.parse without Zod |
| 4 | src/components/market/position-section.tsx | 635 | 4 raw `as Position[]` casts; no type guards |
| 5 | src/components/centuari-navbar.tsx | 522 | 5 inline `style={{}}`; 6 hardcoded `rgba()`; template-literal classNames |
| 6 | src/components/centuari-withdraw-dialog.tsx | 510 | dialog > 300 LOC; 2 inline styles; inline `tokenPrice`; inline success state |
| 7 | src/components/centuari-repay-dialog.tsx | 447 | dialog > 300 LOC; inline `tokenPrice`; inline success state |
| 8 | src/components/centuari-table.tsx | 427 | template-literal className; type alias `PositionProps` collides with `data-table-all-position.tsx:44` |
| 9 | src/components/market/borrow-form.tsx | 426 | template-literal classNames; hardcoded fees in display |
| 10 | src/components/centuari-lend-dialog.tsx | 421 | dialog > 300 LOC; uses duplicate `calculateFees`; `useQueryClient` in component; inline success state |

Honourable mentions: `centuari-login-dialog.tsx` (409), `centuari-deposit-dialog.tsx` (390), `centuari-sell-position-dialog.tsx` (370), `hooks/use-borrow-form.ts` (396).

## Quick-win codemod targets

1. **Delete `src/lib/fee-calculations.ts`** and migrate 2 dialogs to `useTransactionFees`. Net deletion: -38 LOC.

2. **Codemod `props: any` in icon SVGs** (3 files): replace with `props: React.SVGProps<SVGSVGElement>`.

3. **Rename `use-*-collateral-dialog.tsx`** → `centuari-*-collateral-dialog.tsx` (2 files).

4. **Rename `centuari-calender.tsx`** → `centuari-calendar.tsx`.

5. **Replace inline `tokenPrice = x.balanceUsd / x.balance`** with `getTokenPrice(...)` (3 sites).

6. **Migrate inline-string queryKeys to `QUERY_KEYS.*`** in 7 hook files. Add to `lib/query-keys.ts`:

   ```ts
   MARKET: 'market',
   MARKET_DETAIL: 'market-detail',
   DEPOSIT_TOKENS: 'deposit-tokens',
   DEPOSIT_BALANCE: 'deposit-balance',
   RATE_HISTORY: 'rate-history',
   OPEN_ORDERS: 'open-orders',
   ORDER_HISTORY: 'order-history',
   TRANSACTION_HISTORY: 'transaction-history',
   ```

7. **Move `src/contexts/user-details-context.tsx:44-45`** values into `QUERY_CONFIG` (delete redundant `staleTime: 10_000`; replace `refetchInterval: 15_000` with a named constant).

8. **Snake_case → camelCase prop codemod** for `token_image`, `token_name`, `token_symbol`, `asset_id`, `market_id`. Bulk rename across 8 files.

9. **Replace inline `useState(false)` success state** with `useSuccessDialog()` in 5 dialogs.

10. **Wrap discriminated-union casts with type guards.** Replace `o.status as PositionStatus` and `})) as Position[]` with `.filter(isLendPosition)` / `.filter(isBorrowPosition)`.

11. **Move shadcn customizations out of `components/ui/`**: `glass-card.tsx` → `centuari-glass-card.tsx`; `section-error.tsx` → top-level `centuari-section-error.tsx`.
