---
name: review-pr
description: PR review with risk classification. Runs /security-review for critical paths.
---

# /review-pr $ARGUMENTS

1. **Classify changes** — critical path (tx/wallet/approvals/financial display/deps) vs standard
2. **Security** — run /security-review on all changed files (includes Opus audit for critical path)
3. **Code quality** — TypeScript strict, component patterns, hook patterns per CLAUDE.md
4. **Test coverage** — new tx/financial flow without Playwright test = blocks merge
5. **Verdict** — APPROVE (zero CRITICAL/HIGH, tests present) or REQUEST CHANGES
