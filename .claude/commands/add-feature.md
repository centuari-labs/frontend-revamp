---
name: add-feature
description: Add a new feature with security gating and mandatory tests.
---

# /add-feature $ARGUMENTS

1. **Explore** — invoke explorer agent
2. **Security gate** — touches tx/wallet/approvals/financial display? → invoke architect (Opus) for design first. Confirm with user.
3. **Load skills** — tx-builder-patterns if touching tx, financial-display-patterns if touching display
4. **Implement** — invoke implementer (Sonnet)
5. **Test** — invoke test-writer. Playwright mandatory for tx flows and financial displays.
6. **Review** — invoke security-review skill. If security gate triggered → invoke security-auditor (Opus).
7. **Fix** — all CRITICAL/HIGH before returning
8. **Report** — files changed, test results, audit verdict
