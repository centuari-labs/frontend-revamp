---
title: feat: Comprehensive Frontend Test Suite
type: feat
status: active
date: 2026-02-25
---

# Comprehensive Frontend-Revamp Test Suite

## Context

The frontend-revamp (Next.js 15 + React 19) currently has **zero test infrastructure** — no test files, no config, no testing libraries. The app has 22 custom hooks, 12 lib files, and 64+ components with significant DeFi business logic (health factor calculations, order submission, portfolio management, WebSocket subscriptions). This plan adds a full test suite prioritizing business-critical logic.

## Framework Choice: Vitest

**Vitest over Jest** because:
- Native ESM support (Next.js 15 uses `module: "esnext"`)
- Resolves `@/*` path alias via `vite-tsconfig-paths` (no `moduleNameMapper`)
- Faster transforms via esbuild (no `ts-jest` needed)
- `vi.mock()` avoids Jest's ESM hoisting issues
- Built-in `jsdom` environment with working `localStorage`

## Packages to Install

```bash
pnpm add -D vitest @vitejs/plugin-react vite-tsconfig-paths jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

## Files to Create/Modify

### Infrastructure (5 files)
- `vitest.config.ts` — Vitest config with React plugin, tsconfig paths, jsdom environment
- `src/__tests__/setup.ts` — Global setup (jest-dom matchers, cleanup, browser API mocks)
- `src/__tests__/helpers/render-with-providers.tsx` — QueryClientProvider wrapper for hooks
- `src/__tests__/helpers/mock-socket.ts` — Socket.io mock factory with `_simulateEvent` helper
- `src/__tests__/helpers/fixtures/positions.ts` — `makeLendPosition()` / `makeBorrowPosition()` factories

### Package.json — Add scripts
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

### Test Files (25 files, ~274 tests)

#### Priority 1: Pure Utility Functions (~99 tests, 6 files)

| File | Source | Tests | Key coverage |
|------|--------|-------|-------------|
| `src/lib/__tests__/utils.test.ts` | `lib/utils.ts` (521 lines) | ~55 | formatCurrency, formatCompactCurrency, formatAddress, healthFactor*, calculateFutureAmount, calculateProfitAmount, formatDate, formatNumberWithSeparator |
| `src/lib/__tests__/maturity.test.ts` | `lib/maturity.ts` | ~12 | getAvailableMaturityTimestamps, normalizeMaturity, isValidMaturityTimestamp |
| `src/lib/__tests__/portfolio-data.test.ts` | `lib/portfolio-data.ts` | ~12 | getTokenInfo, getTokenSymbol, getLiquidationThreshold, getLiquidationPenalty |
| `src/lib/__tests__/tokens.test.ts` | `lib/tokens.ts` | ~10 | getTokenLogo, getTokenIcon, getTokenByValue |
| `src/lib/__tests__/chains.test.ts` | `lib/chains.ts` | ~6 | getChainIcon, getChainByValue |
| `src/types/__tests__/positions.test.ts` | `types/positions.ts` | ~4 | isLendPosition, isBorrowPosition type guards |

#### Priority 2: Mock Adapter (~40 tests, 1 file)

| File | Source | Tests | Key coverage |
|------|--------|-------|-------------|
| `src/lib/__tests__/positions-adapter.mock.test.ts` | `lib/positions-adapter.mock.ts` (437 lines) | ~40 | submitOpenOrder, submitFilledLend/BorrowPosition (merge logic, weighted APR), withdraw, repay, portfolio/debt updates, build*Position factories |

#### Priority 3: Custom Hooks (~119 tests, 16 files)

| File | Tests | Key coverage |
|------|-------|-------------|
| `src/hooks/__tests__/use-amount-input.test.ts` | ~8 | handleChange formatting, setMax, reset |
| `src/hooks/__tests__/use-borrow-calculations.test.ts` | ~12 | healthFactor formula, weightedLTV, availableQuota, HF cap at 10 |
| `src/hooks/__tests__/use-positions.test.ts` | ~8 | localStorage reads, 500ms polling, storage/custom event reactivity |
| `src/hooks/__tests__/use-orderbook.test.ts` | ~10 | Mock mode randomization, WS subscribe/update/unsubscribe, rate conversion |
| `src/hooks/__tests__/use-recent-trades.test.ts` | ~8 | Mock mode 2s interval, WS events, max 20 trades cap |
| `src/hooks/__tests__/use-market-data.test.ts` | ~5 | TanStack Query loading/success/error states |
| `src/hooks/__tests__/use-account-name.test.ts` | ~6 | localStorage, Privy fallbacks (email/Google/Twitter) |
| `src/hooks/__tests__/use-portfolio-from-storage.test.ts` | ~8 | defaultPortfolio fallback, reactive updates, collateralStatus |
| `src/hooks/__tests__/use-submit-lend.test.ts` | ~6 | submitLimit/Market new/editing, isPending states |
| `src/hooks/__tests__/use-submit-borrow.test.ts` | ~6 | submitLimit/Market new/editing, isPending states |
| `src/hooks/__tests__/use-token-from-list.test.ts` | ~5 | Default selection, prop override, fallback behavior |
| `src/hooks/__tests__/use-lend-form.test.ts` | ~10 | Validation, fee calc (0.01%), future amount, submit flow, reset |
| `src/hooks/__tests__/use-borrow-form.test.ts` | ~12 | HF >= 1.0 validation, collateral auto-select, quota check, submit flow |
| `src/hooks/__tests__/use-repay.test.ts` | ~3 | repay calls adapter, isPending states |
| `src/hooks/__tests__/use-withdraw-lend-position.test.ts` | ~4 | withdraw calls adapter, isPending/isSuccess/reset |
| `src/hooks/__tests__/use-delete-open-order.test.ts` | ~4 | Deletes from correct storage, isPending |
| `src/hooks/__tests__/use-update-open-order.test.ts` | ~4 | Updates correct storage, isPending |

#### Priority 4: API Layer (~16 tests, 2 files)

| File | Tests | Key coverage |
|------|-------|-------------|
| `src/lib/__tests__/api-client.test.ts` | ~8 | Fetch wrapper, envelope unwrap, auth headers, error handling |
| `src/lib/__tests__/socket.test.ts` | ~8 | acquireSocket/releaseSocket ref counting, reconnect, resolveWsUrl |

## Key Mocking Strategies

**localStorage**: Use jsdom's built-in + `localStorage.clear()` in `beforeEach`

**Socket.io**: Mock `@/lib/socket` module:
```ts
vi.mock("@/lib/socket", () => ({
  acquireSocket: vi.fn(() => createMockSocket()),
  releaseSocket: vi.fn(),
}));
```

**USE_MOCK flag**: Mock at module level per describe:
```ts
vi.mock("@/lib/use-mock", () => ({ USE_MOCK: true }));
```

**Privy**: Mock `@privy-io/react-auth`:
```ts
vi.mock("@privy-io/react-auth", () => ({
  usePrivy: vi.fn(() => ({ authenticated: false, ready: true, user: null })),
}));
```

**TanStack Query**: Fresh `QueryClient({ defaultOptions: { queries: { retry: false } } })` per test via `renderHookWithProviders`

**Fake timers**: `vi.useFakeTimers()` / `vi.advanceTimersByTime()` for polling intervals and mock delays

## Implementation Order

1. Infrastructure: packages, vitest.config.ts, setup.ts, helpers
2. Priority 1: Pure utility tests (6 files, ~99 tests)
3. Priority 2: Mock adapter tests (1 file, ~40 tests)
4. Priority 3: Hook tests (16 files, ~119 tests)
5. Priority 4: API layer tests (2 files, ~16 tests)

## Verification

1. `pnpm test` — all ~274 tests pass
2. `pnpm test:coverage` — lines >=60%, functions >=60%, branches >=50%
3. `pnpm run build` — still compiles clean
