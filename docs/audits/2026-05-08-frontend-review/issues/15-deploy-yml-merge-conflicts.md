---
title: "🚨 Resolve unresolved Git merge conflict markers in `.github/workflows/deploy.yml`"
labels: ["critical", "ci-cd", "broken-build", "urgent", "bug"]
---

# Summary

`.github/workflows/deploy.yml` contains **24 unresolved Git conflict markers** (`<<<<<<<`, `=======`, `>>>>>>>`) committed to the file. The YAML is invalid and GitHub Actions will refuse to parse it. The deploy pipeline on this branch is currently broken — either silently failing on every push, or quietly running from a stale resolved version on a different branch.

This is an **operational / CI-reliability** issue, not a frontend security vulnerability — but it sits in the security-audit issue series because the consequences (e.g. resolving the conflict in favor of the test-skip-for-testnet branch) directly bypass the security mitigations every other issue depends on.

# Why it's urgent

```bash
$ grep -c "^<<<<<<<\|^=======\|^>>>>>>>" .github/workflows/deploy.yml
24
```

The file embeds two divergent visions of the deploy pipeline:

| Aspect | `staging` resolution | `testnet` resolution |
|---|---|---|
| Branches that trigger deploy | `[development, staging, main]` | `[staging, testnet]` |
| Test job (`pnpm run test`) | **runs on every branch** | **skipped on `testnet`** with comment "test suite is being fixed in a separate plan" |
| Branch → namespace map | `dev` / `staging` / `prod` | `staging` / `testing` |
| `SERVICE_NAME` shape | `frontend{-env or empty}` | `frontend-{env}` |
| Container forced-remove step | absent | present (`docker rm -f centuari-{env}-frontend`) |

If the conflict is silently resolved in favor of the `testnet` side everywhere, **testnet deploys ship without running any tests** — combined with #16 (Dockerfile skips lint + typecheck), that's a deployment with **zero quality gates**.

# Acceptance criteria

- [ ] Decide which deploy model is canonical going forward and document the decision in this issue's resolution comment. Recommended (subject to team confirmation):
  - Branch list: `[staging, main]` (drop `development` if not currently in use; drop `testnet` if it's a transitional branch).
  - Test job: **always runs**. The "test suite is being fixed" comment is not a reason to ship deploys that skip tests — gate the deploy on tests instead, or pin a `skip-flaky-tests.spec.ts` exclusion list.
  - Container force-remove step: keep (the comment says it's a legacy-bootstrap fix; cheap insurance).
  - `SERVICE_NAME` shape: `frontend-{env}` is more uniform; pick this unless prod compose file specifically expects bare `frontend`.
- [ ] All `<<<<<<<`, `=======`, `>>>>>>>` markers removed from the file.
- [ ] Run `actionlint` (or `gh workflow view deploy.yml --ref <branch>`) to verify YAML parses cleanly.
- [ ] Push to a non-prod branch first; verify the workflow run completes (or fails on a real, non-conflict reason).
- [ ] Add a CI lint step (separate small PR or part of #16): `actionlint` on every PR that touches `.github/workflows/**`. Blocks future conflict commits.
- [ ] Update `docs/plans/2026-05-01-fix-frontend-testnet-tests.md` (referenced in the conflict comment) — either close it as resolved, or capture the current status so the test-skip workaround has an audit trail.

# Files to change

- `.github/workflows/deploy.yml` — resolve conflicts
- (new, follow-up) `.github/workflows/lint-actions.yml` — `actionlint` on workflow PRs
- `docs/plans/2026-05-01-fix-frontend-testnet-tests.md` — status update

# Suggested resolution sketch

After deciding the canonical version (recommended above), the `on:`, `detect-env:`, and `test:` blocks should look roughly like:

```yaml
on:
  push:
    branches: [staging, main]
  workflow_dispatch:

jobs:
  detect-env:
    runs-on: ubuntu-latest
    outputs:
      env: ${{ steps.set.outputs.env }}
      namespace: ${{ steps.set.outputs.namespace }}
      compose_cmd: ${{ steps.set.outputs.compose_cmd }}
    steps:
      - id: set
        run: |
          case "${{ github.ref_name }}" in
            staging)
              echo "env=staging" >> $GITHUB_OUTPUT
              echo "namespace=centuari-staging" >> $GITHUB_OUTPUT
              echo "compose_cmd=docker compose -f compose.staging.yml -p centuari-staging" >> $GITHUB_OUTPUT
              ;;
            main)
              echo "env=prod" >> $GITHUB_OUTPUT
              echo "namespace=centuari" >> $GITHUB_OUTPUT
              echo "compose_cmd=docker compose -f compose.prod.yml" >> $GITHUB_OUTPUT
              ;;
            *)
              echo "Unknown branch ${{ github.ref_name }}" >&2
              exit 1
              ;;
          esac

  test:
    needs: detect-env
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm run test

  build-and-deploy:
    needs: [detect-env, test]
    # No `if: result == 'skipped'` escape hatch.
    # ...
```

If `testnet` deployments are still required as a separate environment, model them via a different workflow file (`deploy-testnet.yml`) that explicitly opts into the test-skip behaviour, with a stronger comment + an issue link describing the migration plan.

# Out of scope

- Reinstating the test suite on `testnet` (track separately under `docs/plans/2026-05-01-fix-frontend-testnet-tests.md`).
- Adding lint/typecheck steps — that's #16.
- Renaming `branches: [development, ...]` to match a final branch model — out of scope for this conflict-resolution PR; track separately if needed.

# Estimated effort

~30 minutes to resolve + verify. Block a deploy until it's done.

# Dependencies

None blocking. **Highest priority** in the audit issue series — it gates the validity of every other CI-time mitigation.

# References

- Audit: `docs/audits/2026-05-08-frontend-review/security.md` (deep-dive Round 6, C-NEW)
- Companion: #16 (re-enable lint + typecheck) — should land alongside or right after this
