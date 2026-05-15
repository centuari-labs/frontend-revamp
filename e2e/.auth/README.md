# e2e Privy session capture

Real Privy sessions for the local-dev E2E run. The capture file `privy.json` is gitignored — it contains real auth tokens.

## What lives here

| File | Tracked | Purpose |
|---|---|---|
| `.gitkeep` | yes | Keeps the directory in git |
| `README.md` | yes | This runbook |
| `privy.json` | **no** (gitignored) | Captured browser context: cookies + localStorage for the authenticated Privy session |

## How capture works

The app's login flow uses Privy's programmatic SIWE (`useLoginWithSiwe` in [`centuari-connect-wallet.tsx`](../../src/components/centuari-connect-wallet.tsx)) plus an auto-connect `useEffect` in [`centuari-wallet-list.tsx:69-74`](../../src/components/centuari-wallet-list.tsx) that fires SIWE whenever wagmi reports a connected wallet but Privy hasn't authenticated yet. [`capture-privy-session.ts`](../capture-privy-session.ts) leans on that auto-flow:

1. Injects an EIP-6963 mock wallet provider into the page, backed by a hardcoded test private key (Anvil dev key #0 — well-known, holds zero funds anywhere). Wallet address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` (viem-canonical EIP-55 form).
2. `page.exposeFunction` bridges the in-page mock to viem in Node so SIWE messages get signed with a real ECDSA signature.
3. Privy detects the announced EIP-6963 provider on page load, wagmi auto-connects, and the SIWE handshake runs through `eth_requestAccounts` → `wallet_switchEthereumChain` → `personal_sign` automatically — no clicks needed.
4. Privy validates the signature, creates a session, writes cookies + localStorage.
5. Playwright persists the browser context to `e2e/.auth/privy.json`.

No human interaction required.

## Prerequisites

- Frontend dev server running at `http://localhost:3200` (`pnpm dev`).
- Backend / matching-engine / settlement-engine / indexer-v3 either running or fully mocked (the collateral spec mocks every `/api/*` route at the test level — the backend is not strictly required for it).

## Capture

```bash
cd frontend-revamp
pnpm test:e2e:capture
```

Headless. ~5-15s on a warm dev server.

## Verify

```bash
pnpm test:e2e -- --project=setup
```

Pass = session is valid. Fail = re-capture.

## Re-capture cadence

Privy session TTL is per-account; expect roughly monthly cadence in practice. Re-capture triggers:

- `auth.setup.ts` fails with "Login Required gate visible"
- Tests intermittently land on the login page despite valid storage state
- Privy SDK is upgraded and the cookie/localStorage shape changes

Re-capture is the same one-liner — no human in the loop.

## Security

- `privy.json` is gitignored via [`frontend-revamp/.gitignore`](../../.gitignore). Confirm with `git status` after capturing — the file must not appear in tracked changes.
- The test private key in `capture-privy-session.ts` is well-known. Anyone with it can authenticate as `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` against Centuari's Privy app. Acceptable for testnet-only auth fixtures because this wallet holds zero funds and has zero privileges. **Do not** use the same key for any wallet that holds funds, points, or privileged roles.
- Do not store the captured JSON in CI secrets without a separate threat-model review. CI E2E is intentionally deferred (see hub-only-launch-plan.md Track B1).
