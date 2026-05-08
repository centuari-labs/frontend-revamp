---
title: "Reject `tokenAddress` not in allowlist before any deposit signing"
labels: ["security", "critical", "area:web3", "area:deposit", "bug"]
---

# Summary

Wire the token allowlist from #1 into `useDeposit`. Reject any deposit where the API-served `(symbol, tokenAddress)` pair does not match the allowlisted entry for the active chain. This is **layer 2 of the CRIT-1 mitigation** from the frontend pentest.

Part of [#0 — Token & decimals trust in deposit flow].

# Why

After #3 lands, `tokenAddress` is guaranteed to be a syntactically valid Ethereum address. That alone doesn't help — a backend compromise could return a *valid* address that points to an attacker contract or a different ERC20 the user holds (asset-confusion attack: user clicks "deposit USDC" but actually approves WBTC).

Pinning every signed contract call to a hardcoded, code-reviewed allowlist removes the backend from the trust chain for contract identity. Backend can still tell us *what to display*; it cannot redirect *what we sign*.

# Acceptance criteria

- [ ] `useDeposit` calls `isAllowlistedToken(ACTIVE_CHAIN.id, token.symbol, token.tokenAddress)` (from #1) before the first `readContract`. On `false`, throw a typed error and never reach the wallet popup.
- [ ] When the allowlist *has* an entry but the address doesn't match, the thrown error distinguishes "unknown symbol" from "address mismatch" (the latter is the high-signal indicator of tampering and should be logged).
- [ ] Use the **allowlisted** address for the contract calls, not the API-served one. The API value is now used only to detect mismatch, never trusted directly.
- [ ] Vitest:
  - `tokenAddress` matches allowlist → deposit proceeds (mock `writeContract`).
  - `tokenAddress` differs from allowlist for same symbol → throws "address mismatch", never calls `writeContract`.
  - `symbol` not in allowlist → throws "unknown token", never calls `writeContract`.
- [ ] When the error is "address mismatch" (the tampering signal), an analytics/log event is emitted with `{ chainId, symbol, expected, received }` so SecOps can detect and alert. (Use whatever logger the team already wires; do not introduce a new vendor.)
- [ ] **Smoke test for the auto-select widening (Round-10 follow-up):** `centuari-deposit-dialog.tsx:54-58` auto-selects `tokens[0]` once the API list loads. After this issue lands, manually serve a deliberately-corrupted `tokens` list (via DevTools network override, MITM-style intercept, or a backend feature flag) where the first entry has a tokenAddress NOT in the allowlist. Confirm:
  - Dialog rejects the auto-selected token (renders an explicit "Unknown / unsupported token" message instead of silently letting the user enter an amount).
  - User cannot reach the deposit submit path while a non-allowlisted token is selected.
  - No `writeContract` call fires in the network tab.

# Files to change

- `src/hooks/use-deposit.ts`
- `src/hooks/__tests__/use-deposit.test.ts`

# Suggested patch sketch

```ts
import { ACTIVE_CHAIN } from "@/lib/chain-config";
import { getAllowlistedTokenAddress, isAllowlistedToken } from "@/lib/token-allowlist";
import { assertAddress } from "@/lib/eth-address"; // from #3

const apiAddress = assertAddress(token.tokenAddress, `token ${token.symbol}`);

if (!isAllowlistedToken(ACTIVE_CHAIN.id, token.symbol, apiAddress)) {
  const expected = getAllowlistedTokenAddress(ACTIVE_CHAIN.id, token.symbol);
  if (!expected) {
    throw new Error(`Unknown token: ${token.symbol}`);
  }
  // Tampering signal — log and refuse
  reportSecurityEvent("token_address_mismatch", {
    chainId: ACTIVE_CHAIN.id,
    symbol: token.symbol,
    expected,
    received: apiAddress,
  });
  throw new Error(`Token address mismatch for ${token.symbol}`);
}

// Use the allowlisted address from here on, not the API value.
const tokenAddress = getAllowlistedTokenAddress(ACTIVE_CHAIN.id, token.symbol)!;
```

# Out of scope

- The allowlist module itself (issue #1).
- Address syntactic validation (issue #3).
- Decimals validation (issue #2 / #5).
- A SecOps alerting pipeline — this issue only requires the log event to be emitted with the right payload. Routing it is separate work.

# Estimated effort

~10 LOC + 3 unit tests + verifying error messages render in the dialog. ~1–2 hours.

# Dependencies

- **Blocks on #1** (allowlist module must exist).
- **Blocks on #3** (so `tokenAddress` is already validated when this code runs).
- Independent of #2 and #5.

# References

- Epic: #0
- Audit: `docs/audits/2026-05-08-frontend-review/security.md` (CRIT-1, layer 2)
