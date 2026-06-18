---
title: "Re-enable ESLint + TypeScript checks in CI and Docker build"
labels: ["high", "ci-cd", "build", "type-safety", "bug"]
---

# Summary

Production builds currently ship with **zero static-analysis gates**. The Dockerfile sets `NEXT_DISABLE_ESLINT=1` and `NEXT_DISABLE_TYPECHECK=1`, and `package.json` does not expose a `lint` or `typecheck` script. CI runs `pnpm run test` (vitest) which does not type-check by default. A contributor can introduce `as any` / `@ts-ignore` / unused `null!` / compile-blocking errors and the Docker build will succeed.

This invalidates the implicit "TypeScript strict catches the bug at build time" assumption that several Critical / High mitigations in this audit rely on (CRIT-1's `assertAddress` flow, CRIT-2's decimals validation, M-9's wallet-address validation, etc.).

# Why this is High

CLAUDE.md mandates **strict TypeScript** and "no `any`, no `@ts-ignore`". Today that's an honor-system rule — the build pipeline does not enforce it. The result is a lulling effect: code reviewers trust that "if it compiles, the types check out", but the production pipeline is not actually compiling for type errors.

Concrete failure modes:

- A contributor silences a "Property 'tokenAddress' does not exist on type 'unknown'" error with `(token as any).tokenAddress` to ship a feature. Issue #03's `assertAddress` enforcement is now bypassed for this code path; the audit doesn't catch it because tests don't fail; CI doesn't catch it because typecheck is disabled.
- Renaming `decimals` to `tokenDecimals` in the API layer and forgetting to update one consumer. Vitest passes (mocks return both names). Production receives a different shape; `parseUnits(amount, undefined)` throws at runtime — only on the user's deposit click.
- Breaking change in a Privy SDK type signature after `pnpm update`. Build silently passes; runtime breaks for users on email login.

The pattern is: **type-safety regressions become user-facing runtime errors instead of CI failures**. For a DeFi app, that's a Critical class of bug masquerading as type-safety hygiene.

# Acceptance criteria

- [ ] `package.json` adds two scripts:
  - `"lint": "biome check src/"` (project uses Biome 2.2.6)
  - `"typecheck": "tsc --noEmit"`
- [ ] CI (`.github/workflows/deploy.yml` per #15, or a new `lint.yml`) runs both `pnpm run lint` and `pnpm run typecheck` **before** `pnpm run test`. All three must pass for the deploy job to start.
- [ ] `Dockerfile` removes `ENV NEXT_DISABLE_ESLINT=1` and `ENV NEXT_DISABLE_TYPECHECK=1`. The two protections are restored; if Next.js's lint/typecheck during `next build` is too slow, run them as separate CI steps and keep them disabled in Docker (CI is the gate, not Docker — but make it explicit by comment).
- [ ] Run `pnpm run lint && pnpm run typecheck` locally on the current branch and fix the resulting findings. Expect: a non-zero number of findings since the codebase has been compiling without these gates for an unknown period.
- [ ] Add a pre-commit hook (lefthook / husky / native git hook) that runs `pnpm run typecheck --incremental` on staged TS files. Optional but a nice ratchet.
- [ ] Verify the audit report's claimed `any` count (5 source files per `conventions.md` H6) matches `tsc` reality. If `tsc` finds more, file follow-ups.
- [ ] **Tighten `tsconfig.json`** beyond the existing `strict: true`. Required additions (audit M-NEW-4 in Round 7):
  - `noUncheckedIndexedAccess: true` — `arr[i]` becomes `T | undefined`. **Highest-impact** flag — catches the silent-fallback class of bug we already documented under M-7 (wallet selection).
  - `noFallthroughCasesInSwitch: true` — every `switch` case must end with `break` / `return` / `throw`.
  - `noImplicitReturns: true` — every non-`void` code path must return.
  - `noImplicitOverride: true` — subclass overrides require the `override` keyword.

  Optional but recommended:
  - `noPropertyAccessFromIndexSignature: true` — typo'd index-signature keys become a TS error instead of `undefined` at runtime.
  - `exactOptionalPropertyTypes: true` — distinguishes `{ x?: T }` from `{ x: T | undefined }`.

  Expect each new flag to surface a triage list. Treat the same way as the lint baseline: small fixes inline, larger refactors into follow-up issues. Don't merge with `// @ts-expect-error` patches in lieu of real fixes.

# Files to change

- `package.json` — add scripts, possibly add `tsc` ratchet config
- `.github/workflows/deploy.yml` (or a new `quality.yml`) — add lint + typecheck steps
- `Dockerfile` — remove `NEXT_DISABLE_*` env vars; add a comment pointing to CI as the gate
- `tsconfig.json` — opt into the stricter flags above
- `.lefthook.yml` / `.husky/pre-commit` — pre-commit hook (optional)

# Suggested patches

```json
// package.json
{
  "scripts": {
    "dev": "next dev --turbopack -p 3200",
    "build": "next build",
    "start": "next start -p 3200",
    "lint": "biome check src/",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test"
  }
}
```

```yaml
# .github/workflows/deploy.yml (in the existing test job, before pnpm run test)
- name: Lint
  run: pnpm run lint
- name: Typecheck
  run: pnpm run typecheck
- name: Unit tests
  run: pnpm run test
```

```dockerfile
# Dockerfile — replace the two ENV lines with a comment
# Lint + typecheck run in CI before `docker build`. We don't re-run them
# inside Docker because: (1) we don't want CI failure to be detected only
# at image-build time, (2) it doubles build duration, and (3) the lockfile
# hasn't changed between the CI checkout and the Docker checkout, so the
# CI verification is binding for what gets built here.
# IF you ever build the image outside CI, run `pnpm run lint && pnpm run typecheck`
# manually before `docker build`.
```

```jsonc
// tsconfig.json — opt into stricter flags
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    // Round-7 additions:
    "noUncheckedIndexedAccess": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "noImplicitOverride": true,
    // Optional but recommended:
    "noPropertyAccessFromIndexSignature": true,
    "exactOptionalPropertyTypes": true,
    // ... rest unchanged
  }
}
```

# What to expect on first run

`pnpm run lint` (Biome 2.2.6 with default config from `biome.json`) and `pnpm run typecheck` (`tsc --noEmit`) on the current `staging` branch will likely produce findings — including some of the items already listed in the audit (`as any` in icon files, `as Position[]` casts, unused imports, etc.). Treat the first run as a baseline: triage findings into:

- **Fix in this PR** — small mechanical fixes (`any` → `SVGProps`, `as Position[]` → type guards).
- **File follow-up** — anything substantial that would balloon this PR. The conventions audit (`conventions.md`) already has tables of these.

If the cleanup ends up >300 LOC, split: this PR does the *infrastructure* (scripts, CI, Dockerfile, baseline ratchet); a second PR does the actual code fixes.

# Out of scope

- Migrating from Biome to ESLint or vice versa — Biome stays.
- Renovate / Dependabot config (separate, partly tracked under #14).
- Pre-commit hook is optional.

# Estimated effort

Infrastructure: ~30 minutes. Triage of first-run findings: highly variable, ~1-3 hours. Plan to land the infrastructure piece first as a strictly-additive PR (with fixes for any blocking findings), then iterate.

# Dependencies

- **Should land alongside or right after #15** (deploy.yml conflicts). Doing #16 without #15 means the new lint/typecheck steps are added to a workflow that doesn't parse.

# References

- Audit: `docs/audits/2026-05-08-frontend-review/security.md` (deep-dive Round 6, H-NEW-1 + H-NEW-2)
- CLAUDE.md: "Strict mode — full TypeScript strict mode. No `any`, no `@ts-ignore`."
- Cross-reference: this gate is the runtime enforcement for the type-discipline assumed by issues #02, #03, #04, #12.
