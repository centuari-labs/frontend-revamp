# WebSocket Orderbook Integration

Real-time orderbook data on the market page, toggled by `NEXT_PUBLIC_USE_MOCK`.

## Overview

| Mode | Trigger | Data source |
|------|---------|-------------|
| Mock (default) | `NEXT_PUBLIC_USE_MOCK=true` or unset | Randomized client-side data on a 1.1s interval |
| WebSocket | `NEXT_PUBLIC_USE_MOCK=false` | Socket.IO connection to backend-v2 gateway |

## New Files

| File | Purpose |
|------|---------|
| `src/lib/use-mock.ts` | Exports `USE_MOCK` boolean from env var |
| `src/lib/socket.ts` | Socket.IO singleton (`getSocket()`) connecting to `NEXT_PUBLIC_WS_URL` |
| `src/hooks/use-orderbook.ts` | `useOrderbook` hook — branches mock vs WebSocket based on `USE_MOCK` |

## Modified Files

| File | Change |
|------|--------|
| `src/lib/api.ts` | Added `token_address` to `MarketAsset` interface |
| `src/hooks/use-market-data.ts` | Added `token_address` to fallback mock data |
| `src/components/market/order-book.tsx` | Removed inline mock data/logic; uses `useOrderbook` hook. Accepts `loanToken` and `decimals` props |
| `src/app/market/page.tsx` | Looks up active market from `useMarketData()`, passes `token_address` and `decimals` to `OrderBookCard` |

## Dependencies

- `socket.io-client` — added to `package.json`

## Data Flow

```
URL ?token=usdc
      │
      ▼
  useMarketData()  ──fetch──▶  GET /api/market
      │
      ▼
  Find market by symbol  ──▶  activeMarket.asset.token_address
      │                        activeMarket.asset.decimals
      ▼
  <OrderBookCard loanToken={...} decimals={...} />
      │
      ▼
  useOrderbook({ loanToken, decimals })
      │
      ├─ USE_MOCK=true   → randomize mock orders every 1100ms
      │
      └─ USE_MOCK=false  → Socket.IO subscribe/listen
            │
            ├─ emit  "subscribe-orderbook"   { loanToken }
            ├─ on    "orderbook-update"       { loanToken, lend, borrow, timestamp }
            └─ emit  "unsubscribe-orderbook"  { loanToken }  (on cleanup)
```

## WebSocket Protocol

### Subscribe

Client emits `subscribe-orderbook` with:

```json
{ "loanToken": "0xA0b8...3E8" }
```

`loanToken` is the ERC-20 token address (from the market API's `asset.token_address`).

### Receive updates

Server emits `orderbook-update`:

```json
{
  "loanToken": "0xA0b8...3E8",
  "lend": [
    { "rate": 4.65, "amount": "5000000000", "orders": 3 }
  ],
  "borrow": [
    { "rate": 4.82, "amount": "21000000000", "orders": 2 }
  ],
  "timestamp": 1708800000000
}
```

- `rate` — percentage (4.65 = 4.65% APR)
- `amount` — raw token units (string); divided by `10^decimals` for display

### Unsubscribe

Client emits `unsubscribe-orderbook` with the same `{ loanToken }` payload on component unmount or token change.

## `useOrderbook` API

```ts
function useOrderbook(options?: {
  loanToken?: string;
  decimals?: number;     // default 6
}): {
  borrowOrders: OrderRow[];
  lendOrders: OrderRow[];
  isConnected: boolean;
};

type OrderRow = {
  apr: number;     // decimal (0.0465 = 4.65%)
  amount: number;  // human-readable token amount
  side: "lend" | "borrow";
};
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_USE_MOCK` | `true` | Set to `"false"` to enable WebSocket mode |
| `NEXT_PUBLIC_WS_URL` | `http://localhost:3000` | Socket.IO server URL (backend-v2) |
