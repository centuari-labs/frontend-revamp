---
name: fix-bug
description: Fix a bug with regression testing and conditional security review.
---

# /fix-bug $ARGUMENTS

1. **Classify** — display bug, logic bug, or security issue?
2. **Security issue?** → invoke security-auditor (Opus) FIRST for blast radius before touching code
3. **Reproduce** — trace data flow, find root cause (file:line)
4. **Fix** — invoke implementer
5. **Regression test** — invoke test-writer (test must fail without fix, pass with it)
6. **Security review** — if fix touched tx/wallet/financial display → invoke security-review skill
7. **Document** — add to CLAUDE.md Gotchas if non-obvious cause. Security finding → update Security Invariants.
