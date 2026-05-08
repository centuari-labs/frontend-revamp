---
title: "Hardcoded prices in `lib/portfolio-data.ts` mis-value IDRX (16 000×) and XSGD (35%)"
labels: ["bug", "high", "area:web3", "area:portfolio", "data-integrity", "trust"]
---

# Summary

`src/lib/portfolio-data.ts` ships a hardcoded `tokenList` whose `price` field is treated by several consumers as authoritative USD price. For two of the production tokens, that price is **fundamentally wrong**:

- **IDRX** is pegged to Indonesian Rupiah (~Rp 1 per IDRX, $1 ≈ Rp 16 000 → 1 IDRX ≈ $0.000063). The file ships `price: 1` (treated as $1).
  **Display error: ~16 000× over-valuation.**
- **XSGD** is pegged to Singapore Dollar (1 XSGD = 1 SGD ≈ $0.74). The file ships `price: 1`.
  **Display error: ~35% over-valuation.**

The crypto entries (BTC=45 000, ETH=2 800, ARB=1.2) are also stale, but those tokens are not currently in the production deposit list — IDRX and XSGD **are**, so the bug is live for users whose markets are on the IDRX/XSGD pairs.

This is a financial-display + submit-path bug. Frontend treats hardcoded prices as USD. Forms compute `amountInUsd = amount * tokenInfo.price` for the submit handler and for inline display. Tables compute `walletBalance = amountInUsd / token.price`. For IDRX/XSGD users, every USD figure rendered or submitted is off by 35× to 16 000×.

# Why this is High (not Critical)

Backend is the authoritative source of truth for orders/positions. If the backend re-validates against real prices, a user who *thinks* they're submitting a $100 order is bounded by what the backend will actually accept. So no direct on-chain fund loss results from this misrepresentation.

But:

- **Trust:** the dApp displays misleading USD values. Users see "$100" next to "100 IDRX" when the real value is $0.006. They lose trust in the displayed math.
- **Wrong decisions:** users size orders based on the wrong USD figure. They borrow / lend amounts that don't match their intent.
- **Edge case:** if backend ever computes from the *frontend-supplied* USD figure (e.g. for analytics, fees, or off-chain accounting), the off-by-orders-of-magnitude propagates server-side.

Critical-grade if backend trusts the frontend USD figure for any state-changing math; High in the typical case where backend has its own price oracle.

# The data

```ts
// src/lib/portfolio-data.ts (excerpt)
{ value: "btc",  label: "Bitcoin",  ltv: 0.75, price: 45000, ... },   // stale (~$95k current)
{ value: "eth",  label: "Ethereum", ltv: 0.80, price: 2800,  ... },   // stale
{ value: "arb",  label: "Arbitrum", ltv: 0.65, price: 1.2,   ... },   // stale
{ value: "usdc", label: "USDC",     ltv: 0.90, price: 1,     ... },   // ✓
{ value: "usdt", label: "USDT",     ltv: 0.90, price: 1,     ... },   // ✓
{ value: "dai",  label: "DAI",      ltv: 0.85, price: 1,     ... },   // ✓
{ value: "xsgd", label: "XSGD",     ltv: 0.90, price: 1,     ... },   // ❌ should be ~0.74
{ value: "idrx", label: "IDRX",     ltv: 0.90, price: 1,     ... },   // ❌ should be ~0.000063
{ value: "centuari", label: "Centuari", ltv: 0.80, price: 0.5, ... },  // unknown reference
{ value: "nvdaon", label: "NVIDIA (Ondo Tokenized)", price: 150, ... }, // approx, will drift
{ value: "aaplon", label: "Apple (Ondo Tokenized)",  price: 230, ... }, // approx, will drift
```

# Live consumers

```bash
$ grep -rn -E "tokenList\[|\.price\b" src/ | grep -v test
src/components/portfolio/tables/data-table-assets.tsx:230   # walletBalance = amountInUsd / token.price
src/hooks/use-lend-form.ts:127                              # tokenAmount = editingPosition.amount / tokenInfo.price
src/hooks/use-lend-form.ts:187                              # amountInUsd = numericAmount * tokenInfo.price  (handleLimitSubmit)
src/hooks/use-lend-form.ts:251                              # amountInUsd = numericAmount * tokenInfo.price  (handleMarketSubmit)
```

Four call sites. Two of them are in **submit handlers** for the lend form — meaning the wrong USD figure can flow into the request body if the order DTO ever uses `amountInUsd` (verify with the backend's `createLendLimitOrder` payload contract).

# Acceptance criteria

- [ ] All four call sites are migrated off `tokenInfo.price` as a USD source. Replace with `useTokenPrice(assetId)` from `PriceProvider` (Socket.io WS feed). For consumers that don't have an `assetId`, derive it from the symbol (the existing `getTokenPrice(amountInUsd, walletBalance)` helper in `lib/utils.ts:13` is a working alternative when both fields exist).
- [ ] If a consumer is unable to use the WS feed (e.g. table renders 100+ rows and subscribing per-row would kill perf), introduce a `useTokenPrices()` bulk-read helper that returns the entire `Record<assetId, number>` (already what `PriceContext` provides; just expose it).
- [ ] **Remove the `price` field from `TokenInfo`** entirely. The hardcoded prices are a footgun — keep `ltv`, `liquidationThreshold`, `liquidationPenalty` (those are protocol constants and OK to be hardcoded), drop `price`. New consumers won't be tempted to import the wrong source.
- [ ] If `price` truly cannot be removed because other consumers use it as a fallback, document inline that the fallback is only safe for `usdc/usdt/dai` (true 1:1 USD pegs), and explicitly throw / fall back to "unknown" for any non-USD token. Lock this behind a typed helper: `getStablecoinPriceOrThrow(symbol): 1`.
- [ ] Remove `centuari/nvdaon/aaplon` entries entirely if those tokens are not in the production deposit list (likely future-track tokens). At minimum mark them with a comment "draft/unused" so contributors know not to wire them up with the existing wrong prices.
- [ ] Vitest coverage:
  - Lend-form submit with IDRX selected: assert the request body's USD figure (if any) matches `numericAmount × wsTokenPrice`, not `numericAmount × 1`.
  - `data-table-assets` row for IDRX displays the WS-fed USD value, not `walletBalance × 1`.
- [ ] Manual smoke (live deployment):
  - Open lend dialog on the IDRX market. Type "100". Verify the displayed USD value matches the backend's quoted price (open Network tab, compare to `useTokenPrice` payload).
  - Same for XSGD market.
  - Same for any USDC market — should be unchanged ($1 each direction).
- [ ] Optional: add a CI lint rule (eslint custom or `biome` plugin) that flags any `.price` access on a `TokenInfo`-typed value. Forces future contributors to go through `useTokenPrice`.

# Files to change

- `src/lib/portfolio-data.ts` — remove or strongly type the `price` field
- `src/components/portfolio/tables/data-table-assets.tsx` (line 230)
- `src/hooks/use-lend-form.ts` (lines 127, 187, 251)
- `src/contexts/price-context.tsx` — possibly expose a bulk-read helper if needed for the table
- Tests for the above

# Out of scope

- The APR units round-trip bug (#18) — separate issue, same family of "consumers trust hardcoded math".
- The HF formula divergence (#22) — same theme, separate scope.
- A full Zod-validation pass on the WS price feed — already tracked under M-3 in `security.md`.

# Estimated effort

~50-80 LOC including the bulk-read helper + test updates. ~2-3 hours including manual smoke on the live IDRX/XSGD markets.

# Dependencies

- Best landed *after* #16 (typecheck restored). With `noUncheckedIndexedAccess` (per #16 expanded AC), removing the `price` field from `TokenInfo` will surface every consumer at compile time.
- Soft dep on M-3 / future Zod validation work — but doesn't block.

# References

- Audit: `docs/audits/2026-05-08-frontend-review/security.md` (deep-dive Round 11, H-NEW-3)
- Hardcoded prices: `src/lib/portfolio-data.ts`
- Cross-references: #18 (APR units), #22 (HF formulas) — same "trust the source of truth" theme
