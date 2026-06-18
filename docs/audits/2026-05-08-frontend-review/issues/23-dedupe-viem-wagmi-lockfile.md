---
title: "Dedupe `viem` (and verify `wagmi`) version resolution in `pnpm-lock.yaml`"
labels: ["medium", "supply-chain", "area:web3", "chore"]
---

# Summary

`pnpm-lock.yaml` resolves `viem` to **three different versions** simultaneously:

```
viem@2.23.2
viem@2.36.0
viem@2.43.3
```

Despite `viem: "^2.39.3"` declared in `package.json`. Different code paths in the runtime end up importing different copies of the library. For a Web3 app where viem owns chain interaction (RPC formatting, error decoding, type guards, address checksumming), inconsistent library copies are a class of bug that's hard to reproduce in dev but bites at the edges (e.g., one chunk computes `getAddress` checksums via 2.23.2 rules, another via 2.43.3 — minor differences in error throws can break catch blocks).

Combined with the existing **wagmi 3.0.1 + @privy-io/wagmi@^4** observation (audit Info-tier), the dApp's effective chain-interaction surface code is split across multiple package copies. This issue tracks deduplication.

# Why

```bash
$ grep "^  viem@" pnpm-lock.yaml
  viem@2.23.2:
  viem@2.36.0:
  viem@2.43.3:
```

Each transitive consumer (likely: direct `viem` dep, `wagmi`, `@privy-io/react-auth`, `@privy-io/wagmi`) brings its own viem range, and pnpm hoists the highest-compatible version per consumer rather than collapsing to one. The result is multiple `node_modules/.pnpm/viem@*` entries, each contributing to the bundle.

Concrete failure modes:

- **Type incompatibility**: `WalletClient` in 2.23 may not be assignable to `WalletClient` in 2.43. TypeScript catches this at the boundary, but at runtime the structural typing means objects flow through.
- **Behavior drift**: viem changed `parseUnits` rounding semantics between minor versions; if `useDeposit` resolves 2.43 and a helper resolves 2.23, the same input could produce different BigInts.
- **Bundle bloat**: shipping three viem copies means ~150-300 KB of duplicate code in the production JS bundle. Affects Time-to-Interactive.
- **Audit drift**: a security advisory against viem 2.23 might not be surfaced by `pnpm audit` if 2.43 is the "primary" version, even though 2.23 is still being shipped.

The `wagmi` situation is similar:
- `wagmi: "3.0.1"` (pinned, not caret) in package.json.
- `@privy-io/wagmi: "^4.0.2"` peer-depends on `wagmi: ">=2"`.
- Worth confirming both resolve to the same version at runtime, or document the dual-install if intentional.

# Acceptance criteria

- [ ] Run `pnpm why viem` and capture the output. Identify which packages bring in each version.
- [ ] Run `pnpm why wagmi` and confirm there is exactly one resolved version.
- [ ] Add an `overrides` block to `package.json` to dedupe viem to a single version:

  ```json
  "pnpm": {
    "overrides": {
      "viem": "^2.43.3"
    }
  }
  ```

  Pin to whichever version the direct dep currently resolves to. Adjust if any consumer breaks (test must catch this — see #16).

- [ ] Run `pnpm dedupe` after the override; verify lockfile shows a single `viem@*` entry.
- [ ] If a transitive dep breaks (peer-dep mismatch), file the upstream PR or scope the override more narrowly.
- [ ] Verify bundle size before/after with `pnpm build` + a quick `du -sh .next/static/chunks/*.js | sort -h` snapshot.
- [ ] No regression in unit tests, e2e tests, or manual smoke (deposit, withdraw, faucet, login flow).
- [ ] Document the dedupe choice with a comment in `package.json` near the override:

  ```json
  // viem 2.x — dedupe across direct dep + wagmi + Privy SDK transitives.
  // Audit 2026-05-08 found 3 versions resolved simultaneously.
  "pnpm": { "overrides": { "viem": "^2.43.3" } }
  ```

# Files to change

- `package.json` (add `pnpm.overrides`)
- `pnpm-lock.yaml` (regenerated)

# Out of scope

- Auditing each viem version for known CVEs — `pnpm audit` should surface any. If found, prioritize the fix in this PR.
- Wagmi major-version bump (3 → ?) — separate decision; v3 is the current latest in this codebase's stack.
- Bundle-size optimization beyond dedupe — track under audit PERF-C2 (`react-nextjs.md`).

# Estimated effort

~5 LOC + verification. ~30-60 minutes including a clean rebuild and bundle-size diff.

# Dependencies

- Best landed *after* #16 (typecheck restored) so any type-incompatibility surfaced by the dedupe is caught at build time.

# References

- Audit: `docs/audits/2026-05-08-frontend-review/security.md` (deep-dive Round 10, M-NEW-11)
- Lockfile excerpt confirming triple resolution: `pnpm-lock.yaml` (search `^  viem@`)
- Existing Info-tier note on wagmi dual install: same audit doc, "Wagmi pinned to 3.0.1 while @privy-io/wagmi^4 peer-depends on wagmi >=2"
