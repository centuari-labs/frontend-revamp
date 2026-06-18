# Brainstorm: Wire Remaining Order Types to Backend API

**Date:** 2026-02-25
**Status:** Ready for planning

## What We're Building

Integrate the three remaining order types (lend market, borrow limit, borrow market) with the backend API, following the lend limit order as the reference pattern. Also create comprehensive tests for all order flows.

## Current State

| Order Type | `api.ts` function | `positions-adapter.api.ts` | `USE_MOCK` branching in submit hook |
|------------|-------------------|----------------------------|-------------------------------------|
| Lend Limit | `createLendLimitOrder` | `submitLendLimitOrder` + `normalizeOrderToLendPosition` | Yes |
| Lend Market | **Missing** | **Missing** | No — mock-only |
| Borrow Limit | **Missing** | **Missing** | No — mock-only |
| Borrow Market | **Missing** | **Missing** | No — mock-only |

The backend has all four endpoints fully implemented and ready:
- `POST /orders/lend/limit` — requires `rate` (basis points)
- `POST /orders/lend/market` — no `rate` field
- `POST /orders/borrow/limit` — requires `rate`, includes health-factor check
- `POST /orders/borrow/market` — no `rate`, includes health-factor check

## Reference Pattern (Lend Limit Flow)

```
use-lend-form.ts → getToken() → use-submit-lend.ts → positions-adapter.api.ts → api.ts → POST /orders/lend/limit
```

Each layer does:
1. **Form hook**: conditionally gets auth token, passes `{ token, markets }` options
2. **Submit hook**: checks `USE_MOCK`, either builds mock position OR calls API adapter
3. **API adapter**: resolves UUIDs via `resolveMarketForAsset()`, converts units (`aprToBasisPoints()`), calls raw API, normalizes response
4. **API function**: `apiClient(POST ...)` with auth token, unwraps double envelope

## Key Observations

- **DTO differences**: Market orders have no `rate` field; limit orders require `rate` in basis points (1-10000)
- **Borrow-specific**: Backend checks health factor before creating borrow orders; returns `BadRequestException` if below threshold
- **Response shape**: All four endpoints return identical `OrderResponseData` structure (includes `side`, `type`, `timestamp` — frontend interface is missing these fields)
- **Normalization**: Current `normalizeOrderToLendPosition` hard-codes `orderType: "limit"` — needs parameterization
- **Borrow form gaps**: `use-borrow-form.ts` lacks `useAuthToken()`, `useMarketData()`, and `useMyAssets()` imports needed for API mode
- **Collateral**: Borrow positions have `collateralTokens` field; unclear how backend populates this in the response — may need separate handling

## Key Decisions

1. **Follow the reference pattern exactly** for all three order types
2. **Reuse `OrderResponseData`** — same response shape from all endpoints
3. **Separate test files for API mode** — follow `use-submit-lend.api.test.ts` convention
4. **Test framework**: Vitest + @testing-library/react (not Jest)

## Files Requiring Changes

### `src/lib/api.ts`
- Add `createLendMarketOrder`, `createBorrowLimitOrder`, `createBorrowMarketOrder`
- Update `OrderResponseData` to include `side`, `type`, `timestamp`

### `src/lib/positions-adapter.api.ts`
- Add `submitLendMarketOrder`, `submitBorrowLimitOrder`, `submitBorrowMarketOrder`
- Add `normalizeOrderToBorrowPosition`
- Parameterize `normalizeOrderToLendPosition` for market vs limit

### `src/hooks/use-submit-lend.ts`
- Add `USE_MOCK` branching + API adapter call to `submitMarket`

### `src/hooks/use-submit-borrow.ts`
- Add `USE_MOCK` branching + API adapter calls to both `submitLimit` and `submitMarket`
- Accept `options` parameter (token + markets) like lend submit does

### `src/hooks/use-lend-form.ts`
- Pass token/markets to `submitMarket` in API mode (like `handleLimitSubmit` does)

### `src/hooks/use-borrow-form.ts`
- Add `useAuthToken()`, `useMarketData()`, `useMyAssets()` hooks
- Pass token/markets to both submit functions in API mode
- Handle health-factor `BadRequestException` from backend

### Tests (new files)
- `src/hooks/__tests__/use-submit-lend.api.test.ts` — extend for market orders
- `src/hooks/__tests__/use-submit-borrow.api.test.ts` — new
- `src/lib/__tests__/positions-adapter.api.test.ts` — extend for all order types
- `src/hooks/__tests__/use-my-assets.test.ts` — new
- `src/hooks/__tests__/use-lend-form.api.test.ts` — new (API-mode balance + submission)
- `src/hooks/__tests__/use-borrow-form.api.test.ts` — new (API-mode submission)
