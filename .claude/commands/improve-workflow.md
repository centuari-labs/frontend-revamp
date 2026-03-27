---
name: improve-workflow
description: Quarterly audit of workflow infrastructure. Run when new model ships.
---

# /improve-workflow

1. **Skills** — triggers accurate? Checklists complete?
2. **Tests** — `pnpm run test` passing? E2E backlog in CLAUDE.md up to date?
3. **Security** — new DeFi frontend attack vectors? New CVEs for React/wagmi/viem/Privy?
4. **Dependencies** — `pnpm audit`. Flag HIGH/CRITICAL. Check security-critical dep versions.
5. **Models** — agent model strings current? (claude-sonnet-4-6, claude-opus-4-6)
6. **Propose** — present changes to user for confirmation
7. **Apply** — implementer (Sonnet) edits approved changes. Pure file edits only.
