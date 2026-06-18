# Recent Trades via WebSocket

**Date:** 2026-02-25
**Status:** Ready for planning

## What We're Building

Real-time "Recent Trades" feed on the market page, replacing the current hardcoded dummy data in `order-book.tsx`. Trades are pushed via Socket.IO from the backend-v2 WebSocket gateway, following the same pattern as the orderbook subscription.

**Scope:** Per loan token (same as orderbook). When viewing USDC market, you see all recent USDC trades across maturities.

**Limit:** Keep last 20 trades in memory per loan token room.

## Why This Approach

- **Live events only** (no DB bootstrap) — simpler, no DB dependency in the gateway. The order worker creates matches every 5 minutes, so trades will accumulate naturally.
- **Per loan token** — matches the orderbook room pattern (`orderbook:{loanToken}`), avoids requiring additional market selection.
- **Follow existing orderbook pattern exactly** — proven pattern, minimal new code.

## Key Decisions

1. **Scoped per loan token** — room: `recent-trades:{loanToken}`
2. **Live events only** — no DB query on subscribe, gateway caches last 20 per room
3. **20 trade limit** — lightweight, enough to fill the UI
4. **NATS subject: `matches.created`** — order worker publishes match events when filling orders
5. **Event name: `recent-trade`** — singular, for individual trade events appended to the list

## Data Flow

```
Order Worker fills order
  → inserts into `matches` table
  → publishes to NATS `matches.created`
  → WebSocket Gateway receives NATS message
  → appends to in-memory cache (last 20 per loanToken)
  → broadcasts `recent-trade` event to room `recent-trades:{loanToken}`
  → Frontend hook receives event, prepends to state
```

## Trade Event Shape

```typescript
interface RecentTradeEvent {
  matchId: string;
  loanToken: string;      // for room filtering
  side: "LEND" | "BORROW"; // taker side (is_borrower_taker)
  amount: string;          // match_amount in base units
  rate: number;            // basis points
  timestamp: number;       // unix ms
}
```

## Changes Required

### Backend (backend-v2)
1. **`nats-subjects.constants.ts`** — add `MATCH_CREATED: "matches.created"`
2. **`orders.worker.ts`** — publish match event to NATS after inserting into `matches` table
3. **`websocket.gateway.ts`** — subscribe to `matches.created`, cache per room, add `subscribe-recent-trades` / `unsubscribe-recent-trades` handlers, send cached trades on subscribe

### Frontend (frontend-revamp)
4. **New `hooks/use-recent-trades.ts`** — Socket.IO hook following `use-orderbook.ts` pattern, with mock fallback
5. **Update `order-book.tsx`** — replace hardcoded `RecentTradeTable` with hook data
