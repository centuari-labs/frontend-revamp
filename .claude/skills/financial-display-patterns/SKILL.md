---
name: financial-display-patterns
description: >
  Read when building or modifying financial value display: health factor,
  rates, fees, token amounts. Wrong display = wrong user decisions.
allowed-tools: Read, Write, Edit, Glob
---

# Financial Display Patterns

## Health Factor
**Component:** `src/components/centuari-health-factor.tsx` (animated bar + color)
**Computation:** `src/hooks/use-borrow-calculations.ts`
**Formula:** `HF = ((C_usd - D_settled) * LTV_weighted) / (D_settled + borrowAmount)`
**Colors:** see CLAUDE.md Financial Display Rules #2
**Safety:** Returns 0 if inputs invalid. Badge variant in `health-factor-badge.tsx`.

## Token Amounts
`truncateBalance(value, decimals=3)` in `lib/utils.ts` — FLOORS, never rounds. Safe for balances.
`formatCurrency(value)` — USD formatting with small-value handling.
Decimals: USDC/USDT=6, USDe=18. Always use `token.decimals`, never hardcode.
Internal arithmetic: full precision (BigInt/parseUnits). Truncate ONLY for display AFTER computation.

## Settlement Fee
Constants in `use-lend-form.ts`: `SETTLEMENT_FEE_BPS=1`, `SETTLEMENT_FEE_MAX_USD=0.05`
Formula: `min(amount * 0.0001, 0.05)`
Must show before every close/maturity/repay confirm.

## Trade Fees
Maker: 10 BPS (0.1%). Taker: 20 BPS (0.2%). Shown in order review.

## Interest Rates
APR from backend in BPS. Display: `rate / 100` for %. Interest: `amount * rate * timeInYears`.
Protocol uses simple interest (APR). Label clearly — never display APR as APY.

## Prices
Source: `PriceProvider` context (`contexts/price-context.tsx`) via Socket.io.
`useTokenPrice(assetId)` → `number | undefined`. Known gap: no Zod runtime validation.

## Projected HF
Before borrow or collateral withdrawal: show projected HF. If < 1.0: DISABLE confirm button (not just warn).

## Price feed errors
If `useTokenPrice(assetId)` returns `undefined`: show dash or "—", never $0.00. If WS disconnects: keep last known price + show stale badge. If price is NaN/negative/unreasonably large (>$1M for stablecoins): treat as invalid, show error state. Log the anomaly.

## Loading states
Skeleton for initial load. Stale indicator on WS disconnect (not stale data shown as current). Never show 0/blank for financial values during load.
