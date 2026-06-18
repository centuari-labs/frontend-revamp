---
title: "feat: Recent Trades via WebSocket"
type: feat
status: active
date: 2026-02-25
brainstorm: docs/brainstorms/2026-02-25-recent-trades-websocket-brainstorm.md
---

# feat: Recent Trades via WebSocket

## Overview

Replace the hardcoded dummy data in the "Recent Trades" tab of `OrderBookCard` with a real-time WebSocket feed. Follows the established orderbook subscription pattern: order worker publishes match events to NATS, the WebSocket gateway caches and broadcasts them to Socket.IO rooms, and a frontend hook consumes them.

## Acceptance Criteria

- [ ] When the order worker fills an order, a trade event appears in the Recent Trades tab within seconds
- [ ] Trades are scoped per loan token (same as orderbook)
- [ ] Gateway caches last 20 trades per room; late-joining clients receive the cached list
- [ ] Mock mode still works when `NEXT_PUBLIC_USE_MOCK=true`
- [ ] Existing orderbook functionality is unaffected

## Implementation Plan

### Step 1: Add NATS subject constant

**File:** `backend-v2/src/orders/constants/nats-subjects.constants.ts`

Add `MATCH_CREATED: "matches.created"` to the `NATS_SUBJECTS` object. This aligns with the matching-engine architecture doc which already defines `matches.created` as an output topic.

### Step 2: Extend asset/market cache with token addresses

**File:** `backend-v2/src/orders/orders.worker.ts`

The worker's `assetMarketCache` currently stores `{ assetId, marketIds }`. Extend it to also store `tokenAddress` so `fillRandomOrder` can include `loanToken` in the NATS match event without an extra DB query.

In `refreshAssetMarketCache()`:
- Join the `assets` table to get `token_address` alongside each market's `asset_id`
- Store as `{ assetId, marketIds, tokenAddress }` in the cache

### Step 3: Inject NatsService into OrdersWorker and publish match events

**File:** `backend-v2/src/orders/orders.worker.ts`

- Import and inject `NatsService` into the constructor (same pattern as `OrdersService`)
- After the match insert in `fillRandomOrder` (after the transaction commits), publish to NATS:

```typescript
// After the transaction block
await this.natsService.publish(NATS_SUBJECTS.MATCH_CREATED, {
    loanToken: entry.tokenAddress,  // from extended cache
    side: isLend ? "BORROW" : "LEND",  // taker side
    amount: quantity.toString(),
    rate: order.rate,
    timestamp: Date.now(),
});
```

Note: publish **after** the transaction commits so we don't broadcast trades that get rolled back. Move the publish outside the `dataSource.transaction()` callback.

### Step 4: Create recent trades DTO

**File:** `backend-v2/src/core/websocket/dto/recent-trades.dto.ts` (new file)

```typescript
export interface RecentTradeDto {
    loanToken: string;
    side: "LEND" | "BORROW";
    amount: string;
    rate: number;
    timestamp: number;
}

export interface SubscribeRecentTradesDto {
    loanToken: string;
}
```

### Step 5: Add recent trades handling to WebSocket gateway

**File:** `backend-v2/src/core/websocket/websocket.gateway.ts`

Add three things:

1. **In-memory cache:** `private recentTradesCache = new Map<string, RecentTradeDto[]>()`

2. **NATS subscription** in `setupNatsSubscriptions()` — subscribe to `matches.>` and handle match events:
   - Append trade to cache (trim to 20 per room)
   - Broadcast `recent-trade` event to room `recent-trades:{loanToken}`

3. **Subscribe/unsubscribe handlers:**
   - `@SubscribeMessage("subscribe-recent-trades")` — join room, send cached trades
   - `@SubscribeMessage("unsubscribe-recent-trades")` — leave room

Follow the exact same pattern as `handleSubscribeOrderbook` / `handleUnsubscribeOrderbook`.

### Step 6: Create frontend hook

**File:** `frontend-revamp/src/hooks/use-recent-trades.ts` (new file)

Follow the `use-orderbook.ts` pattern exactly:

```typescript
export type TradeRow = {
    time: string;       // formatted HH:MM:SS
    type: "Lend" | "Borrow";
    amount: number;     // human-readable (divided by 10^decimals)
    apr: number;        // decimal (rate / 10000)
};

export function useRecentTrades(options?: {
    loanToken?: string;
    decimals?: number;
}) { ... }
```

- **Mock mode:** Generate random trades on a 2-second interval
- **WebSocket mode:** Subscribe to `recent-trades` room, listen for `recent-trade` events, prepend new trades to state (cap at 20)
- **On subscribe response:** Receive cached trades array for initial state
- Gate on `isAddress(loanToken)` like orderbook hook

### Step 7: Wire hook into OrderBookCard

**File:** `frontend-revamp/src/components/market/order-book.tsx`

- Update `RecentTradesContent` to accept `loanToken` and `decimals` props
- Call `useRecentTrades({ loanToken, decimals })` inside it
- Replace hardcoded `recentTrades` array with hook data
- Pass `loanToken`/`decimals` from `OrderBookCard` → `RecentTradesContent` (same as `OrderBookContent`)

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Room scope | Per loan token | Matches orderbook pattern, avoids extra market selection |
| Data source | Live events only | No DB dependency in gateway, simpler |
| Cache limit | 20 trades | Fits UI, lightweight |
| NATS publish timing | After transaction commits | Prevents broadcasting rolled-back trades |
| Room key | `loanToken` (Ethereum address) | Consistent with orderbook rooms |

## References

- Orderbook WebSocket pattern: `backend-v2/src/core/websocket/websocket.gateway.ts:267-315`
- Frontend orderbook hook: `frontend-revamp/src/hooks/use-orderbook.ts:130-200`
- NATS subjects: `backend-v2/src/orders/constants/nats-subjects.constants.ts`
- Match insert in worker: `backend-v2/src/orders/orders.worker.ts:354-373`
- Hardcoded recent trades UI: `frontend-revamp/src/components/market/order-book.tsx:82-131`
- Matching engine architecture (defines `matches.created`): `matching-engine/docs/ARCHITECTURE.md`
