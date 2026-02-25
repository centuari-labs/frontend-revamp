# Brainstorm: Lend Limit Order — Frontend API Integration

**Date:** 2026-02-25
**Status:** Ready for planning

## What We're Building

Connect the frontend lend limit order flow to the real backend API (`POST /orders/lend/limit`) when `USE_MOCK=false`. Currently the frontend only saves to localStorage via the mock adapter. We need a real API adapter that:

1. Converts frontend types to backend DTO format (decimal APR → basis points, token slug → asset UUID, maturity → market UUID)
2. Calls the backend REST API with proper auth (Privy JWT)
3. Returns a normalized response back to the existing hooks

The existing hooks (`useSubmitLend`, `useLendForm`) stay unchanged — they branch on `USE_MOCK` internally, same pattern as `use-orderbook.ts` and `use-recent-trades.ts`.

## Why This Approach

**Branch on USE_MOCK in the adapter layer** because:
- Follows the established codebase pattern (orderbook, recent trades already do this)
- Hooks and components remain untouched — only the data source changes
- Mock mode keeps working for demo/development without a running backend
- The `positions-adapter.api.ts` file is the single place for all backend-specific conversions

**Rejected alternatives:**
- Separate hooks: Doubles the hook count, components need to know which to import
- Replace mock entirely: Breaks the demo flow that stakeholders rely on

## Key Decisions

1. **Adapter pattern**: New `positions-adapter.api.ts` alongside existing `positions-adapter.mock.ts`. A barrel file or the hooks themselves pick the right adapter based on `USE_MOCK`.

2. **ID resolution**: Use the existing `useMarketData` hook (calls `GET /market`) to resolve token slugs to `assetId` UUIDs. Market IDs come from the same endpoint. No hardcoded mappings.

3. **Rate conversion in the adapter**: `positions-adapter.api.ts` converts:
   - APR decimal (0.065) → basis points integer (650): `Math.round(apr * 10000)`
   - Token amount (number) → string: `String(amount)`
   - Maturity timestamp → market UUID: looked up from market data

4. **Auth**: Use `useAuthToken` hook (wraps Privy's `getAccessToken()`) to get JWT. Pass to `apiClient` as `token` option.

5. **Testing**: `vi.mock` the API adapter at the module level in frontend tests. Same pattern as existing mock adapter tests. No MSW or global fetch mocking needed.

## Data Flow (API Mode)

```
useLendForm.handleLimitSubmit()
  → useSubmitLend.submitLimit(SubmitLendLimitParams)
    → positions-adapter.api.submitLendLimitOrder({
        assetId: UUID,          // resolved from tokenValue via market data
        amount: "1000",         // string
        marketIds: [UUID],      // resolved from maturity via market data
        rate: 650,              // basis points integer
        autoRollover: boolean,
      }, authToken)
      → apiClient<OrderResponse>("/orders/lend/limit", { method: "POST", body, token })
        → Backend validates DTO, saves order, publishes to NATS
      ← Returns OrderResponse { orderId, status, rate (percentage), ... }
    ← Normalized to LendPosition for UI
```

## Key Conversions

| Field | Frontend | Backend DTO | Conversion |
|-------|----------|-------------|------------|
| Token | `tokenValue: "usdc"` | `assetId: UUID` | Lookup from market data |
| Amount | `amount: 1000` (number) | `amount: "1000"` (string) | `String()` |
| Rate | `targetApr: 0.065` (decimal) | `rate: 650` (basis points) | `Math.round(apr * 10000)` |
| Maturity | `maturity: 1735689600000` (ms) | `marketIds: [UUID]` | Lookup from market data |
| Auto-rollover | `autoRollover: true` | `autoRollover: true` | Pass-through |

## Files to Create/Modify

### New files
- `src/lib/positions-adapter.api.ts` — Real API adapter with conversions
- `src/lib/__tests__/positions-adapter.api.test.ts` — Tests for the API adapter
- `src/hooks/__tests__/use-submit-lend.api.test.ts` — Tests for API-mode submit flow

### Modified files
- `src/lib/api.ts` — Add `createLendLimitOrder()` typed endpoint
- `src/hooks/use-submit-lend.ts` — Branch on `USE_MOCK` to pick adapter
- `src/hooks/use-lend-form.ts` — Pass market data context for ID resolution

## Resolved Questions

- **Q: How to handle the asset UUID lookup?** A: Use market data from `GET /market` endpoint (already fetched by `useMarketData`). The response includes `asset.id` (UUID) and `asset.symbol`.
- **Q: How to handle market UUID lookup?** A: Same market data response includes market IDs mapped to maturities.
- **Q: What about error handling?** A: `apiClient` already throws on non-2xx. The hooks catch errors and log them. No additional error handling layer needed.

## Open Questions

None — all questions resolved during brainstorming.
