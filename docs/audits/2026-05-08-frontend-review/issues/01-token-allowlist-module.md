---
title: "Add hardcoded token allowlist module (`lib/token-allowlist.ts`)"
labels: ["security", "area:web3", "area:deposit", "chore"]
---

# Summary

Introduce `src/lib/token-allowlist.ts` as the single source of truth for which ERC20 token contracts the frontend trusts on each chain. **Foundation work — no behavior change in this PR.** Subsequent issues (#4, #6) will read from this module to validate API responses and render confirmations.

Part of [#0 — Token & decimals trust in deposit flow].

# Why

Today, `useDeposit` accepts whatever `tokenAddress` the backend returns and passes it straight into `writeContract`. Adding runtime validation only helps if we have something authoritative to validate against. A hardcoded allowlist:

- moves trust from "backend response" to "git-tracked, code-reviewed file",
- gives us a place to record canonical addresses per chain,
- is what subsequent issues will check against.

# Acceptance criteria

- [ ] New file `src/lib/token-allowlist.ts` exports:
  - `TOKEN_ALLOWLIST: Readonly<Record<number, Readonly<Record<string, `0x${string}`>>>>` keyed by `chainId` → `symbol (UPPERCASE)` → checksummed address.
  - `getAllowlistedTokenAddress(chainId: number, symbol: string): `0x${string}` | undefined`.
  - `isAllowlistedToken(chainId: number, symbol: string, address: string): boolean` — uses `viem.getAddress` to compare checksums; returns `false` for invalid addresses.
- [ ] Initial entries cover every symbol currently served by `getDepositTokens()` on the active chain (testnet). Confirm by running the app, hitting `/api/deposit/...`, and recording each `{symbol, tokenAddress}` pair.
- [ ] Inline source comments next to each address citing where it was verified (block explorer URL or contract deploy commit). One-liner per token, no essays.
- [ ] No runtime imports of this file yet; downstream wiring lands in #4.
- [ ] Vitest: `src/lib/__tests__/token-allowlist.test.ts` covering:
  - exact-match (checksummed) → `true`
  - lowercase variant of allowlisted address → `true` (via `getAddress` normalization)
  - different address, same symbol → `false`
  - unknown chainId → `undefined` / `false`
  - malformed address input → `false` (no throw)

# Files to change

- **New:** `src/lib/token-allowlist.ts`
- **New:** `src/lib/__tests__/token-allowlist.test.ts`

# Suggested skeleton

```ts
// src/lib/token-allowlist.ts
import { getAddress, isAddress } from "viem";

// Key: chainId → symbol (UPPERCASE) → checksummed contract address.
// Source these from: deployment commits, block explorer, or the on-chain
// registry. NEVER from API responses.
export const TOKEN_ALLOWLIST = {
  // ARB Sepolia testnet — placeholder, replace with real addresses
  421614: {
    USDC: "0x...",
    IDRX: "0x...",
    XSGD: "0x...",
  },
} as const satisfies Record<number, Record<string, `0x${string}`>>;

export function getAllowlistedTokenAddress(
  chainId: number,
  symbol: string,
): `0x${string}` | undefined {
  return TOKEN_ALLOWLIST[chainId as keyof typeof TOKEN_ALLOWLIST]?.[
    symbol.toUpperCase()
  ];
}

export function isAllowlistedToken(
  chainId: number,
  symbol: string,
  address: string,
): boolean {
  if (!isAddress(address)) return false;
  const expected = getAllowlistedTokenAddress(chainId, symbol);
  if (!expected) return false;
  return getAddress(expected) === getAddress(address);
}
```

# Out of scope

- Wiring this into `useDeposit` (issue #4).
- Mainnet entries (do separately when mainnet config lands).
- A "warn on unknown symbol" UI (issue #6 will handle the user-visible side).

# Estimated effort

~30 LOC + tests. Half a day including verifying each address from block explorer.

# Dependencies

None. Can ship immediately.

# References

- Epic: #0
- Audit: `docs/audits/2026-05-08-frontend-review/security.md` (CRIT-1 in pentest re-grade)
