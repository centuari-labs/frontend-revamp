# Security Audit

Pentest-style review of `src/` (excluding `app/sandbox/`). Stack: Next.js 15 App Router · Privy · Wagmi v3 · Viem · Socket.io · TanStack Query v5.

## Executive summary

- The catch-all proxy at `src/app/api/[...path]/route.ts` is well-aimed (allowlisted prefixes, header stripping, `..`/`//` blocked). Two design weaknesses remain: silent fallback to `http://localhost:3000` if `BACKEND_URL` is unset, and no body-size cap, request timeout, or response streaming.
- Auth is delegated to Privy (JWT in memory, retrieved per-request via `getAccessToken()`). Tokens are not persisted in `localStorage` (good); JWT is forwarded via `Authorization` header through the same-origin proxy. CSRF on state-changing requests is not exploitable (no cookie-based session; cookies are not forwarded).
- The Treasury contract address is read from `NEXT_PUBLIC_TREASURY_ADDRESS` and used as the destination of an ERC20 `approve` and the `Treasury.deposit` call. Build-time baked, but `as 0x${string}` silently coerces undefined and a tampered build can route funds.
- Two debug `console.log` statements leak wallet state and on-chain balances in production paths.
- One `dangerouslySetInnerHTML` in `src/components/ui/chart.tsx:83` is the standard shadcn chart-style injection — currently safe (only hardcoded color strings reach it).

## Findings table

| Severity | Title | File:line | Impact |
|---|---|---|---|
| **High** | Treasury address is build-time baked client config used as transaction recipient | `src/hooks/use-deposit.ts:23-24, 118-158` | Tampered/misconfigured build can route token approvals and deposits to attacker-controlled address |
| **High** | Proxy lacks body-size/timeout/abort propagation; default upstream is `localhost:3000` | `src/app/api/[...path]/route.ts:3, 59-77` | DoS via large bodies or slow upstream; misconfig footgun |
| **Medium** | Privy JWT logged-in state and balances printed via `console.log` in prod | `src/components/embedded-wallet-guard.tsx:33-43`, `src/hooks/use-on-chain-balance.ts:50` | Information disclosure to anyone with devtools open; fingerprinting |
| **Medium** | API responses are never validated with Zod before use | `src/lib/api.ts:233,345,658,730,808`; `src/lib/api-client.ts:58`; `src/contexts/price-context.tsx:28-34` | Compromised backend / MITM (post-CSP) can inject malformed numeric/string fields into UI and balance math |
| **Medium** | WebSocket price updates accepted as raw `Record<string, number>` with no sanity bounds | `src/contexts/price-context.tsx:28-34`; `src/lib/socket.ts` | A bad/malicious price feed propagates into USD calculations and "max" deposit logic |
| **Medium** | `localStorage` portfolio/collateral mock state uses unvalidated `JSON.parse` | `src/hooks/use-portfolio-from-storage.ts:12,41,56,83`; `src/components/portfolio/tables/data-table-assets.tsx:83-149`; `src/lib/utils.ts:232` | Local-only — material if mock mode ever ships, or if a future XSS appears |
| **Low** | `dangerouslySetInnerHTML` in chart style block | `src/components/ui/chart.tsx:83-100` | Theoretical XSS if a future caller passes user-controlled `ChartConfig.color` strings |
| **Low** | `decimals ?? 18` fallback for ERC20 amount math when backend returns `null` | `src/hooks/use-deposit.ts:74`, `src/hooks/use-on-chain-balance.ts:29,37` | If backend ever serves `decimals: null` for a non-18 token, `parseUnits` over- or under-scales the on-chain `approve`/`deposit` value |
| **Low** | CSP allows `'unsafe-inline'` and `'unsafe-eval'` for scripts | `next.config.ts:5` | Standard for Next.js + Privy SDK, but weakens XSS defense-in-depth |
| **Info** | `EmbeddedWalletGuard` does not gate routes; `AccessCodeGate` is a UI overlay, not a security boundary | `src/components/access-code-gate.tsx:13-65` | The real boundary is backend JWT verification; document this explicitly |
| **Info** | Wagmi pinned to `3.0.1` while `@privy-io/wagmi@^4.0.2` peer-depends on `wagmi >=2` | `package.json:17,54`, `pnpm-lock.yaml` | Verify only one wagmi runs at runtime (`pnpm why wagmi`) |

## Detailed findings

### H-1. Treasury address is client-bundled and used as a transaction recipient

**File:** `src/hooks/use-deposit.ts:23-24` and `:118-158`

```ts
const TREASURY_ADDRESS = process.env.NEXT_PUBLIC_TREASURY_ADDRESS as `0x${string}`;

await walletClient.writeContract({
  address: tokenAddress, abi: erc20Abi, functionName: "approve",
  args: [TREASURY_ADDRESS, depositAmount], ...
});

await walletClient.writeContract({
  address: TREASURY_ADDRESS, abi: treasuryAbi, functionName: "deposit",
  args: [tokenAddress, depositAmount], ...
});
```

**Why it matters.** `NEXT_PUBLIC_*` is baked into the client bundle at build time and shipped to every browser. The concrete attack surface:

1. If a bad actor can substitute the served JS bundle, the user signs `approve(attacker, amount)` and `deposit` against any chosen address.
2. The `as` cast hides a config bug: if `NEXT_PUBLIC_TREASURY_ADDRESS` is empty at build time, `TREASURY_ADDRESS` is the literal string `"undefined"`.
3. There is no on-chain or server-side check that the address is in fact the protocol's treasury.

**Fix.**

```ts
import { isAddress } from "viem";
if (!TREASURY_ADDRESS || !isAddress(TREASURY_ADDRESS)) {
  throw new Error("Treasury address misconfigured");
}
```

For higher assurance, fetch the canonical treasury address from a trusted backend endpoint. Consider Subresource Integrity (SRI) for production JS chunks if deploying behind an external CDN.

Confidence: **Medium-High**.

### H-2. Proxy route has no body-size cap, no timeout, and silently defaults `BACKEND_URL`

**File:** `src/app/api/[...path]/route.ts:3, 59-77`

```ts
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

const body = req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined;
const res = await fetch(targetUrl, { method: req.method, headers, body });
const responseBody = await res.text();
```

**Why it matters.**

- `await req.text()` materializes the entire request body in memory before forwarding — cheapest possible memory-exhaustion vector.
- `await res.text()` buffers the full upstream response. A misbehaving backend stalls workers.
- No `AbortController`; if upstream hangs, the worker hangs.
- Localhost fallback means a misconfigured production deploy silently tries to proxy to localhost.

**Fix.**

```ts
if (!process.env.BACKEND_URL) throw new Error("BACKEND_URL not set");
const BACKEND_URL = process.env.BACKEND_URL;

const contentLength = Number(req.headers.get("content-length") ?? 0);
const MAX_BODY = 1 * 1024 * 1024; // 1 MB
if (contentLength > MAX_BODY) {
  return NextResponse.json({ error: "Payload too large" }, { status: 413 });
}

const ac = new AbortController();
const timeout = setTimeout(() => ac.abort(), 15_000);
try {
  const upstream = await fetch(targetUrl, { method, headers, body, signal: ac.signal });
  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
  });
} finally {
  clearTimeout(timeout);
}
```

Confidence: **High** for limits/timeouts; **Medium** for the localhost fallback.

### M-1. Sensitive client state logged to the browser console in production

**Files:**

- `src/components/embedded-wallet-guard.tsx:33-43` — logs `{authenticated, walletsCount, wallets[].address, privyUserWallet}` on every wallet change.
- `src/hooks/use-on-chain-balance.ts:50` — logs raw on-chain balance, address, token address per render.
- `src/components/portfolio/tables/data-table-all-position.tsx:177` — `console.log("posiiton", position)` (typo and all).
- `src/components/select-single-token.tsx:67` — `console.log("padding", padding);`

**Why it matters.** None contain a JWT or signature. They do print live wallet addresses and balances. For DeFi this is trivial fingerprinting; it also normalizes a pattern where adding a JWT to the same log line becomes one careless commit away.

**Fix.** Strip them, gate behind `process.env.NODE_ENV === "development"`, or use a structured logger that no-ops in prod.

### M-2. API responses are not validated at runtime

**Files:** `src/lib/api.ts` (lines 233, 345, 658, 730, 808) and `src/lib/api-client.ts:58`.

```ts
const json: ApiResponse<T> = await res.json();
return json.data;
```

The TypeScript cast provides zero runtime guarantee. This data flows directly into transaction builders (e.g. `DepositToken.tokenAddress` becomes the contract `address` arg in `useDeposit`), USD-formatting, and rendered components.

**Why it matters.** Zod is already a dependency (`zod` 4.1.12) and CLAUDE.md mandates "Zod for runtime validation" — convention is not being followed. If the backend ever returns NaN, negative, missing field, or wrong shape, the UI silently misbehaves; for a DeFi UI a wrong `tokenAddress` or `decimals` is dangerous.

**Fix.** Define Zod schemas per response, call `schema.safeParse(json)` in `apiClient`, raise a typed error on failure. At minimum validate addresses with `viem.isAddress` and decimals with `z.number().int().min(0).max(36)`.

### M-3. WebSocket price feed accepted with zero validation

**Files:** `src/contexts/price-context.tsx:28-34`; `src/lib/socket.ts`.

```ts
const handleSnapshot = (snapshot: PricesMap) => { setPrices(snapshot ?? {}); };
const handleUpdate   = (update:   PricesMap) => { setPrices(update   ?? {}); };
socket.on("prices-snapshot", handleSnapshot);
socket.on("prices-update",   handleUpdate);
```

`PricesMap = Record<string, number>` is a TypeScript-only assertion. No origin check, no shape check, no bounds check. Prices flow into USD valuations across the portfolio table and "max"/"available" math in deposit/lend dialogs.

**Fix.**

```ts
import { z } from "zod";
const Price = z.number().finite().nonnegative();
const PricesMap = z.record(z.string(), Price);
const handle = (raw: unknown) => {
  const parsed = PricesMap.safeParse(raw);
  if (!parsed.success) return;
  setPrices(parsed.data);
};
```

Also pass the JWT in `socket.io`'s `auth: { token }` so the server can authenticate per-user channels later.

### M-4. Mock-mode `localStorage` JSON parsing is unvalidated and feeds UI

**Files:** `src/hooks/use-portfolio-from-storage.ts:12,41,56,83`; `src/components/portfolio/tables/data-table-assets.tsx:83-149`; `src/lib/utils.ts:232`; `src/lib/positions-adapter.mock.ts:98,182,309,347`.

`JSON.parse(stored)` is wrapped in `try/catch` (good) but the parsed object is never schema-validated before being spread into `Record<string, number>` or `Record<string, boolean>`. In real-API mode this is dead code path because mocks are gated by `NEXT_PUBLIC_USE_MOCK`. Becomes relevant if mock mode is ever shipped or a future XSS appears.

**Fix.** Replace `JSON.parse(stored)` with a Zod-validated helper (`lib/safe-storage.ts`). Refuse stored values that fail the schema and reset to defaults.

### L-1. `dangerouslySetInnerHTML` in chart styles

**File:** `src/components/ui/chart.tsx:81-101`.

The standard shadcn `ChartStyle` injector. Interpolated values are `id` (a `useId()` value) and `itemConfig.color` / `itemConfig.theme[theme]` from the `ChartConfig` object. All in-tree call sites pass hardcoded color strings or design-token references; none flow user input or API data into `color`.

**Why it matters.** Still a CSS-injection sink. A future contributor wiring an API field like `asset.brandColor` directly into `ChartConfig` would create a bona-fide stored-XSS path.

**Fix.** Add a defensive sanitizer around `color`, or render style rules through `style={{ ['--color-X']: color }}` on a wrapper `<div>` (no string interpolation).

### L-2. `decimals ?? 18` on transaction amount math

**Files:** `src/hooks/use-deposit.ts:74`; `src/hooks/use-on-chain-balance.ts:29,37`.

```ts
const decimals = token.decimals ?? 18;
const depositAmount = parseUnits(amount, decimals);
```

`DepositToken.decimals` is typed `number | null`. If the backend returns `null` for a USDC-like asset (`decimals: 6`), `parseUnits("100", 18)` produces `100 * 10^18` instead of `100 * 10^6` — `approve` and `deposit` send a value 10^12 times the user's intent.

**Fix.** Treat `decimals == null` as a hard error: `throw new Error("Token decimals unknown")`. Refuse to build the tx.

### L-3. CSP allows `'unsafe-inline'` and `'unsafe-eval'` in script-src

**File:** `next.config.ts:5`.

The default Next.js posture; required by Privy and some WalletConnect SDK paths. Worth tracking and tightening when feasible — `script-src 'self' 'nonce-...'` with hashed inline bootstrap, or per-route CSP. Not exploitable on its own; reduces defense-in-depth against any future XSS.

### Info-1. `AccessCodeGate` is a UI gate, not a security gate

**File:** `src/components/access-code-gate.tsx:13-65`.

```tsx
if (!authenticated) {
  return (<>{children}<div className="fixed inset-0 z-50 backdrop-blur-md bg-black/40" /><CentuariLoginDialog .../></>);
}
```

The children are still rendered — the gate is purely a CSS overlay. Anyone with devtools can `display: none` the overlay and interact with the underlying components. The real security boundary is the backend's JWT verification on every endpoint.

**Recommendation.** Document this boundary explicitly. Consider not rendering `{children}` at all when unauthenticated.

## Negative findings (checked and clean)

- **Path traversal in `[...path]`**: blocked. `..` and `//` are rejected (route.ts:32-37); the proxy-route test suite covers `../../etc/passwd`, encoded variants, and cloud-metadata patterns.
- **Header smuggling via proxy**: only `Authorization` and `Content-Type` are forwarded (route.ts:49-57); `Cookie`, `Host`, custom headers are dropped. Test coverage confirms.
- **Open redirect via `router.push`**: every call uses a hardcoded string literal or template string with `asset_id`. No user-controlled URLs.
- **`href={userInput}` with `javascript:` schemes**: every `href` is a constant `Link` route or a block-explorer URL built from `ACTIVE_CHAIN.blockExplorers.default.url + walletAddress/txHash`.
- **CSRF on state-changing routes**: not exploitable. Proxy doesn't forward cookies; auth uses `Authorization: Bearer` header.
- **Hardcoded secrets in source**: nothing matching `sk_`, `pk_live`, `mnemonic`, or `private_key`. Privy `appId` is a public client identifier by design.
- **`.env` git tracking**: `.env` is gitignored; only `.env.example` and `.env.build.example` are tracked, neither contains secrets.
- **Test files leaking secrets / live endpoints**: tests use mocked fetch and hardcoded fixtures.
- **Security headers** (`next.config.ts:21-56`): `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, HSTS, Referrer-Policy, Permissions-Policy, and a real CSP all set.
- **Privy JWT storage**: not in `localStorage`. Privy holds tokens in memory.
- **Image URLs from API**: bound to `<img src>` and `next/image`. CSP `img-src` is restrictive.
- **WS URL origin**: `resolveWsUrl()` hardcodes a same-origin fallback; CSP `connect-src` matches.
- **Faucet endpoint** (`src/hooks/use-faucet-drip.ts`): takes `recipientAddress` from the connected wallet, not user-typeable.

## Out of scope

- **Backend** (`BACKEND_URL`) — JWT signing key management, rate limiting, deposit confirmation logic, price-feed source.
- **Privy SDK internals** — refresh-token rotation, OAuth state-parameter generation, embedded-wallet key custody.
- **Smart contracts** (`Treasury.deposit`, matching engine, settlement). Audit separately.
- **Bundle/CDN integrity** at deploy time (SRI, signing).
- **Dependency CVE scan** — did not run `pnpm audit` / Snyk. Notable: `next@15.5.7` current; `wagmi@3.0.1` plus `@privy-io/wagmi@^4.0.2` is unusual.
