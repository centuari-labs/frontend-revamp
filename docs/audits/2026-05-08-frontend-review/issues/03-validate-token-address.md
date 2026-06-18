---
title: "Validate `tokenAddress` with `viem.isAddress()` before any contract call"
labels: ["security", "critical", "area:web3", "area:deposit", "bug"]
---

# Summary

Add a runtime `isAddress()` check on `token.tokenAddress` (and any other API-served contract address used in `readContract` / `writeContract`) before signing. This is **layer 1 of the CRIT-1 mitigation** from the frontend pentest.

Part of [#0 — Token & decimals trust in deposit flow].

# Why

Currently:

```ts
// src/hooks/use-deposit.ts:75
const tokenAddress = token.tokenAddress as `0x${string}`;
```

The `as` cast is TypeScript-only — it provides zero runtime guarantee. If the backend returns:

- `undefined` → coerced to the literal string `"undefined"`,
- `null`, `""`, `"0xnotanaddress"` → silently accepted,
- a malformed hex string → passed through to viem,

`writeContract` will eventually throw, but the failure mode is a noisy late error after several `readContract` / `getBlock` round trips, not an early reject. We want a single, typed, early failure that:

- never reaches a wallet popup,
- never wastes RPC budget,
- gives the UI a clean error to render.

This is also a prerequisite for the allowlist check in issue #4 (no point allowlist-matching invalid input).

`grep -rn "isAddress" src/` currently returns 0 hits — we have **zero** address validation in source code today.

# Acceptance criteria

- [ ] In `src/hooks/use-deposit.ts`, validate `token.tokenAddress` with `viem.isAddress()` before the first `readContract` call. On failure, throw a typed error with the offending value redacted to a length prefix.
- [ ] Use `viem.getAddress()` to normalize to checksummed form after validation. Use the checksummed value for all subsequent reads/writes.
- [ ] Mirror the validation in `src/hooks/use-on-chain-balance.ts:28` (`tokenAddress: depositToken.tokenAddress as `0x${string}``).
- [ ] Replace every `as `0x${string}`` cast on API-sourced contract addresses with `assertAddress()` calls, or move the cast behind `getAddress()`.
- [ ] Vitest unit tests for the deposit hook covering: `tokenAddress = ""`, `null`, `"0xinvalid"`, valid lowercase address (should pass and be checksummed), valid checksummed address (passes through).
- [ ] `grep -rn "as \`0x\${string}\`" src/hooks src/lib` does not match unguarded API-sourced values. Build-time/env constants like `TREASURY_ADDRESS` may stay (they have separate hardening).

# Files to change

- `src/hooks/use-deposit.ts` (line 75)
- `src/hooks/use-on-chain-balance.ts` (line 28)
- Optional: `src/lib/eth-address.ts` (new) for the shared `assertAddress()` helper.
- `src/hooks/__tests__/use-deposit.test.ts`

# Suggested helper

```ts
// src/lib/eth-address.ts
import { getAddress, isAddress } from "viem";

export function assertAddress(
  value: unknown,
  context: string,
): `0x${string}` {
  if (typeof value !== "string" || !isAddress(value)) {
    throw new Error(`Invalid Ethereum address (${context})`);
  }
  return getAddress(value);
}
```

Used as:

```ts
const tokenAddress = assertAddress(token.tokenAddress, `token ${token.symbol}`);
```

# Out of scope

- Allowlist match (issue #4 — depends on this PR + #1).
- `decimals` validation (issue #2).
- On-chain `decimals()` cross-check (issue #5).
- Validating `TREASURY_ADDRESS` (it's env-sourced and tracked under audit H-1).

# Estimated effort

~3 LOC at the call sites + the helper + tests. ~30 minutes.

# Dependencies

None. Can ship immediately. **Should ideally land before #4** so the allowlist check has clean input to work with.

# References

- Epic: #0
- Audit: `docs/audits/2026-05-08-frontend-review/security.md` (CRIT-1, layer 1)
