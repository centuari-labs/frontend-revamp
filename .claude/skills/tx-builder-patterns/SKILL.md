---
name: tx-builder-patterns
description: >
  Read when building or modifying contract interaction hooks.
  Safe transaction construction patterns for this codebase.
allowed-tools: Read, Write, Edit, Glob
---

# Transaction Builder Patterns

## Canonical pattern
Read `src/hooks/use-deposit.ts` — the ONLY file with on-chain transactions. All new interactions MUST follow it.

## Flow summary
1. Validate: address connected, publicClient available, token info present
2. Parse: `parseUnits(amount, token.decimals)` — never hardcode decimals
3. Check allowance: `readContract` → ERC20 allowance
4. Estimate gas: 1.5x buffer on baseFee (`BigInt(150) / BigInt(100)`)
5. Approve if needed: **exact amount** (`depositAmount`), NEVER `MaxUint256`
6. Wait approval receipt + check `status !== "reverted"`
7. Re-estimate gas (base fee may change during approval)
8. Execute: `writeContractAsync` with `TREASURY_ADDRESS` from env config
9. Wait receipt + check `status !== "reverted"`
10. Confirm with backend: `confirmDeposit(txHash, jwt)`
11. Invalidate TanStack Query caches

## Address resolution
- `TREASURY_ADDRESS` from `process.env.NEXT_PUBLIC_TREASURY_ADDRESS` — ONLY source
- Chain: `ACTIVE_CHAIN` from `lib/chain-config.ts` (arbitrum or arbitrumSepolia)

## ABIs
`import { treasuryAbi } from "@/../abis/treasury"` · `import { erc20Abi } from "viem"`

## Status tracking
Type: `"idle" | "checkingAllowance" | "approving" | "waitingApproval" | "depositing" | "confirming" | "success" | "error"`

## What to show user before signing
Every tx flow MUST display before the wallet prompt: contract being called (e.g. "Treasury"), action (e.g. "Deposit"), token amount (EXACT match to what `writeContractAsync` sends), and fee estimate. The wallet (MetaMask/Privy) shows its own confirmation, but the app shows details FIRST.

## Never do
- `to` from user input · Skip simulation · `MaxUint256` approval · Skip receipt check · Hardcode decimals · Skip gas re-estimation · Skip network check
