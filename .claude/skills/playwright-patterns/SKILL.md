---
name: playwright-patterns
description: >
  Read before writing any Playwright test. Test patterns, wallet mock setup,
  and conventions for this repo.
allowed-tools: Read, Write, Edit, Bash, Glob
---

# Playwright Patterns

## Config
`playwright.config.ts`: baseURL = backend (port 3000), testDir = `./e2e`. Browser UI tests need frontend URL (port 3200) — configure per test or add a project.

## Existing tests
`e2e/lend-limit-order.spec.ts` — API-level only (`request.get/post`), no browser UI. Uses `AUTH_HEADER = "Bearer DEV_TOKEN_{wallet}"`.

## Browser E2E pattern (provisional — no browser tests exist yet)
These are recommended starting points. Once the first browser E2E test is written, adapt this skill to match whatever pattern is actually established. Check `e2e/` for the current state before following these blindly.

Suggested: page object model in `e2e/pages/`.

## Wallet mocking (provisional)
**Option A (recommended):** Mock at API boundary — `page.route("**/api/**", ...)` to intercept backend calls.
**Option B:** Mock Privy auth state via `page.addInitScript()` setting localStorage.
Evaluate both when writing the first browser test. Document the chosen approach here.

## WebSocket mocking (provisional)
For order book and price tests, intercept Socket.io:
```typescript
// Option 1: Intercept polling transport
await page.route("**/socket.io/**", route => route.fulfill({ status: 200, body: "" }));
// Then inject data via evaluate:
await page.evaluate(() => { /* dispatch mock price event */ });

// Option 2: Mock at API level — use page.route for /api/market, /api/orderbook etc.
// and skip real WS entirely. Simpler and more reliable for most tests.
```
Existing socket mock helper: `src/__tests__/helpers/mock-socket.ts` (for Vitest, not Playwright).

## Assertions
Assert exact financial values, not just element visibility:
```typescript
const hf = await page.getByTestId("health-factor-value").textContent();
expect(parseFloat(hf!)).toBeCloseTo(2.5, 1);
```

## Coverage per test
Every E2E test covers: happy path, user rejection, API failure, wrong network, loading states, financial value correctness.

## Run commands
```bash
pnpm run test:e2e                    # all
npx playwright test e2e/file.spec.ts # single
npx playwright test --ui             # headed debug
npx playwright test --grep "name"    # filter
```

## Backlog
See CLAUDE.md "Playwright E2E Backlog" for full list of uncovered flows.
