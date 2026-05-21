# Frontend Pentest — Issues

27 issues total: 1 tracking epic, 6 sub-issues for the Critical deposit-flow trust gap, 20 standalone fixes from deeper pentest passes — including 1 Critical operational, 3 High, 12 Medium, 2 Low bundles, 1 preventive hardening, 1 tracking/info.

> **Status (2026-05-15):** Epic group #1–#6 (deposit-flow trust) is closed. Standalone #15 + #16 (CI floor) closed 2026-05-14. Next up: #7, #18, #22, #25 per [`hub-only.html`](../../../../../dev-docs/architecture-html/launches/hub-only.html) §4 Phase 2.

## Files

### Epic + sub-issues — deposit-flow trust (Critical)

| File | Title | Severity | Depends on |
|---|---|---|---|
| [`00-epic.md`](./00-epic.md) | [Epic] Critical — Token & decimals trust in deposit flow | tracking | — |
| [`01-token-allowlist-module.md`](./01-token-allowlist-module.md) | Add hardcoded token allowlist module (`lib/token-allowlist.ts`) | foundation | — |
| [`02-reject-invalid-decimals.md`](./02-reject-invalid-decimals.md) | Reject invalid ERC20 `decimals` from API | **Critical** | — |
| [`03-validate-token-address.md`](./03-validate-token-address.md) | Validate `tokenAddress` with `viem.isAddress()` | **Critical** | — |
| [`04-allowlist-wiring.md`](./04-allowlist-wiring.md) | Reject `tokenAddress` not in allowlist | **Critical** | #1, #3 |
| [`05-onchain-decimals-check.md`](./05-onchain-decimals-check.md) | Cross-check on-chain `decimals()` before approve | High | #2, #3 |
| [`06-pre-signature-confirmation-dialog.md`](./06-pre-signature-confirmation-dialog.md) | In-app pre-signature confirmation dialog | High (UX defense) | #1–#5 |

### Standalone

| File | Title | Severity | Depends on |
|---|---|---|---|
| [`07-proxy-path-prefix-bypass.md`](./07-proxy-path-prefix-bypass.md) | Tighten proxy path allowlist — `market`/`deposit`/`withdraw` allow arbitrary suffix | **High** | — |
| [`08-faucet-authenticate.md`](./08-faucet-authenticate.md) | Authenticate the faucet drip endpoint — `requestFaucetTokens` skips JWT | Medium | — |
| [`09-fee-logic-divergence.md`](./09-fee-logic-divergence.md) | Fee logic divergence — dialogs over-display limit fees by 2× | Medium | — |
| [`10-wallet-fallback-explicit.md`](./10-wallet-fallback-explicit.md) | Make wallet selection explicit — silent fallback to embedded in `useDeposit` | Medium | — |
| [`11-apiclient-fetch-consistency.md`](./11-apiclient-fetch-consistency.md) | Migrate 3 endpoints to `apiClient` (skip `AuthError` retry today) | Medium | — |
| [`12-wallet-address-validate.md`](./12-wallet-address-validate.md) | Validate Privy-sourced wallet addresses with `isAddress()` in `useWalletAddress` | Medium | soft #3 |
| [`13-low-severity-cleanup.md`](./13-low-severity-cleanup.md) | Low-severity cleanup bundle (5 items) — dead code, headers, env strictness | Low | — |
| [`14-nextjs-config-hardening.md`](./14-nextjs-config-hardening.md) | Harden `next.config.ts` image config + CI guard for Next.js version pin | Low (preventive) | soft #13 |
| [`15-deploy-yml-merge-conflicts.md`](./15-deploy-yml-merge-conflicts.md) | 🚨 Resolve unresolved Git merge conflict markers in `deploy.yml` | **Critical (operational)** | — |
| [`16-restore-lint-typecheck.md`](./16-restore-lint-typecheck.md) | Re-enable ESLint + TypeScript checks in CI and Docker build | **High** | #15 |
| [`17-docker-ci-hardening.md`](./17-docker-ci-hardening.md) | Docker / CI hardening bundle (`.dockerignore`, USE_MOCK guard, USER node, digest pin, EIP-6963 rdns, e2e dedup) | Medium + Low | partial #15 |
| [`18-apr-units-roundtrip-bug.md`](./18-apr-units-roundtrip-bug.md) | APR units inconsistent across normalizer / display / updater — likely live 100× bug | **High** | — |
| [`19-mapstatus-fail-loud-on-unknown.md`](./19-mapstatus-fail-loud-on-unknown.md) | `mapStatus` silently coerces unknown order statuses to `"OPEN"` | Medium | — |
| [`20-verify-dev-token-disabled-prod.md`](./20-verify-dev-token-disabled-prod.md) | Verify backend `DEV_TOKEN_<wallet>` auth path is disabled in production | Info (backend coordination) | — |
| [`21-orderbook-trades-decimals-default.md`](./21-orderbook-trades-decimals-default.md) | `useOrderbook` / `useRecentTrades` should not render with default `decimals = 6` | Medium | soft #18 |
| [`22-health-factor-calculation-bundle.md`](./22-health-factor-calculation-bundle.md) | Health factor: fix Infinity-from-API + reconcile borrow/repay formula divergence | Medium | soft #16 |
| [`23-dedupe-viem-wagmi-lockfile.md`](./23-dedupe-viem-wagmi-lockfile.md) | Dedupe `viem` (and verify `wagmi`) version resolution in `pnpm-lock.yaml` | Medium | soft #16 |
| [`24-borrow-form-silent-validation.md`](./24-borrow-form-silent-validation.md) | Replace silent validation gates: borrow form, withdraw dialog, maturity dropdown | Medium | — |
| [`25-tokenlist-hardcoded-prices.md`](./25-tokenlist-hardcoded-prices.md) | Hardcoded prices in `lib/portfolio-data.ts` mis-value IDRX (16 000×) and XSGD (35%); plus `amend-dialog.tsx` second source-of-truth | **High** | soft #16 |
| [`26-submit-proof-dialog-half-built.md`](./26-submit-proof-dialog-half-built.md) | `SubmitProofDialog` Submit button has no handler; dropzone has no size/count bounds | Medium | — |

## Submission order

**Epic group** (#1–#6): #1, #2, #3 ship in parallel (independent). After they merge, #4 and #5 ship in parallel. #6 last.

**Standalone** (#7–#26):

- **Ship #15 FIRST**: it's a Critical operational fix that unblocks every other workflow change (#16, #17 item 2).
- After #15, ship #16 (lint + typecheck restoration + tsconfig hardening). Together with #15 these form the CI quality-gate floor; #16 also catches the kind of regression that #18, #22, #23, and #25 are live examples of.
- #7–#14 and #17–#26 are otherwise independent. Soft deps: #12 → #3 (shared `assertAddress`), #14 → #13 (overlapping `remotePatterns`), #17 item 2 → #15 (workflow editing), #18/#19/#22/#23/#25 prefer #16 (typecheck would have caught), #21 prefers #18 (same files; combine if convenient), #24 and #26 independent.
- #20 is **tracking only** — verification with backend, no frontend code change.

```
  CI critical path                              Epic group
  ┌──────────┐                                   ┌──────────┐  ┌──────────┐  ┌──────────┐
  │  #15 🚨  │ resolve workflow conflicts        │   #1     │  │   #2     │  │   #3     │
  └────┬─────┘                                   └────┬─────┘  └────┬─────┘  └────┬─────┘
       │                                              │             │             │
  ┌────▼─────┐                                        └─────┬───────┴─────────────┤
  │   #16    │ re-enable lint + typecheck                   │                     │
  └────┬─────┘                                         ┌────▼─────┐          ┌────▼─────┐
       │                                               │   #4     │          │   #5     │
       │ (gates everything below)                      └────┬─────┘          └────┬─────┘
       ▼                                                    │                     │
                                                            └──────────┬──────────┘
                                                                       │
                                                                  ┌────▼─────┐
                                                                  │   #6     │
                                                                  └──────────┘

  Standalone (any order, independent of each other):
    #7  #8  #9  #10  #11  #12  #13  #14  #17  #18  #19  #20  #21  #22  #23  #24  #25  #26
                          ↑         ↑    ↑    ↑    ↑         ↑    ↑    ↑         ↑
                          soft #3   #13  #15  ⤴ five (#18/#19/#22/#23/#25)        ⤴
                                                  prefer #16                       soft #16
                                                  (typecheck)
                                                                ↑
                                              #20 is tracking-only —
                                              backend verification
```

## Submit to GitHub

`gh` CLI is required. Install + auth first:

```bash
brew install gh
gh auth login
```

Then run:

```bash
./create-issues.sh
```

The script creates all 27 issues (1 epic, 6 sub-issues, 20 standalone), captures their numbers, edits the epic body to link the real sub-issue numbers, and prints a summary table at the end. Re-running is safe only if you delete or close the previous issues first — the script does not deduplicate.

## Manual submission

If you prefer the GitHub UI: the body of each `*.md` file in this folder is ready to paste. Copy everything below the YAML front-matter (the `---` block at the top) into the issue description, and use the `title:` and `labels:` from the front-matter for the issue's title and label set.

## After issues are created

- Add them to the appropriate project board / sprint.
- The epic (#0) tracks the dependency graph; close it once all six sub-issues are closed.
- Cross-link the epic from the security audit doc (`../security.md`) once you have the real issue number.

## Severity rollup

| Severity | Count | Files |
|---|---|---|
| Critical (security) | 3 | #2, #3, #4 |
| Critical (operational) | 1 | #15 |
| High | 6 | #5, #6, #7, #16, #18, #25 |
| Medium | 11 | #8, #9, #10, #11, #12, #19, #21, #22, #23, #24, #26 |
| Medium + Low (bundle, 6 items) | 1 | #17 |
| Low (bundle, 7 items) | 1 | #13 |
| Low (preventive) | 1 | #14 |
| Info (backend coordination) | 1 | #20 |
| Foundation | 1 | #1 |
| Tracking | 1 | #0 (epic) |
