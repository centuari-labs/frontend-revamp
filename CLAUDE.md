# CLAUDE.md — Frontend (Next.js)

## Stack

Next.js 15 · React 19 · TypeScript (strict) · TailwindCSS v4 · shadcn/ui (new-york) · Radix UI · TanStack Query v5 · React Hook Form + Zod v4 · Privy + Wagmi v3 · Viem · Socket.io · Vitest · Playwright · Biome · pnpm

## Commands

```bash
pnpm run dev                # next dev --turbopack -p 3200
pnpm run build              # production build
pnpm run test               # vitest run
pnpm run test:watch         # vitest watch mode
pnpm run test:e2e           # playwright test
```

## Contract addresses & ABIs

Addresses and ABIs are auto-managed by `smart-contract-revamp/bin/sync-to-services.sh`. Run that script after every fresh deploy — it writes:

- `frontend-revamp/.env.local` — `NEXT_PUBLIC_*` addresses (gitignored).
- `frontend-revamp/abis/*.json` — full ABIs (gitignored).

Do not hand-edit either. Code reads addresses through `src/lib/chain-config.ts` (which throws at import time if a required address is missing) and imports ABIs as `import abi from "@/../abis/<Contract>.json"`. Hand-curated TS ABI subsets were removed in Phase 4 of the ABI sync migration.

## Architecture

```
src/
├── app/                # Next.js App Router (pages + layouts)
│   ├── market/         # Market page with order books
│   ├── portfolio/      # Portfolio dashboard
│   ├── faucet/         # Testnet faucet
│   ├── points/         # Points/rewards
│   ├── sandbox/        # Sandbox environment
│   └── api/            # API proxy routes
├── components/
│   ├── ui/             # shadcn base components (27)
│   ├── market/         # Market-specific components
│   ├── portfolio/      # Portfolio-specific components
│   ├── home/           # Home page components
│   ├── icons/          # SVG icon components
│   └── centuari-*.tsx  # Domain-specific custom components
├── hooks/              # 40+ custom hooks
├── lib/                # API client, utils, config, tokens, socket
├── types/              # TypeScript type definitions
└── contexts/           # React Context providers
```

### Provider Stack (top-down)

```
ThemeProvider → PrivyProvider → QueryClientProvider → WagmiProvider → EmbeddedWalletGuard → PriceProvider → TourProvider
```

### Data Flow

```
Component → Custom Hook → TanStack Query → API Client → Backend REST/WebSocket
                                         → Wagmi/Viem → Blockchain
```

## Code Standards

### Naming

| Element | Convention | Example |
|---------|-----------|---------|
| Component files | kebab-case | `centuari-lend-dialog.tsx`, `order-book.tsx` |
| UI components | kebab-case | `button.tsx`, `dialog.tsx` |
| Hook files | `use-` prefix, kebab-case | `use-lend-form.ts`, `use-market-data.ts` |
| Lib files | kebab-case | `api-client.ts`, `chain-config.ts` |
| Components | PascalCase | `CentuariLendDialog`, `OrderBook` |
| Hooks | camelCase with `use` prefix | `useLendForm`, `useMarketData` |
| Props interfaces | `{Component}Props` | `OrderBookProps`, `LendDialogProps` |
| Utilities | camelCase | `formatCurrency`, `getTokenSlug` |
| Constants | SCREAMING_SNAKE_CASE | `MARKET_TOKEN_LIST`, `ACTIVE_CHAIN` |
| Types/Interfaces | PascalCase | `LendPosition`, `TokenOption` |

### Component Rules

1. **One component per file** — except tightly coupled sub-components that are never used independently.
2. **Props extend native elements** — use `React.ComponentProps<"button">` as base, add domain props on top.
3. **CVA for variants** — use `class-variance-authority` for multi-variant components. Define `variants` and `defaultVariants`.
4. **Composition over props** — prefer compound components (e.g., `<Dialog><DialogTrigger>`) over massive prop objects.
5. **No inline styles** — use Tailwind classes exclusively. Use `cn()` from `lib/utils` to merge conditional classes.
6. **shadcn components are read-only** — never modify files in `components/ui/`. Create `centuari-*` wrappers for customization.
7. **Prefix domain components** — custom components that combine shadcn primitives get `centuari-` prefix (e.g., `centuari-button.tsx`).
8. **Component max size** — dialog components should be <300 lines. Extract sub-components for form sections, success states, and fee displays.
9. **Shared sub-components** — `FeeBreakdown`, `OrderSuccessDialog`, `DepositFlowView` are shared components — don't duplicate them.

### Hook Rules

1. **One hook per file** — name the file after the hook.
2. **Hooks are the data layer** — components should not contain fetch logic, complex state derivation, or business logic. Extract to hooks.
3. **Wrap TanStack Query** — never use `useQuery`/`useMutation` directly in components. Create a domain hook that encapsulates the query key, fetch function, and transformation.
4. **Mock adapter pattern** — for data hooks, create `*-adapter.api.ts` (real) and `*-adapter.mock.ts` (mock). The hook selects based on `USE_MOCK` flag.
5. **Colocate related state** — if multiple `useState` calls always change together, combine into a single hook or reducer.
6. **Return stable references** — memoize returned objects/arrays with `useMemo` when consumers use them in dependency arrays.
7. **Hook max size** — hooks should be <200 lines. Decompose larger hooks into focused sub-hooks.
8. **No duplicated calculations** — any calculation appearing in 2+ hooks must be extracted to `lib/` utilities.
9. **Success dialog pattern** — use `useSuccessDialog()` micro-hook for success state, not inline `useState`.

### Styling Rules

1. **Tailwind v4** with custom theme in `globals.css` — use the defined color tokens (`primary-blue-*`, `success-*`, `warning-*`, `critical-*`).
2. **`cn()` for conditional classes** — always use `cn()` from `lib/utils.ts`, never string concatenation.
3. **Responsive mobile-first** — use `md:` and `lg:` breakpoints. Default styles target mobile.
4. **Dark mode via next-themes** — use CSS variables for theme-aware colors. Never hardcode light/dark colors in classes.

### Form Rules

1. **React Hook Form + Zod** — every form uses `useForm` with `zodResolver`.
2. **shadcn Form components** — use `<Form>`, `<FormField>`, `<FormItem>`, `<FormLabel>`, `<FormControl>`, `<FormMessage>`.
3. **Extract form logic to hooks** — complex forms get their own `use-*-form.ts` hook that returns form state, handlers, and derived values.

### Data Fetching Rules

1. **Centralized API functions** — all fetch calls defined in `lib/api.ts`. Never call `fetch` directly in hooks.
2. **API client** — use `lib/api-client.ts` for the generic fetch wrapper with error handling.
3. **Query keys centralized** — all query keys defined in `lib/query-keys.ts`. Use `QUERY_KEYS.*` constants — never hardcode key arrays.
4. **Mutation invalidation** — use `invalidateUserQueries(queryClient)` helper — never manually list keys to invalidate.
5. **No redundant staleTime** — don't re-specify `staleTime` that matches the global default (10s). Only specify when overriding.
6. **Polling intervals** — use constants from `lib/query-config.ts`, not hardcoded numbers.
7. **WebSocket for real-time** — price updates come via `PriceProvider` (Socket.io). Use context, not polling.

### Type Rules

1. **Strict mode** — full TypeScript strict mode. No `any`, no `@ts-ignore`.
2. **Zod for runtime validation** — validate all external data (API responses, WebSocket messages) with Zod schemas.
3. **Type guards** — use `isLendPosition()`, `isBorrowPosition()` etc. for discriminated unions. Never cast.
4. **Shared types in `types/`** — domain types go in `types/`. Component-specific types stay in the component file.

### Testing Rules

1. **Vitest + Testing Library** for unit/integration tests.
2. **Test hooks with `renderHook()`** — mock dependencies with `vi.mock()`.
3. **Fixtures in `__tests__/helpers/fixtures/`** — use factory functions like `makeLendPosition()`.
4. **Playwright** for e2e tests in `e2e/` directory.
5. **Don't test shadcn internals** — test domain behavior, not UI library implementation.

### Fee & Financial Calculations

1. **Single source of truth** — all fee constants and calculations live in `lib/fee-utils.ts`, mirroring the matching engine.
2. **Token price calculation** — use `getTokenPrice()` from `lib/utils.ts`. Never inline price lookups.

### Formatting

Biome v2.2.6: Tab indent for JS/TS, double quotes, space indent for CSS/JSON. Run `pnpm run lint` before committing.
