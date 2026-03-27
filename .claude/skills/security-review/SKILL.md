---
name: security-review
description: >
  Pre-merge security checklist for tx logic, wallet hooks, dependencies,
  or financial display changes.
allowed-tools: Read, Grep, Bash, Glob
---

# Security Review Checklist

Run all 5 sections. Report each as CLEAR or FLAGGED with file:line.

## 1. Transaction Construction

```bash
grep -rn "writeContractAsync\|writeContract\|sendTransaction\|signTypedData" src/
```

For each: is `to` from config? Amount via `parseUnits()`? Simulation/check before sign? Receipt status verified? Canonical safe pattern: `src/hooks/use-deposit.ts`.

## 2. Injection

```bash
grep -rn "dangerouslySetInnerHTML" src/ --include="*.tsx" --include="*.ts"
# Expected ONLY in src/components/ui/chart.tsx
grep -rn "eval(\|new Function(\|innerHTML\s*=" src/ --include="*.tsx" --include="*.ts"
# Any = CRITICAL
```

Check user input flow into contract params, HTML, or URL construction.

## 3. Dependencies

```bash
grep -E '"wagmi"|"viem"|"@privy-io/react-auth"|"react"' package.json
pnpm audit 2>/dev/null || npm audit 2>/dev/null
```

Security-critical deps should be exact versions (no `^`). Report HIGH/CRITICAL audit findings.

## 4. Network & Wallet Guards

Every tx submission point: chain check present? `use-wallet-disconnect-listener.ts` handles account changes? State cleanup on disconnect?

## 5. Financial Display

HF thresholds match CLAUDE.md? Settlement fee shown before confirm? Withdrawal blocked (not warned) when HF < 1.0?

## Output

Per-section: CLEAR or FLAGGED with detail. Overall: findings by severity.
