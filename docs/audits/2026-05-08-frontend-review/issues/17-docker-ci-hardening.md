---
title: "Docker / CI hardening bundle — `.dockerignore`, `USE_MOCK` guard, non-root user, digest pin, EIP-6963 spoof display, e2e wallet const"
labels: ["medium", "low", "ci-cd", "hardening", "cleanup"]
---

# Summary

Six small Docker / CI / supply-chain hardening items bundled into one PR. None is a vulnerability today; collectively they remove footguns and reduce surface area. Each is sub-30-LOC; separate PRs would be more review noise than the changes themselves.

The six items:

1. `.dockerignore` — exclude `.env`, `docs/`, `e2e/`, `playwright-report/`, `coverage/` (Medium).
2. CI guard for `NEXT_PUBLIC_USE_MOCK !== "false"` in production deployments (Medium).
3. Dockerfile — drop privileges with `USER node` (Low).
4. Dockerfile — pin base image with digest, not just tag (Low).
5. EIP-6963 detected wallet UI — show `info.rdns` alongside `info.name` to mitigate extension-spoofing confusion (Low).
6. e2e tests — dedupe `TEST_WALLET = 0x63f7...1298` constant across 3 files (Low / cleanup).

# Item 1 — `.dockerignore` exclusions (Medium)

**File:** `.dockerignore`

Today:

```
node_modules
.next
.git
.vscode
npm-debug.log
*.log
```

Dockerfile then does `COPY . .` — anything not in `.dockerignore` ends up in the final image. Risks:

- **`.env`**: in CI it's not present (clean). For developer-built local images (testing, sandbox), `.env` is typically present and gets baked in. Local images can leak Privy app id, treasury address, RPC URL, WS URL. None are hard secrets, but a layered hardening rule.
- **`docs/`**: ships internal documentation including the security audit (this folder!) into production images. Image bloat + information disclosure if image is leaked.
- **`e2e/`**: Playwright specs aren't needed at runtime. ~40 KB.
- **`playwright-report/`**: test artifacts. Image bloat.
- **`coverage/`**: test coverage HTML. Image bloat + reveals code structure.

**AC:** add to `.dockerignore`:

```
node_modules
.next
.git
.vscode
.github
.env
.env.local
.env.*.local
docs/
e2e/
playwright-report/
coverage/
*.log
*.md
```

(`*.md` excludes top-level READMEs etc. If a runtime feature reads `package.json` or a markdown — none does today — re-add.)

# Item 2 — CI guard for `NEXT_PUBLIC_USE_MOCK` (Medium)

**File:** `.github/workflows/deploy.yml`

Currently:

```yaml
--build-arg NEXT_PUBLIC_USE_MOCK='${{ vars.NEXT_PUBLIC_USE_MOCK }}'
```

If `vars.NEXT_PUBLIC_USE_MOCK` is set to `"true"` for the production environment in GitHub (typo in admin UI, copy-paste from staging, etc.), the production bundle ships with mock-data hooks active. Audit M-4 (`localStorage` JSON unvalidated parsing) was downgraded on the assumption that mock mode never ships. This Dockerfile/CI does not enforce that assumption.

**AC:** add a gate step before `docker build`:

```yaml
- name: Refuse to build prod with mocks enabled
  if: needs.detect-env.outputs.env == 'prod'
  run: |
    if [ "${{ vars.NEXT_PUBLIC_USE_MOCK }}" != "false" ]; then
      echo "::error::NEXT_PUBLIC_USE_MOCK must be 'false' for prod builds (got: '${{ vars.NEXT_PUBLIC_USE_MOCK }}')"
      exit 1
    fi
```

Also add the inverse for staging if staging is ever expected to be mock-only — the rule should be explicit, not implicit.

Optional follow-up: add a runtime check at app boot that asserts `process.env.NEXT_PUBLIC_USE_MOCK !== "true"` AND `window.location.hostname` matches a prod allowlist; throws a visible error if both are true. Defense-in-depth.

# Item 3 — `USER node` in Dockerfile (Low)

**File:** `Dockerfile`

Container currently runs as root. The `node:22-alpine` image already includes a non-root `node` user by convention.

**AC:** add before `CMD`:

```dockerfile
# Drop to non-root user. The `node` user/group exists in the official Node images.
RUN chown -R node:node /app
USER node
```

Verify: `pnpm start` works as `node` (it should — no privileged port binding; 3200 is unprivileged).

# Item 4 — Pin base image with digest (Low)

**File:** `Dockerfile`

Today:

```dockerfile
FROM node:22-alpine AS builder
FROM node:22-alpine AS runner
```

`node:22-alpine` is a tag, not a digest. The image content can change underneath you. If the registry is compromised — or if the official image is updated and ships a regression — your builds silently change.

**AC:** pin both stages to a specific digest:

```dockerfile
FROM node:22-alpine@sha256:<digest> AS builder
FROM node:22-alpine@sha256:<digest> AS runner
```

Find the current digest with `docker pull node:22-alpine && docker inspect --format='{{index .RepoDigests 0}}' node:22-alpine`. Refresh the digest on a known cadence (Renovate / Dependabot supports this).

# Item 5 — Display EIP-6963 `rdns` (Low)

**File:** `src/components/centuari-connect-wallet.tsx` (or wherever the detected-wallet list is rendered)

`useDetectedWallets` (`src/hooks/use-detected-wallets.ts`) trusts the `info.rdns` field of any extension that fires `eip6963:announceProvider`. A malicious extension can announce with `name: "MetaMask"` and `rdns: "fake.attacker"` and the user UI today only shows `info.name` — easy to confuse.

**AC:** in the wallet picker UI, show `info.rdns` next to (or under) `info.name`:

```tsx
<div className="flex items-center gap-2">
  <img src={wallet.info.icon} alt="" />
  <div>
    <div className="font-medium">{wallet.info.name}</div>
    <div className="text-xs text-muted-foreground font-mono">{wallet.info.rdns}</div>
  </div>
</div>
```

This doesn't *prevent* extension spoofing (browsers can't), but gives users a second identifier to verify against.

# Item 6 — Dedupe e2e `TEST_WALLET` constant (Low / cleanup)

**Files:**

- `e2e/lend-limit-order.spec.ts:3`
- `e2e/helpers/api.ts:8` (uses `process.env.LENDER_WALLET || "0x63f7..."`)
- `e2e/helpers/api.ts:11` (uses `"0x63f7..."` again)

The address is public (no private key). Just duplicated.

**AC:** introduce `e2e/helpers/constants.ts`:

```ts
export const DEFAULT_TEST_WALLET = "0x63f799163222e9CfC4afbddE7a632599AE0F1298";
```

Replace the three sites. `e2e/helpers/api.ts:8` keeps the `process.env.LENDER_WALLET || DEFAULT_TEST_WALLET` fallback pattern.

# Acceptance criteria (whole PR)

- [ ] All six items completed.
- [ ] `docker build .` succeeds (manual smoke).
- [ ] `docker run` starts the app as `node` user (`docker exec ... whoami` returns `node`).
- [ ] CI fails build if `NEXT_PUBLIC_USE_MOCK !== "false"` is set for prod environment (tested via a workflow-dispatch with deliberately-wrong vars).
- [ ] `actionlint .github/workflows/deploy.yml` passes (assumes #15 has resolved conflict markers).
- [ ] Wallet picker UI manual-test: install two wallet extensions, verify both names + rdns are shown.
- [ ] `pnpm run test:e2e` passes after the constants refactor.

# Out of scope

- Renovate / Dependabot configuration for digest refresh — set up separately when convenient.
- Switching base image from Alpine to Debian-slim — separate decision (Alpine has musl quirks but smaller).
- A general supply-chain audit (npm provenance, sigstore, SLSA) — out of scope.
- Anything that requires runtime infrastructure changes beyond Dockerfile + workflow.

# Estimated effort

Infrastructure: ~1-2 hours total across all 6 items. Most are 1-line edits. Item 5 (UI change) is the largest at ~10 LOC.

# Dependencies

- Item 2 (CI guard) depends on **#15** — adding workflow steps to a file with conflict markers is pointless.
- Items 1, 3, 4, 5, 6 are independent.

# References

- Audit: `docs/audits/2026-05-08-frontend-review/security.md` (deep-dive Round 6, M-NEW-1, M-NEW-2, L-NEW-1, L-NEW-2, L-NEW-3, L-NEW-4)
- Forward-looking playbook: `docs/audits/2026-05-08-frontend-review/forward-looking-hardening.md` (§9 dependency confusion is adjacent)
