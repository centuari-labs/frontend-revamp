---
title: "Cross-check on-chain `decimals()` before approve/deposit"
labels: ["security", "area:web3", "area:deposit", "enhancement"]
---

# Summary

Before signing the first `approve`, read the token contract's on-chain `decimals()` value and compare it to the API-served `token.decimals`. Throw on mismatch. This is **layer 2 of the CRIT-2 mitigation** — defense in depth on top of #2.

Part of [#0 — Token & decimals trust in deposit flow].

# Why

#2 prevents the backend from returning `null`/garbage decimals. It does not prevent the backend from returning a *plausible-but-wrong* decimals value (e.g. `18` for a token whose real `decimals()` is `6`).

The on-chain `decimals()` view is the canonical source of truth. We're already making one `readContract` call (`allowance`) before signing — adding `decimals` is one more lightweight read on the same code path. The cost is one RPC round trip per deposit; the benefit is closing the last semantic-validation gap on the deposit amount.

This also catches inadvertent backend mistakes (e.g. a migration that flips USDC to 18 decimals) without requiring an audit of every backend change.

# Acceptance criteria

- [ ] In `useDeposit`, after the existing `allowance` read but before the `approve` call, read `decimals()` from the token contract via `publicClient.readContract`.
- [ ] If the on-chain value differs from the validated `token.decimals` (from #2), throw a typed error and emit a security log event (same channel as #4's "address mismatch") with `{ tokenAddress, symbol, apiDecimals, onChainDecimals }`.
- [ ] Use the on-chain value (the trusted one) for `parseUnits`, not the API value. Recompute `depositAmount` after the on-chain read.
- [ ] Cache the on-chain read for the duration of the mutation (do not re-read between approve and deposit; the value cannot change).
- [ ] Vitest:
  - on-chain decimals matches API decimals → deposit proceeds.
  - on-chain decimals differs from API decimals → throws, never reaches `writeContract`.
  - `readContract` fails (RPC error) → surfaces as a "could not verify token" error, not a generic crash.

# Files to change

- `src/hooks/use-deposit.ts`
- `src/hooks/__tests__/use-deposit.test.ts`

# Suggested patch sketch

```ts
const onChainDecimals = await publicClient.readContract({
  address: tokenAddress, // allowlisted address from #4
  abi: erc20Abi,
  functionName: "decimals",
});

if (onChainDecimals !== token.decimals) {
  reportSecurityEvent("token_decimals_mismatch", {
    tokenAddress,
    symbol: token.symbol,
    apiDecimals: token.decimals,
    onChainDecimals,
  });
  throw new Error(`Decimals mismatch for ${token.symbol}`);
}

const depositAmount = parseUnits(amount, onChainDecimals);
```

# Performance notes

- Adds one `readContract` call per deposit (same chain client, same RPC). Already negligible vs the `getBlock` and `waitForTransactionReceipt` calls in the same code path.
- We could memoize per `(chainId, tokenAddress)` for the session, but the cost is so low that the simpler "always read once per deposit" is fine. Don't optimize prematurely.

# Out of scope

- A reactive on-chain registry for token metadata (out of scope; allowlist is enough).
- Cross-checking `symbol()` on chain — `symbol` is display-only, not signed; not worth an extra read.

# Estimated effort

~10 LOC + 3 unit tests. ~1 hour.

# Dependencies

- **Blocks on #2** (so the API decimals are already validated; this PR adds the on-chain second opinion).
- **Blocks on #3** (so `tokenAddress` is already a valid address before we read from it).
- Best landed after #4 so the `tokenAddress` we read from is the allowlisted one.

# References

- Epic: #0
- Audit: `docs/audits/2026-05-08-frontend-review/security.md` (CRIT-2, layer 2)
