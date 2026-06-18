# Brainstorm: Deposit Feature (Arbitrum Sepolia)

**Date:** 2026-03-02
**Status:** Draft

---

## What We're Building

A real deposit flow in the existing navbar dialog (`centuari-deposit-dialog.tsx`). User selects a token from the `assets` table, sees their on-chain ERC20 balance, enters an amount (<= balance), and executes an ERC20 `transfer` to a central vault address.

**Scope:**
- Arbitrum Sepolia only (hide chain selector entirely)
- Token list fetched from backend `assets` table (not hardcoded)
- Show user's on-chain ERC20 balance for the selected token
- Amount validation: must be <= user's token balance
- Transaction: standard ERC20 `transfer(vaultAddress, amount)`
- No backend portfolio update for now (manual/later)

---

## Why This Approach

**ERC20 transfer to central vault** is the simplest deposit mechanism. No custom vault contract ABI needed — just the standard ERC20 ABI (`balanceOf`, `decimals`, `transfer`). The vault address is stored as a frontend env var (`NEXT_PUBLIC_VAULT_ADDRESS`).

**Frontend-driven transaction** — the user's wallet signs the `transfer` directly. No approve step needed (unlike a vault contract that pulls tokens). No backend involvement in the tx itself.

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Deposit mechanism | ERC20 `transfer` to vault | No custom contract needed, standard ERC20 |
| Chain | Arbitrum Sepolia only | Testnet phase; hide chain selector |
| Token list source | Backend `assets` table | Real token addresses + decimals from DB |
| Balance display | On-chain `balanceOf` via wagmi | Real-time user wallet balance |
| Vault address | `NEXT_PUBLIC_VAULT_ADDRESS` env var | Central vault, configurable per environment |
| UI | Upgrade existing navbar dialog | No new routes needed |
| Backend update after deposit | Not now | Will implement indexer/notification later |

---

## Technical Design

### Frontend Changes

1. **ERC20 ABI** — Add minimal ERC20 ABI (`balanceOf`, `decimals`, `transfer`) at `src/abis/erc20.ts`

2. **Token list from backend** — Fetch deposit-eligible tokens from backend API (reuse existing assets/tokens endpoint or add new one). Each token needs: `symbol`, `name`, `tokenAddress`, `decimals`, `imageUrl`

3. **Balance hook** — `hooks/use-token-balance.ts` using wagmi `useReadContract` to call `balanceOf(userAddress)` on the selected token's contract. Auto-refresh on block or interval.

4. **Deposit hook** — `hooks/use-deposit.ts` using wagmi `useWriteContract` to call `transfer(vaultAddress, amount)` on the ERC20. Manages status: idle → loading → success → error. Follows `use-faucet-drip.ts` pattern.

5. **Upgrade dialog** — Refactor `centuari-deposit-dialog.tsx`:
   - Remove chain selector (only Arbitrum Sepolia)
   - Replace hardcoded token list with backend-fetched assets
   - Show user's on-chain balance for selected token
   - Validate amount <= balance
   - Wire submit to real ERC20 transfer
   - Keep mock mode support (`USE_MOCK`)

### Backend Changes

- Ensure tokens/assets endpoint returns `tokenAddress` and `decimals` fields
- No new endpoints needed for the deposit tx itself

### Environment Variables

- `NEXT_PUBLIC_VAULT_ADDRESS` — Central vault address on Arbitrum Sepolia

---

## Open Questions

None — all key decisions have been made.

---

## Out of Scope

- Backend portfolio update after deposit (future: indexer or frontend notification)
- Multi-chain support (future: production launch with Arbitrum mainnet)
- Withdraw feature upgrade (separate task)
- Transaction history tracking
