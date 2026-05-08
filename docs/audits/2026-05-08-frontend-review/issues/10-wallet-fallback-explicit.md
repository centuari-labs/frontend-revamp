---
title: "Make wallet selection explicit — silent fallback to embedded wallet in `useDeposit`"
labels: ["security", "medium", "area:web3", "area:deposit", "ux", "bug"]
---

# Summary

`useDeposit` selects the signing wallet via `wallets.find(external matching) ?? wallets.find(privy embedded)`. If the external login wallet is missing from the `wallets` array (e.g. user switched MetaMask account after login, or browser refreshed without auto-reconnect), the deposit silently falls back to the Privy embedded wallet. Either the transaction fails opaquely (viem `from` mismatch) or — if the embedded wallet happens to hold balance — funds are pulled from the wrong wallet.

The same wallet-drift pattern silently disables the **wrong-network warning** (Round 9 finding). `useNetworkSwitch` performs the same `wallets.find(...)` lookup — when it returns `undefined`, `isWrongNetwork = false` evaluates regardless of the actual wallet state. Users on the wrong chain see no warning and may not understand why deposit fails.

# Why

Current code:

```ts
// src/hooks/use-deposit.ts:81-87
const targetWallet =
  wallets.find(
    (w) =>
      w.walletClientType !== "privy" &&
      w.address.toLowerCase() === address.toLowerCase(),
  ) ??
  wallets.find((w) => w.walletClientType === "privy");
```

Where `address = useWalletAddress()` returns the Privy *linked* address (set by SIWE for external-wallet users).

**Failure modes:**

1. **External wallet went away (refresh + no reconnect):** `wallets` only contains the embedded wallet. The `find(matching)` returns `undefined`, fallback to embedded. viem's `writeContract({ account: address })` is then asked to sign with embedded provider but `from = address` (external wallet's address). The provider rejects → tx fails with a confusing error.
2. **External wallet switched accounts:** MetaMask is now on `0xC` while Privy still thinks `0xA`. `use-wallet-disconnect-listener.ts` fires `accountsChanged` and logs out — that's the mitigation, and it works *if* the event fires. Some wallet/UA combinations skip the event on subtle state changes (rebooting MetaMask, multi-window scenarios).
3. **Embedded wallet has balance:** if the embedded wallet was funded (e.g. via faucet), the fallback path can succeed and the user signs with the wrong wallet without realizing.
4. **Network-switch warning suppressed:** `useNetworkSwitch` (`src/hooks/use-network-switch.ts:16-23`) does the same `wallets.find(walletClientType !== "privy" && matching address)` lookup. When it returns `undefined`, `isWrongNetwork = false` regardless of the actual chain state. Users whose external wallet has drifted onto the wrong chain see no "switch network" CTA; deposits fail at the chain-id mismatch in viem with a confusing error.

The viem `from` check bounds the worst case to "tx fails or signs with embedded" — not a direct attacker-controlled drain. But the **silent** part is the problem: there is no "couldn't find your wallet, please reconnect" UI moment. The `??` swallows the mismatch.

# Acceptance criteria

- [ ] `useDeposit` no longer silently falls back. If the user logged in via SIWE (external wallet) and the matching external wallet is not in the `wallets` array, throw a typed `WalletUnavailableError` *before* prompting the wallet popup, with a UI-actionable message ("Please reconnect your MetaMask wallet").
- [ ] The fallback to embedded wallet only happens for users whose Privy account is *not* linked to an external wallet — i.e., social/email login users where `embedded` is the intended signer.
- [ ] Detection: use `user.linkedAccounts.some(a => a.type === "wallet" && walletClientType !== "privy")` to determine whether external-wallet was the login method (same heuristic used in `use-wallet-disconnect-listener.ts`).
- [ ] **`useNetworkSwitch` updated**: when external login is expected (`linkedAddr` set) but `loginWallet` is `undefined`, treat `isWrongNetwork = true` and surface the same "Reconnect wallet" CTA. Do not let drift silently suppress the warning.
- [ ] UI surfaces the error with a "Reconnect wallet" CTA — wire to `centuari-connect-wallet` flow. Both `useDeposit` and `useNetworkSwitch` consume the same UI slot.
- [ ] Vitest covering:
  - external-login user + missing external wallet in `wallets` → throws, no `writeContract` call.
  - external-login user + matching external wallet → proceeds, signs with external.
  - social-login user + only embedded wallet → proceeds, signs with embedded.
- [ ] Manual test: log in with MetaMask, switch MetaMask account *without* triggering `accountsChanged` (e.g., via account dropdown), refresh, click deposit → expect explicit reconnect prompt.

# Files to change

- `src/hooks/use-deposit.ts` (lines 81-87, plus error handling above the `writeContract` calls)
- `src/hooks/use-network-switch.ts` (lines 16-23, treat `loginWallet === undefined` as wrong-network when external login expected)
- `src/components/centuari-deposit-dialog.tsx` — render the new `WalletUnavailableError` with a Reconnect CTA
- `src/components/wrong-network-banner.tsx` (or wherever the wrong-network warning is rendered) — surface drifted-wallet state with the same CTA
- `src/hooks/__tests__/use-deposit.test.ts` — extend
- `src/hooks/__tests__/use-network-switch.test.ts` (new or extended) — assert the drift case

# Suggested patch sketch

```ts
// use-deposit.ts
import { usePrivy } from "@privy-io/react-auth";

// inside the hook:
const { user } = usePrivy();

// inside mutationFn:
const isExternalLogin = user?.linkedAccounts?.some(
  (a) => a.type === "wallet" && (a as { walletClientType?: string }).walletClientType !== "privy",
);

const matchingExternal = wallets.find(
  (w) =>
    w.walletClientType !== "privy" &&
    w.address.toLowerCase() === address.toLowerCase(),
);

const embedded = wallets.find((w) => w.walletClientType === "privy");

let targetWallet;
if (isExternalLogin) {
  if (!matchingExternal) {
    throw new WalletUnavailableError(
      "Your login wallet is not connected. Please reconnect to continue.",
    );
  }
  targetWallet = matchingExternal;
} else {
  if (!embedded) {
    throw new WalletUnavailableError("No signing wallet available.");
  }
  targetWallet = embedded;
}
```

`WalletUnavailableError` should be a typed error class — surface it in the dialog UI distinctly from generic errors so we can offer a Reconnect button.

# Out of scope

- A full audit of every `accountsChanged` event firing across wallet implementations. Browser/wallet matrix.
- Adding a periodic poll for wallet drift — `accountsChanged` is the right primary mechanism.
- The same logic in any future `useWithdraw` / `useRepay` that ever signs on-chain (today they're backend POSTs; not relevant).

# Estimated effort

~25 LOC + tests + UI plumbing. 2-3 hours.

# Dependencies

None hard. Plays well with #03 (address validation) which would also flow through this code path.

# References

- Audit: `docs/audits/2026-05-08-frontend-review/security.md` (deep-dive Round 3, M-7)
- Existing mitigation (partial): `src/hooks/use-wallet-disconnect-listener.ts`
- Similar logic note: `embedded-wallet-guard.tsx:64-67` ("login wallet is activated on-demand when the user initiates a transaction")
