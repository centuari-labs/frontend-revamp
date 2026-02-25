---
title: "feat: Wire Lend Market, Borrow Limit, Borrow Market Orders to Backend API"
type: feat
status: completed
date: 2026-02-25
---

# Wire Remaining Order Types to Backend API

## Overview

Three of the four order types (lend market, borrow limit, borrow market) are mock-only on the frontend while the backend already serves all four endpoints. This plan wires them up following the lend limit order as the reference pattern, and adds comprehensive tests.

## Problem Statement

The lend limit order is the only order type with full frontend→backend API integration. The other three silently ignore `USE_MOCK=false` and always use localStorage mock data. Users in API mode cannot place lend market, borrow limit, or borrow market orders.

## Proposed Solution

Replicate the lend limit pattern across the remaining three order types:

```
Form hook → getToken() → Submit hook (USE_MOCK branch) → API adapter → api.ts → POST /orders/...
```

## Technical Approach

### Backend Endpoints (already implemented — no changes needed)

| Endpoint | DTO Fields | Notes |
|----------|-----------|-------|
| `POST /orders/lend/limit` | `assetId, amount, marketIds, rate, autoRollover?` | Reference — already wired |
| `POST /orders/lend/market` | `assetId, amount, marketIds, autoRollover?` | No `rate` field |
| `POST /orders/borrow/limit` | `assetId, amount, marketIds, rate, autoRollover?` | Same as lend limit DTO |
| `POST /orders/borrow/market` | `assetId, amount, marketIds, autoRollover?` | No `rate` field |

All endpoints return the same `OrderResponse` envelope: `{ statusCode, data: OrderResponseData }`.

The frontend `OrderResponseData` in `api.ts` is missing `side`, `type`, `timestamp` fields that the backend returns — we should add them.

### Implementation Phases

#### Phase 1: API Layer (`src/lib/api.ts`)

Add three new API functions + update the shared response type.

**1a. Update `OrderResponseData` interface** to match backend:

```ts
// src/lib/api.ts — add missing fields
export interface OrderResponseData {
  orderId: string;
  walletAddress: string;
  assetId: string;
  markets: { marketId: string; maturity: number }[];
  timestamp: number;        // ← NEW
  side: string;             // ← NEW ("LEND" | "BORROW")
  type: string;             // ← NEW ("MARKET" | "LIMIT")
  status: string;
  originalAmount: string;
  settlementFeeAmount: string;
  rate: number;
  autoRollover: boolean;
  createdAt: string;
  updatedAt: string;
}
```

**1b. Add DTO types + API functions:**

```ts
// src/lib/api.ts

// Lend Market — same as lend limit but no `rate`
export interface CreateLendMarketOrderDto {
  assetId: string;
  amount: string;
  marketIds: string[];
  autoRollover?: boolean;
}

// Borrow Limit — same fields as lend limit
export interface CreateBorrowLimitOrderDto {
  assetId: string;
  amount: string;
  marketIds: string[];
  rate: number;
  autoRollover?: boolean;
}

// Borrow Market — same as lend market
export interface CreateBorrowMarketOrderDto {
  assetId: string;
  amount: string;
  marketIds: string[];
  autoRollover?: boolean;
}

export async function createLendMarketOrder(
  dto: CreateLendMarketOrderDto, token: string
): Promise<OrderResponseData> {
  const envelope = await apiClient<OrderEnvelope>("/orders/lend/market", {
    method: "POST", body: dto, token,
  });
  return envelope.data;
}

export async function createBorrowLimitOrder(
  dto: CreateBorrowLimitOrderDto, token: string
): Promise<OrderResponseData> {
  const envelope = await apiClient<OrderEnvelope>("/orders/borrow/limit", {
    method: "POST", body: dto, token,
  });
  return envelope.data;
}

export async function createBorrowMarketOrder(
  dto: CreateBorrowMarketOrderDto, token: string
): Promise<OrderResponseData> {
  const envelope = await apiClient<OrderEnvelope>("/orders/borrow/market", {
    method: "POST", body: dto, token,
  });
  return envelope.data;
}
```

**Files:** `src/lib/api.ts`

---

#### Phase 2: API Adapter (`src/lib/positions-adapter.api.ts`)

Add three submit functions + a borrow normalizer. Parameterize the lend normalizer for market orders.

**2a. Update `normalizeOrderToLendPosition` to accept `orderType`:**

Current code hard-codes `orderType: "limit"`. Change to:

```ts
export function normalizeOrderToLendPosition(
  order: OrderResponseData,
  markets: MarketItem[],
  orderType: OrderType = "limit",  // ← new param
): LendPosition {
  // ... existing logic ...
  return {
    // ... existing fields ...
    orderType,  // ← was hardcoded "limit"
  };
}
```

**2b. Add `normalizeOrderToBorrowPosition`:**

```ts
export function normalizeOrderToBorrowPosition(
  order: OrderResponseData,
  markets: MarketItem[],
  orderType: OrderType = "limit",
): BorrowPosition {
  const marketItem = markets.find(
    (m) => m.asset.id.toLowerCase() === order.assetId.toLowerCase(),
  );
  const tokenValue = marketItem?.asset.symbol.toLowerCase() ?? "unknown";
  const tokenLabel = marketItem?.asset.symbol ?? "UNKNOWN";
  const maturitySec = order.markets[0]?.maturity ?? 0;

  return {
    id: order.orderId,
    assetImg: getTokenLogo(tokenValue),
    assetName: tokenLabel,
    amount: Number.parseFloat(order.originalAmount),
    apr: order.rate / 100,
    type: "borrow",
    tokenValue,
    tokenSymbol: tokenLabel,
    maturity: maturitySec * 1000,
    status: mapStatus(order.status),
    createdAt: formatDate(new Date(order.createdAt)),
    timestamp: Date.now(),
    collateralTokens: [],  // backend doesn't return this in OrderResponse
    orderType,
  };
}
```

> **Note on `collateralTokens`:** The backend `OrderResponseData` does not include collateral information. For now we set `collateralTokens: []`. This is consistent with the backend's role — collateral is tracked separately via the portfolio/positions endpoints. If needed later, the field can be populated from a separate API call.

**2c. Add three submit functions:**

```ts
// Lend Market
export async function submitLendMarketOrder(
  params: SubmitLendMarketParams,
  markets: MarketItem[],
  token: string,
): Promise<LendPosition> {
  const { assetId, marketId } = resolveMarketForAsset(params.tokenValue, markets);
  const dto = {
    assetId,
    amount: String(params.amount),
    marketIds: [marketId],
  };
  const response = await createLendMarketOrder(dto, token);
  return normalizeOrderToLendPosition(response, markets, "market");
}

// Borrow Limit
export async function submitBorrowLimitOrder(
  params: SubmitBorrowLimitParams,
  markets: MarketItem[],
  token: string,
): Promise<BorrowPosition> {
  const { assetId, marketId } = resolveMarketForAsset(params.tokenValue, markets);
  const dto = {
    assetId,
    amount: String(params.amount),
    marketIds: [marketId],
    rate: aprToBasisPoints(params.targetApr),
  };
  const response = await createBorrowLimitOrder(dto, token);
  return normalizeOrderToBorrowPosition(response, markets, "limit");
}

// Borrow Market
export async function submitBorrowMarketOrder(
  params: SubmitBorrowMarketParams,
  markets: MarketItem[],
  token: string,
): Promise<BorrowPosition> {
  const { assetId, marketId } = resolveMarketForAsset(params.tokenValue, markets);
  const dto = {
    assetId,
    amount: String(params.amount),
    marketIds: [marketId],
  };
  const response = await createBorrowMarketOrder(dto, token);
  return normalizeOrderToBorrowPosition(response, markets, "market");
}
```

**Files:** `src/lib/positions-adapter.api.ts`

**New imports needed:**
- From `api.ts`: `createLendMarketOrder`, `createBorrowLimitOrder`, `createBorrowMarketOrder`
- From `types/positions`: `BorrowPosition`, `SubmitLendMarketParams`, `SubmitBorrowLimitParams`, `SubmitBorrowMarketParams`, `OrderType`

---

#### Phase 3: Submit Hooks

**3a. `src/hooks/use-submit-lend.ts` — Wire `submitMarket` to API:**

```ts
// Change submitMarket signature to accept options
const submitMarket = useCallback(
  async (params: SubmitLendMarketParams, options?: SubmitLimitOptions) => {
    setIsPending(true);
    try {
      if (USE_MOCK) {
        // existing mock logic unchanged
        const position = buildLendMarketPosition(params);
        if (params.editingPosition) {
          await updateFilledPosition(position);
          return position;
        }
        const result = await submitFilledLendPosition(position, {
          amountInUsd: params.amountInUsd,
          tokenValue: params.tokenValue,
        });
        return result;
      }

      // API mode
      const { token, markets } = options ?? {};
      if (!token || !markets) {
        throw new Error("Auth token and market data required for API mode");
      }
      return await submitLendMarketOrder(params, markets, token);
    } finally {
      setIsPending(false);
    }
  },
  [],
);
```

Add import: `submitLendMarketOrder` from `positions-adapter.api`.

**3b. `src/hooks/use-submit-borrow.ts` — Wire both functions to API:**

Add `USE_MOCK` import, API adapter imports, `SubmitLimitOptions`-style interface, and branch both functions:

```ts
import { USE_MOCK } from "@/lib/use-mock";
import {
  submitBorrowLimitOrder,
  submitBorrowMarketOrder,
} from "@/lib/positions-adapter.api";
import type { MarketItem } from "@/lib/api";

export interface SubmitBorrowOptions {
  token?: string;
  markets?: MarketItem[];
}

// submitLimit
const submitLimit = useCallback(
  async (params: SubmitBorrowLimitParams, options?: SubmitBorrowOptions) => {
    setIsPending(true);
    try {
      if (USE_MOCK) {
        // existing mock logic unchanged
        ...
      }
      const { token, markets } = options ?? {};
      if (!token || !markets) {
        throw new Error("Auth token and market data required for API mode");
      }
      return await submitBorrowLimitOrder(params, markets, token);
    } finally {
      setIsPending(false);
    }
  },
  [],
);

// submitMarket — same pattern
const submitMarket = useCallback(
  async (params: SubmitBorrowMarketParams, options?: SubmitBorrowOptions) => {
    setIsPending(true);
    try {
      if (USE_MOCK) {
        // existing mock logic unchanged
        ...
      }
      const { token, markets } = options ?? {};
      if (!token || !markets) {
        throw new Error("Auth token and market data required for API mode");
      }
      return await submitBorrowMarketOrder(params, markets, token);
    } finally {
      setIsPending(false);
    }
  },
  [],
);
```

**Files:** `src/hooks/use-submit-lend.ts`, `src/hooks/use-submit-borrow.ts`

---

#### Phase 4: Form Hooks

**4a. `src/hooks/use-lend-form.ts` — Wire `handleMarketSubmit` to API:**

The `handleLimitSubmit` already does `getToken()` and passes `{ token, markets }`. Do the same for `handleMarketSubmit`:

```ts
const handleMarketSubmit = useCallback(
  async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(marketAmountInput.amount) || 0;
    if (numericAmount <= 0 || isPending) return;

    const tokenInfo = getTokenInfo(selectedToken.value);
    if (!tokenInfo) return;

    try {
      const amountInUsd = numericAmount * tokenInfo.price;

      const token = USE_MOCK ? undefined : await getToken();
      const result = await submitMarket(
        {
          tokenValue: selectedToken.value,
          tokenLogo: selectedToken.logo,
          tokenLabel: selectedToken.label,
          amount: numericAmount,
          amountInUsd,
          maturity: marketMaturity,
          editingPosition: editingPosition ?? undefined,
        },
        USE_MOCK ? undefined : { token: token!, markets },
      );
      // ... rest unchanged (success dialog, reset) ...
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  },
  [
    marketAmountInput, marketMaturity, isPending, selectedToken,
    getTokenInfo, getToken, markets, submitMarket, editingPosition, onUpdate,
  ],
);
```

**4b. `src/hooks/use-borrow-form.ts` — Add API hooks + wire both submits:**

Add imports:
```ts
import { USE_MOCK } from "@/lib/use-mock";
import { useAuthToken } from "@/hooks/use-auth-token";
import { useMarketData } from "@/hooks/use-market-data";
```

Inside the hook function:
```ts
const { getToken } = useAuthToken();
const { markets } = useMarketData();
```

Update `handleLimitSubmit`:
```ts
const token = USE_MOCK ? undefined : await getToken();
const result = await submitLimit(
  {
    tokenValue: selectedToken.value,
    tokenLogo: selectedToken.logo,
    tokenLabel: selectedToken.label,
    amount: numericAmount,
    maturity: limitMaturity,
    targetApr: aprDecimal,
    collateralTokens: limitSelectedCollaterals,
    editingPosition: editingPosition ?? undefined,
  },
  USE_MOCK ? undefined : { token: token!, markets },
);
```

Update `handleMarketSubmit` — same pattern:
```ts
const token = USE_MOCK ? undefined : await getToken();
const result = await submitMarket(
  {
    tokenValue: selectedToken.value,
    tokenLogo: selectedToken.logo,
    tokenLabel: selectedToken.label,
    amount: numericAmount,
    maturity: marketMaturity,
    collateralTokens: marketSelectedCollaterals,
    editingPosition: editingPosition ?? undefined,
  },
  USE_MOCK ? undefined : { token: token!, markets },
);
```

**Files:** `src/hooks/use-lend-form.ts`, `src/hooks/use-borrow-form.ts`

---

#### Phase 5: Tests

Follow the existing test patterns exactly. Vitest + `@testing-library/react`.

**5a. `src/lib/__tests__/positions-adapter.api.test.ts` — Extend existing file:**

Add test suites for:
- `normalizeOrderToLendPosition` with `orderType: "market"` — verify it passes through
- `normalizeOrderToBorrowPosition` — all field mappings, status mapping, unknown assetId, both orderType values
- `submitLendMarketOrder` — DTO conversion (no `rate`), calls `createLendMarketOrder`, returns normalized position
- `submitBorrowLimitOrder` — DTO conversion (with `rate`), calls `createBorrowLimitOrder`, returns `BorrowPosition`
- `submitBorrowMarketOrder` — DTO conversion (no `rate`), calls `createBorrowMarketOrder`, returns `BorrowPosition`

Update the `vi.mock("@/lib/api")` block to include all four `create*Order` functions.

**5b. `src/hooks/__tests__/use-submit-lend.api.test.ts` — Extend existing file:**

Add tests for `submitMarket` in API mode:
- Calls API adapter with params, token, and markets
- Returns normalized LendPosition
- Throws when token/markets missing
- Does not call mock adapter functions
- Propagates API errors
- Sets/resets `isPending`

Update mock for `positions-adapter.api` to include `submitLendMarketOrder`.

**5c. `src/hooks/__tests__/use-submit-borrow.api.test.ts` — New file:**

Follow `use-submit-lend.api.test.ts` pattern exactly. Test both `submitLimit` and `submitMarket`:
- Mock `USE_MOCK=false`
- Mock `positions-adapter.mock` (all functions)
- Mock `positions-adapter.api` (`submitBorrowLimitOrder`, `submitBorrowMarketOrder`)
- Tests for each: calls adapter, returns position, throws on missing auth, propagates errors, isPending lifecycle, no mock calls

**5d. `src/hooks/__tests__/use-my-assets.test.ts` — New file:**

Test the `useMyAssets` hook:
- Mock `USE_MOCK=true`: query is disabled, returns empty `assets`
- Mock `USE_MOCK=false`: calls `getMyAssets` with token, returns `assets` array
- Error handling: throws when no auth token
- Wraps in TanStack QueryClientProvider for `renderHook`

## Acceptance Criteria

### Functional Requirements

- [x] Lend market orders reach `POST /orders/lend/market` in API mode
- [x] Borrow limit orders reach `POST /orders/borrow/limit` in API mode
- [x] Borrow market orders reach `POST /orders/borrow/market` in API mode
- [x] All three use correct DTO format (market orders: no `rate`, limit orders: `rate` in basis points)
- [x] Mock mode is unchanged for all order types
- [x] `OrderResponseData` includes `side`, `type`, `timestamp` fields
- [x] `normalizeOrderToLendPosition` accepts `orderType` parameter
- [x] `normalizeOrderToBorrowPosition` produces valid `BorrowPosition` objects

### Quality Gates

- [x] `pnpm build` passes with zero new errors
- [x] All existing tests pass (`pnpm test`)
- [x] New tests pass for all three order types (adapter + hooks)
- [x] `use-my-assets.test.ts` passes

## Dependencies & Risks

**Dependencies:**
- Backend must be running with `AUTH_MODE=development` for manual testing
- Market data endpoint must return at least one market for UUID resolution

**Risks:**
- `collateralTokens` on `BorrowPosition` — set to `[]` from API since backend `OrderResponse` doesn't include it. Acceptable because collateral is tracked separately. Document as known limitation.
- Health factor validation happens server-side for borrow orders. The frontend currently validates client-side in mock mode via `useBorrowCalculations`. Both validations remain — the server is the source of truth in API mode, and the frontend check provides immediate UX feedback.

## References

### Internal References

- Reference pattern: `src/lib/positions-adapter.api.ts:90-107` (`submitLendLimitOrder`)
- Submit hook pattern: `src/hooks/use-submit-lend.ts:29-54` (USE_MOCK branching)
- Form hook pattern: `src/hooks/use-lend-form.ts:171-230` (`handleLimitSubmit` with getToken)
- Test pattern: `src/hooks/__tests__/use-submit-lend.api.test.ts` (API mode hook tests)
- Test pattern: `src/lib/__tests__/positions-adapter.api.test.ts` (adapter unit tests)
- Backend DTOs: `backend-v2/src/orders/dto/` (all four DTO files)
- Backend controller: `backend-v2/src/orders/orders.controller.ts` (all four endpoints)
- Brainstorm: `docs/brainstorms/2026-02-25-order-types-api-integration-brainstorm.md`
