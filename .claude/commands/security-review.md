---
name: security-review
description: Security review on changed files. Use for standalone review or before merge.
---

# /security-review $ARGUMENTS

1. **Classify** — each file as critical path (tx/wallet/approvals/financial display/deps) or standard
2. **Run security-review skill** (5-section checklist) on all changed files
3. **Critical path?** → invoke security-auditor agent (Opus). No exceptions.
4. **Report** — findings by severity (CRITICAL/HIGH block merge)
5. **Fix** — all CRITICAL/HIGH before approval
6. **Update CLAUDE.md** — new attack vector → Security Invariants. New pattern → Gotchas.
