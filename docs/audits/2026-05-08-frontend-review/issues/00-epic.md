---
title: "[Epic] Critical — Token & decimals trust in deposit flow"
labels: ["security", "critical", "epic", "area:web3", "area:deposit"]
---

# Summary

The deposit flow in `useDeposit` trusts API-served contract metadata (token address, decimals) without runtime validation. A backend compromise — or a single corrupted API row — can cause users to:

1. Sign `approve` and `Treasury.deposit` against an attacker-chosen ERC20 contract (**CRIT-1**), or
2. Over-approve and over-transfer their balance by a factor of up to 10¹² because of a missing-decimals fallback (**CRIT-2**).

Both attacks are realistic with **only backend access** — no CDN/build tampering, no user-device compromise, no unlimited approvals. Approve amounts are correctly bounded to `depositAmount`, but `depositAmount` itself is computed from untrusted data.

This epic tracks the layered defense:

- **Layer 1** — refuse invalid input at the boundary (issues #2, #3).
- **Layer 2** — pin contract metadata to a hardcoded allowlist + on-chain cross-check (issues #1, #4, #5).
- **Layer 3** — surface a human-readable confirmation in the dApp before the wallet popup (issue #6).

Audit source: [`docs/audits/2026-05-08-frontend-review/security.md`](../security.md), Critical re-grade in conversation with Claude.

# Threat model

| Vector | Realistic? | Today's defense | Post-epic defense |
|---|---|---|---|
| Backend swaps `tokenAddress` for an attacker contract | Yes — single point of failure (`app-testnet-api.centuari.finance`) | None | Allowlist + isAddress (#3, #4) |
| Backend swaps `tokenAddress` for a different real ERC20 the user holds (asset-confusion) | Yes — same as above | None | Allowlist (#4) |
| Backend returns `decimals: null` or wrong decimals (drains by unit confusion) | Yes — one-bit corruption | `?? 18` fallback (vulnerable) | Hard-reject (#2) + on-chain check (#5) |
| User misreads wallet hex preview and signs anyway | Yes — most users skip | None | In-app confirmation modal (#6) |
| `TREASURY_ADDRESS` swap via build-time env tampering | Lower bar — needs CI/CD or CDN access | Build pipeline trust | Out of scope for this epic; tracked separately under H-1 (`security.md`) |

# Sub-issues (dependency order)

1. [x] #1 — Add hardcoded token allowlist module
2. [x] #2 — Reject invalid ERC20 `decimals` from API
3. [x] #3 — Validate `tokenAddress` with `viem.isAddress()`
4. [x] #4 — Reject `tokenAddress` not in allowlist before sign  *(depends on #1, #3)*
5. [x] #5 — Cross-check on-chain `decimals()` before approve  *(depends on #2, #3)* — closed 2026-05-15
6. [x] #6 — Add in-app pre-signature confirmation dialog  *(depends on #1–#5)* — closed 2026-05-15

#1, #2, #3 can ship in parallel. After they merge, #4 and #5 can ship in parallel. #6 last.

# Acceptance criteria for epic close

- [x] All sub-issues closed.
- [x] `useDeposit` no longer trusts API-served `tokenAddress` or `decimals` without:
  - syntactic validation (`isAddress`, `decimals` is a sane integer)
  - allowlist match against a hardcoded, audited table
  - on-chain cross-check of `decimals()`
- [x] Pre-signature confirmation modal shows: human-readable amount, symbol, token contract, spender, action — and lets the user cancel before the wallet popup.
- [x] Test coverage: unit tests for allowlist mismatch, invalid-decimals rejection, on-chain mismatch rejection. E2E happy-path still passes.
- [ ] CHANGELOG / release note mentions the hardening (no exploit narrative needed publicly).

# Out of scope

- Treasury address hardening (tracked under `security.md` H-1).
- Backend response Zod validation more broadly (tracked under M-2; this epic only addresses the deposit-path subset that signs transactions).
- Smart-contract audit of the Treasury whitelist behavior (separate engagement).
- Mainnet vs testnet allowlist split — start with the active chain set; expand later.

# Notes

- The approve amount is currently `depositAmount` (bounded), not `MaxUint256` — that's already correct. The vulnerability is **what `depositAmount` resolves to**, not the spender allowance pattern.
- viem's `writeContract({ chain: ACTIVE_CHAIN })` will refuse to sign if the wallet is on a different chain. That defense is already in place; no chainId issue to track here.
