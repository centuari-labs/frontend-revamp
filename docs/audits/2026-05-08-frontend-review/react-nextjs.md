# React 19 + Next.js 15 Best-Practices Review

Applies guidance from the `vercel-react-best-practices` and `next-best-practices` skills. Sandbox excluded.

## Executive summary

1. **The app is essentially a Single Page Application bolted onto the App Router.** Every `page.tsx` and almost every layout component declares `"use client"` (152/275 files). The Next 15 RSC model is unused, so static streaming, RSC payloads, and per-route caching are giving zero value.
2. **Heavy crypto libs (Privy, Wagmi, Viem, Socket.io, Recharts, GSAP) ship in the initial JS bundle of every route.** There is not a single `next/dynamic` call. First Contentful Paint pays for all of this on every page.
3. **`useSearchParams` in `app/market/page.tsx` is not wrapped in a Suspense boundary** — Next 15 promotes the entire route to dynamic rendering at the client edge. Combined with the absence of per-route `loading.tsx` and `error.tsx`, this is a real production regression risk.
4. **TanStack Query usage is inconsistent.** Five hooks bypass the centralized `QUERY_KEYS`, no hook uses `select` for derivations, no `useSuspenseQuery` is in play, and `staleTime` is duplicated for the global default in `UserDetailsProvider`.
5. **React 19 idioms are absent.** `forwardRef` is still used in 12 places, `<Context.Provider>` is still the form everywhere, `useActionState`/`useFormStatus`/`useOptimistic` are unused in form-heavy code, and effects are doing work that belongs in event handlers.
6. **The order book — the perf-critical UI — uses array indices as keys**, calls `[...displayBorrow].reverse()` on every WebSocket tick, and animates each row with GSAP per-update. Every price tick from `PriceProvider` re-renders every component subscribed via `useTokenPrices()`.

## Findings table

| Severity | Category | Title | File:line | One-line fix |
|---|---|---|---|---|
| **Critical** | RSC | Every page is `"use client"` — RSC unused | `src/app/**/page.tsx` | Move data fetching to RSC, push `"use client"` into leaf components |
| **Critical** | Bundle | Zero `next/dynamic` usage; Privy/Wagmi/Recharts/GSAP eager | `src/components/provider.tsx`, charts | `dynamic(() => import(...), { ssr: false })` for Privy/charts |
| **Critical** | Next 15 | `useSearchParams` not in Suspense | `src/app/market/page.tsx:18` | Wrap content in `<Suspense>` or use `params` from a dynamic segment |
| **Critical** | Perf | Index keys on live WebSocket order rows | `src/components/market/order-book.tsx:94,99,111` | Key by `${side}-${row.apr}` |
| **High** | TQ | 5 hooks hardcode query keys; bypass `QUERY_KEYS` | `use-market-data.ts:6`, `use-market-detail.ts:24`, `use-deposit-tokens.ts:12`, `use-deposit-balance.ts:12`, `use-rate-history.ts:14` | Add to `QUERY_KEYS`, replace strings |
| **High** | Perf | `PriceProvider` broadcasts whole map on every tick | `src/contexts/price-context.tsx:22-58` | Split context (selector pattern) or use `useSyncExternalStore` per asset |
| **High** | React19 | `forwardRef` no longer needed | `centuari-typography.tsx:65`, `centuari-glass-button.tsx:46`, `lend-main-view.tsx:34`, `borrow-main-view.tsx:50`, `borrow-deposit-view.tsx:15`, `lend-deposit-view.tsx:58`, `ui/checkbox.tsx:37`, `ui/multi-select.tsx:305`, `ui/glass-card.tsx:26` | Accept `ref` as a prop directly |
| **High** | TS | `props: any` on icons + forwardRef generic | `icons/ic-target-centuari.tsx:3`, `icons/ic-lighting-centuari.tsx:3`, `icons/ic-atom-centuari.tsx:2`, `centuari-typography.tsx:66-67` | `React.SVGProps<SVGSVGElement>` |
| **High** | Next 15 | No per-route `loading.tsx`, `error.tsx`, `not-found.tsx` | `src/app/{market,portfolio,faucet,points}` | Add segment files; rely on streaming |
| **High** | Next 15 | No metadata exports on individual pages | `src/app/{market,portfolio,faucet,points}/page.tsx` | Export `metadata` or `generateMetadata` |
| **Medium** | Bundle | Raw `<img>` for above-the-fold logo and token icons | `app/loading.tsx:11`, `loading-screen.tsx:11`, `centuari-navbar.tsx:337`, `lend-deposit-view.tsx:148,164`, `centuari-deposit-dialog.tsx:223,239`, `centuari-withdraw-dialog.tsx`, `centuari-wallet-list.tsx`, `select-chain.tsx`, `network-switcher.tsx`, `access-code-gate.tsx`, `centuari-connect-wallet.tsx`, `app/points/page.tsx`, `ui/multi-select.tsx` | `next/image` |
| **Medium** | Next 15 | `next.config.ts` missing `images.remotePatterns` and `experimental.optimizePackageImports` | `next.config.ts` | Add remotePatterns for `assets.coingecko.com`, optimize `lucide-react` |
| **Medium** | TQ | `staleTime: 10_000` re-specifies global default | `contexts/user-details-context.tsx:44` | Remove |
| **Medium** | Re-render | `useMarketDetail` returns fresh object every render | `hooks/use-market-detail.ts:37-54` | Wrap return in TanStack `select` |
| **Medium** | React19 | `useEffect` syncing form state from props | `use-borrow-form.ts:122-147,167-200`, `use-lend-form.ts:122-147` | Move to lazy initial state or event handler |
| **Medium** | Perf | Order book mounts per-row layout effects with GSAP on every tick | `components/market/order-book.tsx:25-32` | Memo `OrderRowView`; virtualize with `@tanstack/react-virtual` |
| **Medium** | Hook | `centuari-borrow-dialog.tsx` holds business logic + 8 `useState` | `components/centuari-borrow-dialog.tsx:60-152` | Extract `useBorrowDialog()` |
| **Medium** | Hook | Three dialog components > 300 lines | `centuari-withdraw-dialog.tsx` (510), `centuari-lend-dialog.tsx` (421), `centuari-deposit-dialog.tsx` (390), `centuari-borrow-dialog.tsx` (348) | Decompose |
| **Low** | Route | Proxy route handler has no `runtime`/`dynamic` mode | `src/app/api/[...path]/route.ts:24` | `export const runtime = 'nodejs'; export const dynamic = 'force-dynamic'` |
| **Low** | Form | RHF said to be the form library, but borrow dialog uses raw inputs | `centuari-borrow-dialog.tsx` | Use `useForm` per CLAUDE.md form rules |

## Detailed findings

### CRITICAL: RSC Boundaries Unused

`src/app/layout.tsx` is a server component, but every route segment underneath it (`page.tsx` for `/`, `/market`, `/portfolio`, `/faucet`, `/points`, `/portfolio/transaction-history`) starts with `"use client"`. There are no Server Components in the routing tree. There are no Server Actions (`grep -rn "use server"` returns nothing).

**Why it matters.** The whole point of the App Router is to do data fetching on the server, send a streamed RSC payload, and only ship interactivity in client islands. Putting the page-level component in a client component negates this and keeps the entire React tree on the client. Initial JS is bigger, TTFB shows nothing, every fetch happens after hydration.

**Concrete fix.** Pages that just compose data (`app/page.tsx`, `app/portfolio/page.tsx`, `app/market/page.tsx`) should be server components that:

- Read public market data via a server-side fetch (you already proxy through `/api/[...path]`).
- Render a server `<Suspense>` boundary with a streaming skeleton.
- Mount thin client islands (`<TokenGrid client>`, `<OrderBookCard client>`) only where interactivity / hooks live.

For `app/page.tsx`, the body is `<HomeHeader /> + <TokenGrid />` — both can be RSC if `useMarketData()` is replaced with a server fetch + Suspense.

### CRITICAL: No `next/dynamic`, Heavy Bundle Eager

`grep -rn "dynamic(\|next/dynamic"` returns 0 hits. Yet `provider.tsx` synchronously imports `@privy-io/react-auth` (large), `@privy-io/wagmi`, `wagmi`, plus `Toaster` from sonner. Chart components import `recharts` (~100KB gz). GSAP is imported in 6 files including the navbar.

**Why it matters.** The home page (`/`) does not need Privy until the user clicks "login". It does not need Wagmi/Viem until they connect a wallet. It does not need Recharts until they navigate to portfolio. Every byte of those is shipped on first paint.

**Concrete fix.**

```tsx
// provider.tsx
const PrivyProvider = dynamic(
  () => import("@privy-io/react-auth").then(m => m.PrivyProvider),
  { ssr: false }
);
```

For per-page heavy charts:

```tsx
// portfolio/page.tsx
const PortfolioChart = dynamic(() => import("@/components/portfolio/portfolio-chart").then(m => m.PortfolioChart), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});
```

Similarly `LendBorrowChart`, `APRHistoryCard`, `OrderBookCard` (drops `gsap` from initial bundle).

### CRITICAL: `useSearchParams` Without Suspense

`src/app/market/page.tsx:18` calls `useSearchParams()` directly inside the page body. There is no `<Suspense>` ancestor.

**Why it matters.** Next 15: hooks like `useSearchParams` opt the route out of static rendering AND require a Suspense boundary above them — otherwise CSR-bailout warnings/errors and the entire page won't pre-render.

**Concrete fix.**

```tsx
export default function MarketPage() {
  return (
    <Suspense fallback={<MarketPageSkeleton />}>
      <MarketPageContent />
    </Suspense>
  );
}

function MarketPageContent() {
  const searchParams = useSearchParams();
  // ...
}
```

Better: convert to a dynamic segment `app/market/[asset]/page.tsx` and read `params` (async in 15) on the server.

### CRITICAL: Order Book Index Keys + Reverse on Every Tick

`src/components/market/order-book.tsx:94,99,111` use `key={i}`. Line 174 does `[...displayBorrow].reverse()` on every render. Each `OrderRowView` mounts a `useLayoutEffect` with `gsap.to(...)` (lines 25-32) that runs whenever `widthPct` changes (every WebSocket tick).

**Why it matters.** With index keys, when an order is removed at the top, React reuses the wrong DOM nodes — every row gets a new `widthPct`, every row's GSAP tween re-fires. Combined with the `.reverse()` on each tick, this is the worst case: stable reference shape but unstable identity. Order book is the highest-frequency UI in the app.

**Concrete fix.**

```tsx
{orders.map((row) => (
  <OrderRowView
    key={`${side}-${row.apr}`}
    order={row}
    maxAmount={sideMaxAmount}
  />
))}
```

Memoize: `const OrderRowView = React.memo(function OrderRowView({...}) { ... });` so unchanged rows skip the GSAP tween. Compute `displayBorrow` already-reversed in the hook. For 20+ rows consider `@tanstack/react-virtual`.

### HIGH: Centralized `QUERY_KEYS` Bypassed

- `use-market-data.ts:6` → `["market"]`
- `use-market-detail.ts:24` → `["market-detail", assetId]`
- `use-deposit-tokens.ts:12` → `["deposit-tokens"]`
- `use-deposit-balance.ts:12` → `["deposit-balance", assetId]`
- `use-rate-history.ts:14` → `["rate-history", assetId]`
- `use-open-orders.ts:40`, `use-order-history.ts:40`, `use-transaction-history.ts:37` (additional via convention review)

CLAUDE.md Data Fetching Rule #3: "all query keys defined in `lib/query-keys.ts`. Use `QUERY_KEYS.*` constants — never hardcode key arrays."

### HIGH: Price Context Re-renders Everything on Every Tick

`src/contexts/price-context.tsx:22-58` keeps a single `prices: Record<string, number>` in `useState`. On every Socket.IO `prices-update` event, the whole map is replaced and the memoized context value gets a new identity. Every consumer of `useTokenPrice(assetId)` re-renders, even if their specific asset price didn't change.

`useTokenPrice` consumers include `centuari-borrow-dialog.tsx:67`, `use-borrow-form.ts:57` — heavy components.

**Concrete fix.**

```ts
const priceStoreRef = useRef(createPriceStore());
useEffect(() => {
  const socket = acquireSocket();
  socket.on("prices-update", priceStoreRef.current.set);
  // ...
}, []);

export function useTokenPrice(assetId: string) {
  return useSyncExternalStore(
    priceStoreRef.current.subscribe(assetId),
    () => priceStoreRef.current.get(assetId),
    () => undefined,
  );
}
```

### HIGH: `forwardRef` in React 19

12 components still wrap in `forwardRef`. React 19 accepts `ref` as a regular prop on function components.

```tsx
export interface CentuariGlassButtonProps extends React.ComponentProps<"button">, VariantProps<typeof glassButtonVariants> {
  asChild?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
}

export function CentuariGlassButton({ ref, className, size, shape, asChild = false, children, ...props }: CentuariGlassButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp ref={ref} ... />
}
```

### HIGH: `any` and Untyped SVG Icons

- `src/components/icons/ic-target-centuari.tsx:3`: `(props: any)` — same in `ic-lighting-centuari.tsx`, `ic-atom-centuari.tsx`.
- `src/components/centuari-typography.tsx:66-67`: `React.forwardRef<any, CentuariProps<any>>` — defeats polymorphic typing entirely.
- `src/components/centuari-chart.tsx:40,63`: `payload?: any[]`, `payload?: any` — recharts has typed payloads.

### HIGH: Missing per-route `loading.tsx` / `error.tsx` / `not-found.tsx` and metadata

Only the root `app/error.tsx`, `app/loading.tsx`, `app/not-found.tsx` exist. The market/portfolio routes hand-roll skeletons inside the page (`app/portfolio/page.tsx:165`), so the route can't stream a skeleton until React boots on the client.

Only `app/layout.tsx` exports `metadata`. None of the pages do.

```tsx
// app/market/loading.tsx
export default function Loading() { return <MarketPageSkeleton />; }

// app/market/error.tsx
"use client";
export default function Error({ error, reset }: ...) { /* ... */ }

// app/market/page.tsx
export const metadata = {
  title: "Market | Centuari",
  description: `Lend or borrow ${symbol} on Centuari.`,
};
```

For dynamic markets, use `generateMetadata({ params })` (in Next 15, `params` is `Promise<...>` — must be awaited).

### MEDIUM: `<img>` Instead of `next/image`

13+ raw `<img>` tags including the loading screen logo (LCP candidate), navbar logo, dialog token icons, and remote `https://assets.coingecko.com/...` URLs.

```ts
// next.config.ts
images: {
  formats: ["image/avif", "image/webp"],
  remotePatterns: [{ protocol: "https", hostname: "assets.coingecko.com" }],
}
```

Replace `<img src="/centuari-logo.png" />` with `<Image src="/centuari-logo.png" priority width={64} height={64} alt="..."/>`.

### MEDIUM: `useMarketDetail` Returns Fresh Object Every Render

`src/hooks/use-market-detail.ts:37-54` builds a brand-new `upcomingMaturities` array on every render. Consumers do `useMemo(() => upcomingMaturities.map(m => m.maturity), [upcomingMaturities])` but the dep is unstable, so the memo never hits.

```ts
return useQuery({
  queryKey: [QUERY_KEYS.MARKET_DETAIL, assetId],
  queryFn: () => getMarketDetail(assetId!),
  enabled: Boolean(assetId),
  select: useCallback((data) => ({
    assetId: data.asset.id,
    symbol: data.asset.symbol,
    upcomingMaturities: data.upcoming_maturities.map(...),
  }), []),
});
```

Same antipattern in `use-market-data.ts:11-19`.

### MEDIUM: Effects That Should Be Event Handlers

`src/hooks/use-borrow-form.ts:122-147` and `use-lend-form.ts:122-147` use `useEffect(..., [editingPosition, tokenList])` to populate form fields when an `editingPosition` prop changes. The eslint-disable on line 146/164 papers over the fact that the effect mutates internal hook state derived from props.

`use-borrow-form.ts:167-200` is even worse: auto-selects collateral when portfolio data loads, with `editingPosition` excluded from deps via eslint-disable.

```ts
const [limitMaturity, setLimitMaturity] = useState(() =>
  editingPosition?.orderType === "limit"
    ? normalizeMaturity(editingPosition.maturity)
    : defaultMaturity,
);
```

### MEDIUM: Dialog Components Exceed CLAUDE.md 300-Line Cap

`centuari-withdraw-dialog.tsx` 510, `centuari-lend-dialog.tsx` 421, `centuari-deposit-dialog.tsx` 390, `centuari-borrow-dialog.tsx` 348. (Conventions review found 7 total — see `conventions.md` for the full list.)

`centuari-borrow-dialog.tsx:60-152` contains business calc (weightedLTV, healthFactor, healthFactorPercentage) inline — explicitly forbidden by hook rule #2.

### MEDIUM: Proxy Route Caching/Runtime

`src/app/api/[...path]/route.ts` — no `runtime`, no `dynamic`. No `Cache-Control: no-store` is set on the response.

```ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
```

## What's done well

1. **API client and query-keys infrastructure are solid.** `lib/api-client.ts` returns the `data` field from the `{statusCode, data}` envelope, throws a typed `AuthError` for 401s, and `lib/query-keys.ts:invalidateUserQueries` centralizes mutation invalidation.
2. **Socket lifecycle management is non-trivially correct.** `lib/socket.ts` ref-counts the singleton and uses a 1s release timer to survive React Strict Mode double-mounts.
3. **Provider stack composition is clean.** `provider.tsx` nests `PrivyProvider → QueryClient → Wagmi → Access → EmbeddedWallet → Price → UserDetails` in the right order.
4. **CSP header configuration in `next.config.ts:3-15`** is comprehensive and uses a `headers()` callback rather than middleware.
5. **Strict TypeScript mostly holds.** Outside of three icon files and the `centuari-typography` polymorphism trick, `any` does not creep through the codebase.

## Quick wins (≤30 min each)

1. **Fix order book keys** — `key={\`${side}-${row.apr}\`}` in `order-book.tsx:94,99` (10 min).
2. **Remove redundant `staleTime`** — delete line 44 of `user-details-context.tsx` (1 min).
3. **Replace `props: any` on icons** — three files, `React.SVGProps<SVGSVGElement>` (5 min).
4. **Add `priority` + `next/image` to the loading-screen logo** — `app/loading.tsx:11` (5 min).
5. **Add `runtime` + `dynamic` to proxy route** — `app/api/[...path]/route.ts` (2 min).
6. **Wrap `useSearchParams` in Suspense** — `app/market/page.tsx` (10 min).
7. **Move five hardcoded queryKeys into `QUERY_KEYS`** — `query-keys.ts` + 5 hook files (15 min).
8. **Add `app/market/loading.tsx`** — re-export `MarketPageSkeleton` (5 min).
9. **Remove all three `eslint-disable react-hooks/exhaustive-deps`** — fix the underlying derived-state-via-effect smell (20 min).
