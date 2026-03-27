---
name: write-e2e-tests
description: Write Playwright E2E tests for a flow. Mandatory for every new tx flow.
---

# /write-e2e-tests $ARGUMENTS

1. Load playwright-patterns skill
2. Invoke explorer to find flow components, hooks, existing tests
3. Invoke test-writer — cover: happy path, user rejects, API failure, wrong network, loading states, financial value correctness
4. Run `npx playwright test [file]` — all must pass
5. Report: file location, flows covered, coverage added
