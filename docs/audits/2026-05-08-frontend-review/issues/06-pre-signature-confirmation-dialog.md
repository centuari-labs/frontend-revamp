---
title: "Add in-app pre-signature confirmation dialog for deposit"
labels: ["security", "ux", "area:web3", "area:deposit", "enhancement"]
---

# Summary

Before triggering the wallet popup for `approve` / `deposit`, render an in-app confirmation modal that shows — in plain language — exactly what the user is about to sign: amount, token symbol, token contract, spender (Centuari Treasury), and the action. Defense-in-depth on top of #1–#5.

Part of [#0 — Token & decimals trust in deposit flow].

# Why

Wallet popups (MetaMask, Rabby, embedded Privy wallet) show transaction calldata in hex or in a partially-decoded form. Most users skip-read them. If everything else in #1–#5 fails — e.g. a future contributor inadvertently bypasses the allowlist, or a new code path is added that re-introduces the trust — the user has no remaining defense.

A 1-second in-app modal that says:

> **You are about to approve Centuari Treasury to spend 100 USDC.**
> Token contract: `0xa0b8…eB48`
> Spender: `0x1234…5678` (Centuari Treasury)

…catches the cases where the human can spot what the code missed. It also reduces accidental misclicks ("Did I just approve?" — explicit confirmation removes the ambiguity).

# Acceptance criteria

- [ ] New component `src/components/centuari-tx-confirm-dialog.tsx` rendered immediately before `walletClient.writeContract` for both the `approve` and `deposit` steps in `useDeposit`.
- [ ] Modal displays:
  - Action verb: **"Approve"** or **"Deposit"**.
  - Human-readable amount + symbol (formatted via existing currency utilities).
  - Token contract address (truncated, with click-to-copy for the full value).
  - Spender / target address (truncated, labeled — e.g. "Centuari Treasury").
  - Network name + chain ID, sourced from `ACTIVE_CHAIN`.
  - Cancel / Continue buttons. Default focus on Cancel (safer default).
- [ ] On Cancel, the deposit mutation rejects with a typed `UserCancelled` error; no wallet popup is triggered. The dialog UI returns to the normal deposit form (not the success/error state).
- [ ] On Continue, the wallet popup fires immediately. Do not double-confirm.
- [ ] The values shown come from the **post-validation** state — i.e. the allowlisted address (from #4) and the on-chain decimals (from #5), not the raw API values.
- [ ] Keyboard accessibility: Esc cancels, Enter does NOT auto-confirm (require explicit click on Continue).
- [ ] Pass `centuari-` prefix and CLAUDE.md component rules: file kebab-case, component PascalCase, props extend `ComponentProps`, < 300 LOC.
- [ ] Visual fidelity: matches the existing dialog visual language (reuses `Dialog` primitives, design tokens).
- [ ] Vitest + RTL tests:
  - Renders the formatted amount, symbol, and addresses.
  - Cancel rejects the mutation with `UserCancelled`.
  - Continue triggers `writeContract`.
- [ ] Playwright happy-path covers: open deposit dialog → enter amount → submit → confirmation modal appears with correct values → continue → success.

# Files to change

- `src/components/centuari-tx-confirm-dialog.tsx` (new)
- `src/hooks/use-deposit.ts` (wire dialog into the flow; signal continue/cancel via a Promise)
- `src/components/centuari-deposit-dialog.tsx` (mount the confirm dialog as a sibling step)
- `src/__tests__/components/centuari-tx-confirm-dialog.test.tsx` (new)
- Possibly `e2e/deposit.spec.ts`

# Design notes

- The dialog is a **gate**, not a status display. Keep copy short and unambiguous.
- Prefer a single primary copy block ("You are about to approve…"). Avoid multi-tab UI.
- For `approve`, surface allowance amount = exactly `depositAmount` (already correct in code; just reflect it). For `deposit`, surface the same amount and the destination.
- Do not show the raw calldata hex — that is the wallet's job. The point of the dApp's modal is to be the human-friendly version.

# Out of scope

- A generic "transaction preview" component for other flows (lend/borrow/withdraw) — track separately if needed.
- Localization. Ship in English; i18n is a separate concern.
- Simulating the transaction outcome via `eth_call` / `simulateContract` — useful but a bigger change. Track separately.

# Estimated effort

~150 LOC component + wiring + tests. 1 day including review.

# Dependencies

- **Blocks on #1–#5** so that the values shown in the dialog are the trusted/validated ones.

# References

- Epic: #0
- Audit: `docs/audits/2026-05-08-frontend-review/security.md` (CRIT-1 + CRIT-2, layer 3)
