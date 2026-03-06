---
title: Fix Deposit Flow — Approve + Treasury.deposit
type: fix
status: completed
date: 2026-03-04
brainstorm: docs/brainstorms/2026-03-04-fix-deposit-flow-brainstorm.md
---

# Fix Deposit Flow — Approve + Treasury.deposit

## Overview

Replace the broken deposit flow (raw ERC20 `transfer` to treasury) with the correct DeFi pattern: check allowance, approve if needed (MaxUint256), then call `Treasury.deposit(token, amount)`. Remove backend verify call (indexer-v2 handles event indexing). Remove mock mode from deposit hook only.

## Files to Change

| File | Change |
|------|--------|
| `frontend-revamp/abis/treasury.ts` | Add `export`, rename to `treasuryAbi` |
| `frontend-revamp/src/hooks/use-deposit.ts` | Full rewrite: approve + treasury.deposit flow |
| `frontend-revamp/src/components/centuari-deposit-dialog.tsx` | Update button states, prevent close during processing |
| `frontend-revamp/src/lib/api.ts` | Remove `verifyDeposit` function |

## Step-by-Step Implementation

### Step 1: Export Treasury ABI

**File:** `frontend-revamp/abis/treasury.ts`

Currently `const abis = [...]` with no export. Change to:

```typescript
export const treasuryAbi = [...] as const;
```

Rename from `abis` to `treasuryAbi` for clarity.

### Step 2: Rewrite `useDeposit` hook

**File:** `frontend-revamp/src/hooks/use-deposit.ts`

**New status type:**
```typescript
export type DepositStatus =
  | "idle"
  | "checkingAllowance" // reading allowance from chain (RPC call)
  | "approving"         // wallet popup for approve tx
  | "waitingApproval"   // waiting for approve tx confirmation
  | "depositing"        // wallet popup for deposit tx
  | "confirming"        // waiting for deposit tx confirmation
  | "success"
  | "error";
```

**New imports:**
- `treasuryAbi` from `@/../abis/treasury`
- `maxUint256` from `viem`
- `useAccount` from `wagmi`

**Remove imports:**
- `useAuthToken` and `getToken`
- `verifyDeposit`, `DepositResponse`, `DepositToken` from api.ts
- `USE_MOCK` from use-mock.ts

**Define local return type:**
```typescript
interface DepositResult {
  transactionHash: string;
  status: string;
}
```

**New flow (inside `deposit()` callback):**

1. Guard: `if (!address) throw new Error("Wallet not connected")`
2. Guard: `if (!publicClient) throw new Error("Public client not available")`
3. Guard: `if (!token) throw new Error("Token info is required")`
4. `setStatus("checkingAllowance")`
5. Read current allowance:
   ```typescript
   const currentAllowance = await publicClient.readContract({
     address: tokenAddress,
     abi: erc20Abi,
     functionName: "allowance",
     args: [address, TREASURY_ADDRESS],
   });
   ```
6. If `currentAllowance < parseUnits(amount, decimals)`:
   - `setStatus("approving")`
   - Call `writeContractAsync` with `erc20Abi`, `approve`, args `[TREASURY_ADDRESS, maxUint256]`
   - `setStatus("waitingApproval")`
   - `publicClient.waitForTransactionReceipt({ hash: approveTxHash, timeout: 60_000 })`
   - Check receipt not reverted
7. `setStatus("depositing")`
8. Call `writeContractAsync` with `treasuryAbi`, `deposit`, args `[tokenAddress, parseUnits(amount, decimals)]`
9. `setStatus("confirming")`
10. `publicClient.waitForTransactionReceipt({ hash: depositTxHash, timeout: 60_000 })`
11. Check receipt not reverted
12. `setStatus("success")` — return `{ transactionHash: depositTxHash, status: "confirmed" }`

**`useCallback` dependency array:** `[address, publicClient, writeContractAsync]`

**Error handling:** Keep existing pattern (detect user rejection via message matching), catch all errors and set status to `"error"`.

### Step 3: Update Deposit Dialog

**File:** `frontend-revamp/src/components/centuari-deposit-dialog.tsx`

**3a. Update `isProcessing` check:**

```typescript
const isProcessing =
  depositStatus === "checkingAllowance" ||
  depositStatus === "approving" ||
  depositStatus === "waitingApproval" ||
  depositStatus === "depositing" ||
  depositStatus === "confirming";
```

**3b. Update button labels:**

- `"checkingAllowance"` → "Checking allowance..." + spinner
- `"approving"` → "Approve in wallet..." + spinner
- `"waitingApproval"` → "Waiting for approval..." + spinner
- `"depositing"` → "Confirm deposit in wallet..." + spinner
- `"confirming"` → "Confirming deposit..." + spinner
- default → "Confirm Deposit"

**3c. Prevent dialog close during processing:**

Add to `DialogContent`:
```typescript
onInteractOutside={(e) => { if (isProcessing) e.preventDefault(); }}
onEscapeKeyDown={(e) => { if (isProcessing) e.preventDefault(); }}
```

### Step 4: Clean Up API

**File:** `frontend-revamp/src/lib/api.ts`

Remove the `verifyDeposit` function (lines 359-370). Keep `DepositResponse` interface and `submitDeposit` function (may be used by other code or needed later).

## Acceptance Criteria

- [x] Clicking "Deposit" triggers allowance check → approve (if needed) → treasury.deposit
- [x] MaxUint256 approval so subsequent deposits skip the approve step
- [x] No backend `POST /deposit/verify` call from frontend
- [x] Status labels correctly reflect each step (checking, approving, depositing, confirming)
- [x] User rejection at any wallet popup correctly shows error and resets
- [x] Dialog cannot be closed during processing (prevents orphaned transactions)
- [x] Treasury contract's `balances` mapping is updated on-chain after deposit
- [x] Mock mode removed from `use-deposit.ts` — deposit only works with real wallet
- [x] Wallet address guard prevents deposit when wallet not connected
- [x] 60s timeout on `waitForTransactionReceipt` prevents infinite hangs
- [x] `pnpm build` compiles clean in frontend-revamp

## Verification

1. `cd frontend-revamp && pnpm build` — must compile clean
2. Manual test on Arbitrum Sepolia:
   - Connect wallet (MetaMask/Rabby)
   - First deposit of a token → should prompt approve then deposit (2 wallet popups)
   - Second deposit of same token → should only prompt deposit (1 wallet popup, allowance already set)
   - Reject at approve step → error state, resets correctly
   - Reject at deposit step (after approve confirmed) → error state, resets correctly
   - Check `treasury.balanceOf(user, token)` increases on-chain after deposit

## Out of Scope (Noted for Future)

- Mock mode removal from `use-deposit-tokens.ts` and `use-deposit-balance.ts` (separate task)
- Moving `TREASURY_ADDRESS` to environment variable
- Contract error decoding (EnforcedPause, InvalidAmount → user-friendly messages)
- Amount decimal precision validation (truncate to token.decimals)
- Arbiscan link in success dialog
