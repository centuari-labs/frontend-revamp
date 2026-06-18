---
title: "feat: Lend Limit Order Frontend API Integration"
type: feat
status: completed
date: 2026-02-25
---

# feat: Lend Limit Order Frontend API Integration

## Overview

Connect the frontend lend limit order flow to the real backend API (`POST /orders/lend/limit`) when `USE_MOCK=false`. The frontend currently only saves to localStorage via the mock adapter. This feature adds a real API adapter that converts frontend types to backend DTO format, calls the REST API with Privy JWT auth, and normalizes the response back to the existing `LendPosition` type.

Follows the established `USE_MOCK` branching pattern already used by `use-orderbook.ts` and `use-recent-trades.ts`.

## Problem Statement / Motivation

The frontend demo mode works via localStorage, but there is no path to real backend integration for lend limit orders. Users cannot place actual limit orders that enter the matching engine. This is the first order type being wired up end-to-end, establishing the pattern for all other order types (lend market, borrow limit, borrow market).

## Proposed Solution

1. Fix the `MarketItem` type to include the `market` field the backend already returns
2. Add `createLendLimitOrder()` typed endpoint to `lib/api.ts`
3. Create `positions-adapter.api.ts` with all type conversions (APR decimal → basis points, token slug → asset UUID, maturity → market UUID)
4. Modify `use-submit-lend.ts` to branch on `USE_MOCK`
5. Wire auth token from Privy through the hook chain
6. Add `autoRollover` to `SubmitLendLimitParams`
7. Add comprehensive tests for the API adapter and API-mode submit flow

## Technical Approach

### Pre-requisites

#### Fix `next.config.ts` API Proxy

The `apiClient` uses `/api` as base URL but no proxy rewrite exists. Add:

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/:path*`,
      },
    ];
  },
};
```

#### Fix `MarketItem` Type (Critical Blocker)

The frontend `MarketItem` interface is missing the `market` field the backend returns. Update `src/lib/api.ts`:

```typescript
export interface MarketItem {
  asset: MarketAsset;
  market: {
    market_id: string | null;
    maturity: number | null; // Unix seconds
  };
  borrow_rate: number;
  lend_rate: number;
  collateral_factor: number;
}
```

### Key Conversions (in `positions-adapter.api.ts`)

| Field | Frontend | Backend DTO | Conversion |
|-------|----------|-------------|------------|
| Token | `tokenValue: "usdc"` | `assetId: UUID` | Lookup `markets.find(m => m.asset.symbol.toLowerCase() === tokenValue).asset.id` |
| Amount | `amount: 1000` (number) | `amount: "1000"` (string) | `String(amount)` |
| Rate | `targetApr: 0.065` (decimal) | `rate: 650` (basis points int) | `Math.round(apr * 10000)` |
| Maturity | `maturity: 1735689600000` (ms) | `marketIds: [UUID]` | Lookup `markets.find(m => m.market.maturity === maturity / 1000).market.market_id` |
| Auto-rollover | `autoRollover: true` | `autoRollover: true` | Pass-through |

### Response Normalization (OrderResponseData → LendPosition)

| Backend | Frontend | Mapping |
|---------|----------|---------|
| `orderId` | `id` | Direct |
| `assetId` | `tokenValue` | Reverse lookup: UUID → symbol via market data |
| `originalAmount` | `amount` | `parseFloat(originalAmount)` — token units, not USD |
| `rate` (percentage 5.0) | `apr` (decimal 0.05) | `rate / 100` |
| `markets[0].maturity` (Unix s) | `maturity` (ms) | `* 1000` |
| `status` ("OPEN") | `status` ("pending") | Enum map: OPEN→pending, FILLED→success, CANCELLED→failed |
| `createdAt` | `createdAt` | `formatDate(new Date(createdAt))` |
| — | `assetImg` | Lookup token logo from token slug |
| — | `assetName` | Lookup token label from token slug |
| — | `orderType` | Hardcoded `"limit"` |

### Auth Token Flow

Pattern from existing `use-sync-account.ts`: `usePrivy().getAccessToken()` at the hook level.

```
useLendForm (component-level)
  → calls usePrivy().getAccessToken() inside handleLimitSubmit
  → passes token to submitLimit(params, token)
    → positions-adapter.api.submitLendLimitOrder(dto, token)
      → apiClient("/orders/lend/limit", { method: "POST", body, token })
```

This requires:
1. `useLendForm` receives `getAccessToken` from `usePrivy()` (new hook dependency, or passed as param)
2. `useSubmitLend.submitLimit()` gains a second `token?: string` parameter
3. In mock mode, the token is ignored

### Edit Flow (API Mode)

Backend has no `PATCH /orders/:id` endpoint. For this iteration, **edit in API mode is not supported**. When `USE_MOCK=false` and `editingPosition` is set, the API adapter will:
1. Cancel the existing order via `PATCH /orders/:id/cancel`
2. Create a new order with the updated params

If cancel endpoint is not yet available, editing will fall back to mock behavior with a console warning.

## Files to Create/Modify

### New Files

#### `src/lib/positions-adapter.api.ts`

Real API adapter with all type conversions. Key exports:

```typescript
export async function submitLendLimitOrder(
  params: SubmitLendLimitParams & { autoRollover: boolean },
  markets: MarketItem[],
  token: string,
): Promise<LendPosition>;
```

- Resolves `tokenValue` → `assetId` using markets array
- Resolves `maturity` → `marketIds` using markets array
- Converts `targetApr` → basis points with `Math.round()`
- Converts `amount` → string
- Calls `createLendLimitOrder()` from `lib/api.ts`
- Normalizes `OrderResponseData` → `LendPosition`

#### `src/lib/__tests__/positions-adapter.api.test.ts`

Tests for the API adapter (~15 tests):

- `submitLendLimitOrder` happy path — verifies DTO conversion
- Asset ID resolution — correct UUID from token slug
- Market ID resolution — correct UUID from maturity timestamp
- Rate conversion — decimal to basis points with `Math.round()`
- Amount conversion — number to string
- Response normalization — all fields mapped correctly
- Unknown token slug — throws descriptive error
- Unknown maturity — throws descriptive error
- Auth token passed to apiClient
- `autoRollover` included in DTO

#### `src/hooks/__tests__/use-submit-lend.api.test.ts`

Tests for API-mode submit flow (~8 tests):

- Mock mode — calls mock adapter
- API mode — calls API adapter with correct params
- API mode — passes auth token
- API mode — returns normalized LendPosition
- API mode — isPending states during submission
- API mode — error propagation from apiClient
- API mode edit — cancel-and-replace flow
- API mode edit — fallback when cancel not available

### Modified Files

#### `src/lib/api.ts`

1. Update `MarketItem` interface to include `market` field
2. Add `createLendLimitOrder()` endpoint:

```typescript
export interface CreateLendLimitOrderDto {
  assetId: string;
  amount: string;
  marketIds: string[];
  rate: number;
  autoRollover?: boolean;
}

export interface OrderResponseData {
  orderId: string;
  walletAddress: string;
  assetId: string;
  markets: { marketId: string; maturity: number }[];
  status: string;
  originalAmount: string;
  rate: number;
  autoRollover: boolean;
  createdAt: string;
}

export function createLendLimitOrder(
  dto: CreateLendLimitOrderDto,
  token: string,
): Promise<OrderResponseData> {
  return apiClient<OrderResponseData>("/orders/lend/limit", {
    method: "POST",
    body: dto,
    token,
  });
}
```

#### `src/types/positions.ts`

Add `autoRollover` to `SubmitLendLimitParams`:

```typescript
export interface SubmitLendLimitParams {
  tokenValue: string;
  tokenLogo: string;
  tokenLabel: string;
  amount: number;
  amountInUsd: number;
  targetApr: number;
  maturity: number;
  autoRollover: boolean;        // NEW
  editingPosition?: LendPosition;
}
```

#### `src/hooks/use-submit-lend.ts`

Branch on `USE_MOCK`:

```typescript
import { USE_MOCK } from "@/lib/use-mock";
import * as mockAdapter from "@/lib/positions-adapter.mock";
import * as apiAdapter from "@/lib/positions-adapter.api";
import type { MarketItem } from "@/lib/api";

export function useSubmitLend() {
  const [isPending, setIsPending] = useState(false);

  const submitLimit = useCallback(
    async (
      params: SubmitLendLimitParams,
      options?: { token?: string; markets?: MarketItem[] },
    ) => {
      setIsPending(true);
      try {
        if (USE_MOCK) {
          // existing mock path
          const position = mockAdapter.buildLendLimitPosition(params);
          if (params.editingPosition) {
            await mockAdapter.updateOpenOrder(position);
            return position;
          }
          return (await mockAdapter.submitOpenOrder(position)) as LendPosition;
        }

        // API path
        const { token, markets } = options ?? {};
        if (!token || !markets) throw new Error("Auth token and market data required");
        return await apiAdapter.submitLendLimitOrder(params, markets, token);
      } finally {
        setIsPending(false);
      }
    },
    [],
  );
  // ... submitMarket unchanged
}
```

#### `src/hooks/use-lend-form.ts`

1. Import `usePrivy` for auth token acquisition
2. Import `useMarketData` for ID resolution context
3. Pass `autoRollover` to `submitLimit`
4. Pass `token` and `markets` in API mode

Key change in `handleLimitSubmit`:

```typescript
const { getAccessToken } = usePrivy();
const { markets } = useMarketData();

// Inside handleLimitSubmit:
const token = USE_MOCK ? undefined : await getAccessToken();
const result = await submitLimit(
  { ...params, autoRollover },
  USE_MOCK ? undefined : { token: token!, markets },
);
```

#### `next.config.ts`

Add API proxy rewrites for backend connection.

## Acceptance Criteria

### Functional Requirements

- [x] `MarketItem` type includes `market.market_id` and `market.maturity` fields
- [x] `createLendLimitOrder()` typed endpoint exists in `lib/api.ts`
- [x] `positions-adapter.api.ts` converts all fields correctly (rate, amount, IDs)
- [x] `Math.round()` applied to basis points conversion (handles floating-point)
- [x] Auth token acquired via Privy and passed through to API call
- [x] `autoRollover` wired from form state through to backend DTO
- [x] Mock mode (`USE_MOCK=true`) continues to work identically
- [x] API mode (`USE_MOCK=false`) posts to `POST /orders/lend/limit`
- [x] Response normalized from `OrderResponseData` to `LendPosition`
- [x] `next.config.ts` has proxy rewrites for `/api/*`
- [ ] Edit flow handles API mode gracefully (cancel-and-replace or warning)

### Testing Requirements

- [x] `positions-adapter.api.test.ts` — ~15 tests covering conversions, lookups, error cases
- [x] `use-submit-lend.api.test.ts` — ~8 tests covering mock/API branching, auth flow
- [x] All existing 291 tests still pass
- [x] `pnpm build` compiles clean

## Dependencies & Risks

### Dependencies

- Backend `POST /orders/lend/limit` endpoint must be deployed and accessible
- Backend `/market` endpoint must return `market.market_id` field (confirmed it does)
- Privy auth must be configured with correct app ID for the environment

### Risks

| Risk | Mitigation |
|------|------------|
| Backend `/market` returns only earliest maturity per asset | For V1, support only the earliest maturity. File follow-up for multi-maturity support via new endpoint |
| Double-wrapped response envelope | Test actual response shape before writing adapter; add defensive unwrapping |
| `getAvailableBalance()` uses mock data in API mode | Out of scope — file follow-up ticket for real balance integration |
| Success dialog says "lent" for unfilled limit orders | Out of scope for this PR — file follow-up for copy fix |
| No user-facing error messages on API failure | Out of scope for this PR, but note: `apiClient` throws generic errors. Follow-up to parse validation messages and show toasts |

### Scope Boundaries (Explicitly Out)

- Real balance fetching (still uses localStorage in API mode)
- Backend validation error message parsing and user-facing display
- Success dialog copy for limit vs market orders
- TanStack Query cache invalidation after order submission
- Multi-maturity market selection (only earliest maturity supported)

## Implementation Order

1. **`next.config.ts`** — Add API proxy rewrites
2. **`src/lib/api.ts`** — Fix `MarketItem` type, add `createLendLimitOrder()` and response types
3. **`src/types/positions.ts`** — Add `autoRollover` to `SubmitLendLimitParams`
4. **`src/lib/positions-adapter.api.ts`** — Create real API adapter with all conversions
5. **`src/hooks/use-submit-lend.ts`** — Add `USE_MOCK` branching
6. **`src/hooks/use-lend-form.ts`** — Wire `usePrivy`, `useMarketData`, `autoRollover`
7. **`src/lib/__tests__/positions-adapter.api.test.ts`** — API adapter tests
8. **`src/hooks/__tests__/use-submit-lend.api.test.ts`** — Hook integration tests
9. **Verify** — All 291+ tests pass, build compiles clean

## References

### Internal References

- Brainstorm: `docs/brainstorms/2026-02-25-lend-limit-api-integration-brainstorm.md`
- USE_MOCK pattern: `src/hooks/use-orderbook.ts:144-151` (mock branch) and `:154-197` (WS branch)
- Auth pattern: `src/hooks/use-sync-account.ts:25` (`getAccessToken()` usage)
- API client: `src/lib/api-client.ts` (fetch wrapper with envelope unwrap)
- Mock adapter: `src/lib/positions-adapter.mock.ts` (localStorage adapter)
- Backend DTO: `backend-v2/src/orders/dto/create-lend-limit-order.dto.ts`
- Backend response: `backend-v2/src/orders/dto/order-response.dto.ts`
- Backend market service: `backend-v2/src/market/market.service.ts:72-96` (market field construction)
