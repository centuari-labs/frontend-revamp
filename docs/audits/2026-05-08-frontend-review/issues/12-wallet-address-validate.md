---
title: "Validate Privy-sourced wallet addresses with `isAddress()` in `useWalletAddress`"
labels: ["security", "medium", "area:web3", "bug"]
---

# Summary

`useWalletAddress` returns a `0x${string}` to callers (including `useDeposit`) by `as`-casting Privy SDK output. Three cast sites have no `isAddress()` validation. Privy is a trusted vendor so this rarely surfaces in practice, but it is the only address-validation gap left after issue #03 lands and is the same vulnerability class as CRIT-1 — closing it brings the code path to "all addresses validated at the boundary".

# Why

```ts
// src/hooks/use-wallet-address.ts
const privyAddress = user?.wallet?.address;
if (privyAddress) return privyAddress as `0x${string}`;  // ← no isAddress

const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
if (embeddedWallet) return embeddedWallet.address as `0x${string}`;  // ← no isAddress

return wallets[0]?.address as `0x${string}` | undefined;  // ← no isAddress
```

The return value flows into:

- `useDeposit` → `account: address` parameter to `walletClient.writeContract` (deposit address tells viem who is signing).
- `useDeposit` allowance check `args: [address, TREASURY_ADDRESS]` (reads the user's allowance).
- Many balance / display hooks.

Privy *should* always return a valid hex address, but:

- Defensive coding posture: every address that flows into `writeContract` should be validated at the boundary, regardless of source.
- This is the same pattern as CRIT-1 (`tokenAddress as 0x${string}` from API). Issue #03 introduces the `assertAddress()` helper. Reusing it here closes the matching gap on the wallet-identity side.
- A bug or version drift in the Privy SDK that returned an unexpected shape would surface as a confusing late error in viem; an early `assertAddress()` gives a clean failure with an actionable message.

# Acceptance criteria

- [ ] `useWalletAddress` calls `assertAddress()` (from issue #03) on each address before returning. If validation fails, return `undefined` rather than throwing — callers already handle the undefined case.
- [ ] If validation fails, log a `console.error` with `{ source: "privy" | "embedded" | "wallets[0]", value: redacted }` so the SDK drift is visible.
- [ ] Vitest:
  - Privy returns a valid address → returned as checksummed.
  - Privy returns an invalid address (`""`, `"0xnope"`, `null`) → falls through to embedded.
  - All sources invalid → returns `undefined`.
- [ ] No new TypeScript `any` or `as` casts introduced.
- [ ] Smoke test: deposit flow, balance display, faucet, and login flows all still work end-to-end.

# Files to change

- `src/hooks/use-wallet-address.ts`
- `src/lib/eth-address.ts` (introduced by issue #03 — reuse `assertAddress`)
- `src/hooks/__tests__/use-wallet-address.test.ts` (new)

# Suggested patch sketch

```ts
import { isAddress, getAddress } from "viem";

function safeAddress(value: unknown): `0x${string}` | undefined {
  if (typeof value !== "string" || !isAddress(value)) return undefined;
  return getAddress(value);
}

export function useWalletAddress(): `0x${string}` | undefined {
  const { user } = usePrivy();
  const { wallets } = useWallets();

  const privy = safeAddress(user?.wallet?.address);
  if (privy) return privy;

  const embedded = wallets.find((w) => w.walletClientType === "privy");
  const embeddedAddr = safeAddress(embedded?.address);
  if (embeddedAddr) return embeddedAddr;

  return safeAddress(wallets[0]?.address);
}
```

If issue #03 already introduced an `assertAddress` helper, prefer the soft `safeAddress` variant here (returns undefined instead of throwing) since callers gracefully handle the undefined case.

# Out of scope

- Privy SDK version pinning / behavior auditing — out of scope.
- Replacing every other `as \`0x${string}\`` cast in the codebase — issue #03 already requires that for API-sourced addresses; this issue handles the Privy-sourced ones. Build-time env addresses (`TREASURY_ADDRESS`) are tracked separately under audit H-1.

# Estimated effort

~10 LOC + 1 helper reuse + tests. ~30 minutes.

# Dependencies

- Soft dependency on **#03** (`assertAddress` / `eth-address.ts` helper). Can land independently if you inline a `safeAddress` variant; preferred to share the helper.

# References

- Audit: `docs/audits/2026-05-08-frontend-review/security.md` (deep-dive Round 3, M-9)
- Related: issue #03 (validate API-sourced `tokenAddress`)
- Same vuln class as CRIT-1, applied to wallet identity instead of token contract identity.
