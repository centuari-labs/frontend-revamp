---
title: "Harden `next.config.ts` image config + CI guard for Next.js version pin"
labels: ["security", "low", "area:config", "hardening", "preventive"]
---

# Summary

Tighten `next.config.ts` proactively against three Next.js-specific attack classes called out in the public bug-bounty literature. None is a vulnerability in the current codebase — they're configuration choices that close the door before any future PR opens it.

The three:

1. **Image optimizer SSRF** (`/_next/image`) — pin `remotePatterns` to specific hostnames *with* pathname constraints; never use wildcards.
2. **SVG-XSS surface** — explicitly set `dangerouslyAllowSVG: false` (currently relies on default; explicit beats implicit for security knobs).
3. **CVE-2025-29927 regression** — pin Next.js to `>=15.2.3` via `package.json` `engines` and a CI check, so a future `pnpm update` cannot silently downgrade the runtime onto a vulnerable version.

Source: [DeepStrike Next.js bug-bounty guide](https://deepstrike.io/blog/nextjs-security-testing-bug-bounty-guide).

# Why this is preventive, not reactive

Today the project is fine on all three:

- `images.remotePatterns` is *unset* — Next.js defaults to "same-origin only", so `/_next/image?url=https://attacker.example/...` returns 400. Adding `remotePatterns` (planned in issue #13 to unblock `next/image` for `assets.coingecko.com`) is the moment we *open* this surface.
- `dangerouslyAllowSVG` is unset (default false). One contributor flipping it for "let's render the token logos as SVG" instantly opens stored-XSS-via-SVG.
- Next.js is `15.5.7`, well above the patch boundary `15.2.3`. A bad `pnpm update` plus an inattentive review could move it backward.

This issue is a forcing function: once the config is locked down with explicit, narrow values and inline reasoning, contributors have to consciously remove the protection rather than passively forget to add it.

Related: issue #13 already plans adding `remotePatterns` for the basic CDN hosts. This issue extends that with hardening details and the version pin.

# Acceptance criteria

- [ ] `next.config.ts` `images` block sets:
  - [ ] `remotePatterns` listing **specific hostnames** with `pathname` constraints (e.g. `/coins/images/**`); no `*` hostnames, no protocol-bare patterns.
  - [ ] `dangerouslyAllowSVG: false` set explicitly with an inline comment: `// keep false — SVG enables stored XSS via crafted images`.
  - [ ] `contentDispositionType: 'attachment'` so any image that *does* slip past `remotePatterns` (e.g. via redirect chasing) is served as a download, not rendered inline.
  - [ ] `minimumCacheTTL` set to a reasonable non-zero value (e.g. `60`) — current default is fine, but make it explicit so changes are visible.
- [ ] `package.json` `engines.node` and `engines.pnpm` are set, plus a new constraint that documents the Next.js version floor:
  - Either via `engines` (`"next": ">=15.2.3"` is non-standard but readable) — preferred is a comment in `next.config.ts` referencing CVE-2025-29927 and pinning the floor in the lockfile.
  - Or via Renovate / Dependabot config: `"matchPackageNames": ["next"], "allowedVersions": ">=15.2.3"`.
- [ ] CI script (`pnpm run lint:security` or new `scripts/check-next-version.mjs`) that fails the build if `node_modules/next/package.json`'s `version` is `<15.2.3`. ~10 LOC, runs in pre-build.
- [ ] Inline reasoning in `next.config.ts` near each hardened option — short, references CVE/article so future maintainers don't strip the protection without reading the audit doc.
- [ ] `docs/audits/2026-05-08-frontend-review/forward-looking-hardening.md` linked from the inline comment.
- [ ] Smoke test: `pnpm run build` passes; `next/image` from `assets.coingecko.com` renders correctly post-change.

# Files to change

- `next.config.ts`
- `package.json` (engines or scripts)
- (new) `scripts/check-next-version.mjs` — minimal Node script
- `.github/workflows/*.yml` — if CI exists, wire the script into pre-build
- (new — handled by separate doc PR) `docs/audits/2026-05-08-frontend-review/forward-looking-hardening.md`

# Suggested patch sketch

```ts
// next.config.ts
const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    // Specific hostnames + pathname patterns. Never use a wildcard hostname —
    // it turns /_next/image into an SSRF gateway.
    // See docs/audits/2026-05-08-frontend-review/forward-looking-hardening.md
    remotePatterns: [
      { protocol: "https", hostname: "assets.coingecko.com", pathname: "/coins/images/**" },
      { protocol: "https", hostname: "avatars.githubusercontent.com", pathname: "/u/**" },
      { protocol: "https", hostname: "auth.privy.io", pathname: "/**" },
    ],
    // Keep false — SVG enables stored XSS via crafted <script>/<foreignObject>.
    // CVE references and exploitation: see DeepStrike Next.js bug-bounty guide.
    dangerouslyAllowSVG: false,
    // Force browser to download instead of inline-render any image that slips
    // through (e.g. via upstream redirect to non-image content).
    contentDispositionType: "attachment",
    minimumCacheTTL: 60,
  },
  // ... existing headers() unchanged
};
```

```js
// scripts/check-next-version.mjs
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const MIN = "15.2.3"; // CVE-2025-29927 patched in this version

function cmp(a, b) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0);
  }
  return 0;
}

const pkg = JSON.parse(
  readFileSync(resolve("node_modules/next/package.json"), "utf8"),
);

if (cmp(pkg.version, MIN) < 0) {
  console.error(
    `next ${pkg.version} is below the security floor ${MIN} ` +
    `(CVE-2025-29927: x-middleware-subrequest auth bypass). ` +
    `Update next to >= ${MIN}.`,
  );
  process.exit(1);
}

console.log(`next ${pkg.version} ≥ ${MIN} ✓`);
```

```json
// package.json scripts (additions)
{
  "scripts": {
    "check:next-version": "node scripts/check-next-version.mjs",
    "build": "pnpm run check:next-version && next build"
  }
}
```

# Out of scope

- Migrating raw `<img>` calls to `next/image` — issue #13 / NEXT-M1.
- Tightening CSP `'unsafe-inline'` / `'unsafe-eval'` — separate work; needs Privy-compatible nonce strategy (audit L-3).
- A general supply-chain audit (Snyk / pnpm audit pipeline). Out of scope for this issue but worth a follow-up.

# Estimated effort

~30 LOC + script + CI wire-up. ~1 hour including a clean local rebuild and verifying the Coingecko logos still render.

# Dependencies

- Plays well with #13 (which adds `remotePatterns` for the same hostnames). If #13 lands first, this issue tightens `pathname` and adds the SVG/Disposition/CI bits. If this lands first, #13 becomes a no-op.

# References

- Audit: `docs/audits/2026-05-08-frontend-review/security.md`
- Forward-looking playbook (companion doc): `docs/audits/2026-05-08-frontend-review/forward-looking-hardening.md`
- DeepStrike Next.js bug-bounty guide: https://deepstrike.io/blog/nextjs-security-testing-bug-bounty-guide
- CVE-2025-29927 (Next.js auth bypass via `x-middleware-subrequest`): patched in 15.2.3 / 14.2.25 / 13.5.9 / 12.3.5
