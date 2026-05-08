---
title: "`useOrderbook` / `useRecentTrades` should not render with default `decimals = 6`"
labels: ["bug", "medium", "area:market", "ux", "data-integrity"]
---

# Summary

Both `useOrderbook` and `useRecentTrades` default the `decimals` argument to `6` when the consumer doesn't pass it. During the brief window between mounting the market page and resolving the asset's `decimals` from the API, the orderbook and recent-trades panels render with the wrong magnitude — by a factor of 100× for WBTC (decimals=8), 10¹²× for an 18-decimals asset, etc.

The fault window is small in practice (typical network conditions resolve token info in ~100ms), but on slow networks or backend hiccups the user can see and act on visibly wrong market depth before the data corrects itself.

# Why

```ts
// src/hooks/use-orderbook.ts:45
export function useOrderbook(options?: {
  assetId?: string;
  decimals?: number;
}) {
  const { assetId, decimals = 6 } = options ?? {};
  // ...
  return levels.map((level) => ({
    apr: level.rate / 100,
    amount: Number(level.amount) / 10 ** decimals,   // ← wrong divisor during load
    side,
  }));
}

// src/hooks/use-recent-trades.ts:42 — same pattern
const { assetId, decimals = 6 } = options ?? {};
const amount = Number(event.amount) / 10 ** decimals;
```

Concrete failure: a WBTC market (decimals = 8). Backend sends `level.amount = "50000000"` (0.5 WBTC). With `decimals = 6` (default), display is `50000000 / 10^6 = 50` WBTC. With the correct `decimals = 8`, display is `0.5` WBTC.

A 100× over-display of market depth tells a casual user the market is more liquid than it is. They may submit a market order expecting fills that the actual book can't service.

The data is technically self-correcting once token info loads — but rendering should refuse to display data it doesn't yet trust, the same way the deposit dialog refuses to render the "balance" line until `useOnChainBalance` resolves.

# Acceptance criteria

- [ ] Both hooks make `decimals` **required** (no default fallback). The consumer must pass it explicitly.
- [ ] If the consumer doesn't yet have `decimals` resolved (e.g. `decimals = undefined`), the hook returns `{ borrowOrders: [], lendOrders: [], isConnected: false }` (orderbook) / `{ trades: [], isConnected: false }` (recent trades). The WebSocket subscription is **deferred** until `decimals` is available.
- [ ] Consumer components (`order-book.tsx`, `apr-history-card.tsx`, etc.) render their existing skeleton/loading state while `decimals` is undefined.
- [ ] No regression in the connected/loaded path: once `decimals` is set, the hook subscribes and renders normally.
- [ ] Vitest covering:
  - `useOrderbook({ assetId: "x" })` (no `decimals`) → empty orders, no socket subscribe.
  - `useOrderbook({ assetId: "x", decimals: 8 })` → orders normalized with `10^8`.
  - Switching from `undefined` to `8` triggers a subscribe.
- [ ] Manual test: throttle network to "slow 3G" in DevTools, navigate to the WBTC (or any non-6-decimal) market, verify the orderbook shows a skeleton until token info loads, never numbers in the wrong magnitude.

# Files to change

- `src/hooks/use-orderbook.ts` (line 45 default + early-return guard)
- `src/hooks/use-recent-trades.ts` (line 42 default + early-return guard)
- `src/components/market/order-book.tsx` — render skeleton while `decimals === undefined`
- Any component currently calling these hooks without `decimals` — verify they thread it through
- `src/hooks/__tests__/use-orderbook.test.ts` and `use-recent-trades.test.ts`

# Suggested patch sketch

```ts
// use-orderbook.ts
export function useOrderbook(options: {
  assetId?: string;
  decimals: number | undefined;   // ← required, but `undefined` allowed
}) {
  const { assetId, decimals } = options;

  const [borrowOrders, setBorrowOrders] = useState<OrderRow[]>([]);
  const [lendOrders, setLendOrders] = useState<OrderRow[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!assetId || decimals === undefined) return;
    // ... existing subscribe + normalize logic, using `decimals` (now guaranteed non-undefined)
  }, [assetId, decimals]);

  return { borrowOrders, lendOrders, isConnected };
}
```

# Out of scope

- The APR units bug (#18) — same family of "untrusted display data" issue, but separately tracked.
- Adding Zod validation to the orderbook / trades event payloads — covered under M-2 / M-3 in the security audit; track as a follow-up.
- Migrating the orderbook to virtualized rendering (referenced in `react-nextjs.md` PERF-C4 but unrelated to this finding).

# Estimated effort

~20 LOC across 2 hooks + 2 component updates + tests. ~1 hour.

# Dependencies

None hard. Plays well with #18 (units fix in the same files) — best landed in the same PR if convenient, since both touch the orderbook/trades render path.

# References

- Audit: `docs/audits/2026-05-08-frontend-review/security.md` (deep-dive Round 8, M-NEW-7)
- Cross-reference: #18 (APR units), #19 (status mapping) — same "fail loud not silent" theme.
