# My Assets — Lend Form Balance Integration

Wires `GET /portfolio/my-assets` into the lend form's "Available Balance" display, replacing hardcoded localStorage prices in API mode.

## Overview

| Mode | Trigger | Balance source |
|------|---------|----------------|
| Mock (default) | `NEXT_PUBLIC_USE_MOCK=true` or unset | localStorage `centuari_portfolio` with price division |
| API | `NEXT_PUBLIC_USE_MOCK=false` | `GET /portfolio/my-assets` via `useMyAssets` hook |

## New Files

| File | Purpose |
|------|---------|
| `src/hooks/use-my-assets.ts` | `useMyAssets` TanStack Query hook — fetches portfolio assets from backend, disabled in mock mode |

## Modified Files

| File | Change |
|------|--------|
| `src/lib/api.ts` | Added `MyAssetItem`, `MyAssetsResponse` types and `getMyAssets(token)` fetch function |
| `src/hooks/use-lend-form.ts` | Imports `useMyAssets`; `getAvailableBalance` branches on `USE_MOCK` — API mode looks up `walletBalance` directly |

## Backend Endpoint

`GET /portfolio/my-assets?limit=100` (requires auth token via `Authorization` header)

### Response shape

The backend `ResponseInterceptor` wraps the controller response:

```
ResponseInterceptor → { statusCode, data: MyAssetsResponse }
apiClient unwraps   → MyAssetsResponse
```

```ts
interface MyAssetsResponse {
  data: MyAssetItem[];
  page: number;
  limit: number;
  totalData: number;
  totalPages: number;
}

interface MyAssetItem {
  symbol: string;         // "USDC"
  name: string;           // "USD Coin"
  walletBalance: number;  // token units (not USD)
  amountInUsd: number;    // walletBalance * live price
  isCollateral: boolean;
  imageUrl: string | null;
}
```

Note: Unlike the orders endpoint, `my-assets` does **not** double-wrap with an inner `{ statusCode, data }` envelope — `apiClient` unwraps once and returns `MyAssetsResponse` directly.

## Data Flow

```
useLendForm()
    │
    ├─ useMyAssets()
    │      │
    │      └─ enabled: !USE_MOCK
    │            │
    │            └─ queryFn: getToken() → GET /portfolio/my-assets?limit=100
    │                                      → MyAssetsResponse.data → MyAssetItem[]
    │
    └─ getAvailableBalance()
           │
           ├─ USE_MOCK=false  → assets.find(a => a.symbol.toLowerCase() === selectedToken.value)
           │                      → match.walletBalance (token units, no conversion needed)
           │                      → 0 if no match
           │
           └─ USE_MOCK=true   → localStorage "centuari_portfolio"
                                  → portfolioValue / tokenInfo.price
                                  → 1000 fallback
```

## `useMyAssets` API

```ts
function useMyAssets(): {
  assets: MyAssetItem[];  // empty array in mock mode or before load
  isLoading: boolean;
  isError: boolean;
};
```

### Query configuration

| Option | Value | Reason |
|--------|-------|--------|
| `queryKey` | `["my-assets"]` | Unique cache key for portfolio assets |
| `staleTime` | `10_000` (10s) | Avoid refetching on every component re-mount |
| `refetchInterval` | `15_000` (15s) | Keep balances reasonably fresh |
| `enabled` | `!USE_MOCK` | Skip network calls entirely in mock mode |

## Balance Lookup

In API mode, the balance lookup is a direct symbol match — no price conversion required:

```ts
// selectedToken.value is lowercase (e.g. "usdc")
// MyAssetItem.symbol is backend-cased (e.g. "USDC")
const match = assets.find(a => a.symbol.toLowerCase() === selectedToken.value);
return match?.walletBalance ?? 0;
```

`walletBalance` is already in **token units** from the backend (e.g. `1000` means 1000 USDC), so no division by price is needed — unlike mock mode which stores USD values and divides by `tokenInfo.price`.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_USE_MOCK` | `true` | Set to `"false"` to fetch real balances from backend |
| `NEXT_PUBLIC_API_URL` | — | Backend-v2 base URL (required when mock is off) |
