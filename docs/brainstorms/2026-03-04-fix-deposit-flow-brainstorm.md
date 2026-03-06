# Fix Deposit Flow: Approve + Treasury.deposit

**Date:** 2026-03-04
**Status:** Ready for Planning

## What We're Building

Replace the current broken deposit flow (raw ERC20 `transfer` to treasury address) with the correct smart contract pattern: **ERC20 approve** followed by **Treasury.deposit(token, amount)**.

### Current (Broken) Flow
```
User clicks Deposit
  → ERC20.transfer(treasuryAddress, amount)    // raw transfer, bypasses Treasury contract
  → waitForTransactionReceipt
  → POST /deposit/verify (backend credits balance)
```

The Treasury contract's `balances` mapping is never updated on-chain. The backend handles accounting off-chain.

### New (Correct) Flow
```
User clicks Deposit
  → Check ERC20.allowance(user, treasuryAddress)
  → If insufficient: ERC20.approve(treasuryAddress, MaxUint256)
  → Wait for approve tx confirmation
  → Treasury.deposit(tokenAddress, amount)
  → Wait for deposit tx confirmation
  → Done (indexer-v2 picks up Deposited event and credits balance)
```

## Why This Approach

- **On-chain accounting**: Treasury contract's `balances` mapping is properly updated, enabling on-chain verification of user deposits
- **Standard DeFi pattern**: approve + deposit is the industry-standard ERC20 interaction pattern
- **Indexer-based verification**: `indexer-v2` listens for `Deposited` events, eliminating the need for frontend-to-backend verify calls
- **Single-click UX**: User clicks once; the hook handles allowance check, approval, and deposit automatically

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Approve amount | Unlimited (MaxUint256) | One-time approval per token, smoother UX for repeat deposits |
| UX pattern | Single click | Auto-check allowance → approve if needed → deposit. Shows step-by-step progress |
| Backend verify | Remove | indexer-v2 handles `Deposited` event indexing |
| Mock mode | Remove | Devs use testnet; no simulated deposit flow |
| Status states | `idle → approving → depositing → confirming → success` | Reflects the actual on-chain steps |

## Scope

### Files to Modify
- `frontend-revamp/src/hooks/use-deposit.ts` — Core change: replace `transfer` with `approve` + `treasury.deposit`
- `frontend-revamp/src/components/centuari-deposit-dialog.tsx` — Update status messages/UI for new flow steps
- `frontend-revamp/src/lib/api.ts` — Remove `verifyDeposit` function (no longer needed)

### Files to Use (No Changes)
- `frontend-revamp/abis/treasury.ts` — Import Treasury ABI for contract calls
- `frontend-revamp/src/lib/chain-config.ts` — Treasury address already defined as `TREASURY_ADDRESS`

### Files That May Need Updates
- `frontend-revamp/src/hooks/use-deposit-balance.ts` — May need to adjust polling or remove if indexer handles balance updates differently

## Implementation Notes

- The Treasury ABI at `frontend-revamp/abis/treasury.ts` exports the full ABI with `deposit(address token, uint256 amount)` function
- `TREASURY_ADDRESS` is already hardcoded in `use-deposit.ts` as `0x122ea513fE68d78CdAD06F982237B1b67a335439`
- wagmi's `useWriteContract` can be reused for both `approve` and `deposit` calls
- `erc20Abi` from viem already has `approve` and `allowance` functions
- The `Deposited(user, token, amount)` event is emitted by the Treasury contract on successful deposit

## Resolved Questions

- **Backend verify needed?** No — indexer-v2 handles event indexing
- **Approve UX?** Single click with automatic allowance check
- **Approve amount?** Unlimited (MaxUint256) per token
- **Mock mode?** Remove it, use testnet only
