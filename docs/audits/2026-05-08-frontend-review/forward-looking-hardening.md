# Forward-Looking Hardening Playbook

Companion to `security.md`. The current frontend codebase is well-defended on most Next.js-specific attack classes — but largely **because it doesn't yet use the features that introduce them**. As the team adopts more of the App Router surface area for performance reasons (per `react-nextjs.md`), each adoption opens a new attack class that needs proactive hardening.

This doc is the playbook: when feature *X* is introduced, run checklist *X* before merging. Derived from the [DeepStrike Next.js bug-bounty guide](https://deepstrike.io/blog/nextjs-security-testing-bug-bounty-guide) and current Next.js 15 docs.

> **How to use this:** before approving a PR that introduces any of the listed features, walk through that section's checklist. Treat each unchecked item as a review blocker.

## Quick lookup

| If the PR introduces… | Read section |
|---|---|
| `middleware.ts` / `middleware.js` | [§1 Middleware](#1-middleware) |
| `"use server"` directive | [§2 Server Actions](#2-server-actions) |
| `export const revalidate`, `unstable_cache`, `revalidatePath`, `dynamic = "force-static"` | [§3 Caching / ISR](#3-caching--isr) |
| `next/image` usage with new `remotePatterns` entries, `dangerouslyAllowSVG`, custom loaders | [§4 Image optimizer](#4-image-optimizer) |
| `draftMode()`, preview mode tokens | [§5 Draft / preview mode](#5-draft--preview-mode) |
| `productionBrowserSourceMaps: true`, `experimental.swcSourceMaps` | [§6 Source maps](#6-source-maps) |
| Server-side data fetching (`async function Page() { await fetch(...) }`) | [§7 RSC server-side data](#7-rsc-server-side-data) |
| New entry in `next.config.ts` `headers()`, `redirects()`, `rewrites()` | [§8 Headers / redirects / rewrites](#8-headers--redirects--rewrites) |
| New private package scope (`@centuari/*`, `@internal/*`) | [§9 Dependency confusion](#9-dependency-confusion) |

---

## 1. Middleware

**Triggered by:** any PR that adds `src/middleware.ts` or modifies `matcher` config.

**Why dangerous:** middleware runs before every matched request and is commonly used for auth gates. Misconfigured matchers, unsafe rewrites, and the historical `x-middleware-subrequest` bypass (CVE-2025-29927) are the canonical bug classes.

**Checklist:**

- [ ] Confirm the running Next.js version is `>=15.2.3` (CVE-2025-29927 patched). Issue #14's CI guard should already enforce this.
- [ ] The matcher is **explicit and narrow**. Avoid `matcher: '/(.*)'` unless you've audited every code path. Prefer per-route segments or excluded patterns.
- [ ] Auth checks read the JWT from `Authorization` header (or `req.cookies.get` for cookies — but the proxy currently doesn't forward cookies, so confirm any new cookie auth integrates properly). Validate token *before* trusting any request data.
- [ ] **Strip `x-middleware-subrequest`** from incoming requests if you read it: `req.headers.delete('x-middleware-subrequest')` at the top of the handler. Even on patched versions, defensively remove it.
- [ ] No `NextResponse.rewrite(externalUrl)` with attacker-controllable input.
- [ ] No `NextResponse.redirect()` with user-controlled URL — open redirect risk. Validate against an allowlist or relative-path-only.
- [ ] No `Response.json({ user, … })` returning sensitive data — middleware should redirect/rewrite/next, not serve content.
- [ ] Tests cover: bypass attempts (`?_next_skip=1`-style payload variants), traversal, allowlist-evasion via case sensitivity / trailing slash / encoding.

**Reference:** [Next.js middleware docs](https://nextjs.org/docs/app/building-your-application/routing/middleware), CVE-2025-29927.

---

## 2. Server Actions

**Triggered by:** any new file with `"use server"` directive at top, or any function file that uses `"use server"` inline.

**Why dangerous:** Server Actions are server-side functions invoked from client forms. They are remote endpoints. The `Next-Action` header is a hash that maps to the function; if exposed via source maps, an attacker can enumerate every callable function in the app.

**Checklist:**

- [ ] **Auth gate at the top of every action.** Re-verify the user's identity inside the function, not just in the calling component. Treat each Server Action as a public endpoint.
- [ ] **Validate every parameter** with Zod. Server Actions accept FormData and arbitrary serializable values; do not trust the shape.
- [ ] **No SSRF in the action body** — same rules as any backend code. If the action calls `fetch(userInput)`, allowlist the destination.
- [ ] `productionBrowserSourceMaps: false` (default). If enabled for a separate reason, **disable for production builds at minimum** so action hashes can't be reversed to function names. (Tool: [NextjsServerActionAnalyzer](https://github.com/Adversis/NextjsServerActionAnalyzer).)
- [ ] **No DOM nodes / functions / class instances passed in the action's argument types.** Strings, numbers, booleans, plain objects, arrays, FormData only.
- [ ] CSRF: if the user is auth'd via cookie, ensure SameSite is `Lax` or `Strict`, AND validate origin / sec-fetch-site headers. Server Actions are POSTs invoked from forms, but cross-origin-form-targeting is still possible.
- [ ] If the action mutates state, return only what the client needs. Don't echo back the full DB row.
- [ ] Tests for: missing auth → unauthorized, malformed FormData → 400, valid auth + valid input → 200.

**Reference:** [DeepStrike: SSRF via Server Actions](https://deepstrike.io/blog/nextjs-security-testing-bug-bounty-guide), CVE-2024-34351.

---

## 3. Caching / ISR

**Triggered by:** `export const revalidate = N`, `export const dynamic = "force-static"`, `unstable_cache`, `revalidatePath`, `revalidateTag`, or any `fetch(url, { next: { revalidate: N }})`.

**Why dangerous:** the same cache key serves multiple users. If the cache key doesn't include user identity but the response *does* include user-specific data, you've built a cross-user data leak.

**Checklist:**

- [ ] **Never cache user-specific responses** at the page level. If the page renders `await getMyAssets()`, it must be `dynamic = "force-dynamic"` or have no caching directive.
- [ ] If using `unstable_cache`, the cache key includes the user identifier. Read the [`unstable_cache` docs](https://nextjs.org/docs/app/api-reference/functions/unstable_cache) on key derivation.
- [ ] If the page uses `revalidate`, confirm the rendered content has **no PII / per-user data**. Token prices, market data, public order books = OK. Balance, orders, portfolio = NOT OK.
- [ ] Set `Vary: Authorization` on responses that depend on the user's JWT.
- [ ] `Cache-Control: private` on any response that should never hit a shared cache. `public` on truly public ones.
- [ ] Test cache deception: log in as user A, request a page; log in as user B, request the same page from a clean browser; verify B does not see A's data.
- [ ] If using on-demand revalidation (`POST /revalidate` endpoint or webhook), authenticate the trigger (HMAC, shared secret) — anyone hitting an unauthenticated revalidate endpoint can DoS the cache.

**Reference:** Article items #6–#7. [Next.js caching docs](https://nextjs.org/docs/app/building-your-application/caching).

---

## 4. Image optimizer

**Triggered by:** changes to `next.config.ts` `images` block, new `<Image>` usages, custom image loader.

**Why dangerous:** `/_next/image?url=<URL>` is a server-side fetch endpoint. Misconfigured `remotePatterns` turn it into SSRF. Enabling SVG turns it into stored XSS.

**Checklist:**

- [ ] Issue #14 lands first; `remotePatterns` entries are **specific hostnames + pathname patterns**.
- [ ] Never use `hostname: '*'` or `hostname: '**.something.com'`. The latter still allows attacker-controlled subdomains of the parent.
- [ ] **Never enable `dangerouslyAllowSVG`** unless you own the image source end-to-end and sanitize SVG with a hardened parser (e.g. DOMPurify with no `<script>` / `<foreignObject>`). Default to `false` and treat enabling it as a security review trigger.
- [ ] `contentDispositionType: 'attachment'` set, so even an unexpected response is downloaded not rendered.
- [ ] Test the endpoint manually: `/_next/image?url=https://attacker.example/image.png&w=128&q=75` should return 400.
- [ ] If you add a custom loader, it must validate the URL against the same `remotePatterns` list — don't trust client input.
- [ ] `minimumCacheTTL` set to non-zero so optimized variants are cached and don't get re-fetched per request.

**Reference:** Article #9. [Assetnote: Digging for SSRF in Next.js apps](https://www.assetnote.io/resources/research/digging-for-ssrf-in-nextjs-apps).

---

## 5. Draft / preview mode

**Triggered by:** `draftMode()` import, `cookies().set("__prerender_bypass", ...)`, any preview-token endpoint.

**Why dangerous:** preview mode bypasses ISR and renders draft content. The preview token, once leaked, lets an attacker view unpublished pages and bypass cache.

**Checklist:**

- [ ] Preview tokens are **HMAC-signed** with a server-only secret, not random strings stored in a DB.
- [ ] Preview cookies have `Secure`, `HttpOnly`, `SameSite=Strict` flags.
- [ ] The endpoint that *enables* preview mode authenticates the caller (CMS webhook secret, admin session, etc.).
- [ ] Preview mode is **never** activated based on a query parameter alone (`?preview=true` is a cardinal sin).
- [ ] Audit logs record who entered preview mode and when.
- [ ] Preview content is clearly visually distinct from production (banner, tinted background) so contributors don't confuse the two.

**Reference:** [Next.js draft mode docs](https://nextjs.org/docs/app/building-your-application/configuring/draft-mode).

---

## 6. Source maps

**Triggered by:** `productionBrowserSourceMaps: true` in `next.config.ts`, custom webpack config that emits `.map`, or a build step that uploads source maps to a CDN.

**Why dangerous:** source maps reverse-engineer the bundle. They reveal Server Action hashes, internal API shapes, comment metadata, and developer comments. If they're served from `/_next/static/chunks/*.map`, anyone can fetch them.

**Checklist:**

- [ ] `productionBrowserSourceMaps` stays `false` (default) for production. Acceptable in staging if access-controlled.
- [ ] Verify post-build: `find .next -name "*.map"` returns 0 (or only files in `.next/server` which aren't served to the client).
- [ ] If source maps are uploaded to an error-tracking provider (Sentry, etc.), they go via authenticated upload — never published to a public path.
- [ ] CI guard: a build step that fails if `.next/static/**.map` exists.

**Reference:** Article #8.

---

## 7. RSC server-side data

**Triggered by:** any `async function Page()` / `async function Layout()` that calls `fetch(...)` or a database directly.

**Why dangerous:** the server-side fetch's response is serialized into the RSC payload streamed to the client. Anything in the response body becomes part of `__NEXT_RSC_DATA__` (the RSC equivalent of `__NEXT_DATA__`) and is visible to anyone inspecting the page source.

**Checklist:**

- [ ] Never include API keys, secrets, internal hostnames, or admin-only fields in RSC component props. Strip server-only fields **before** passing data to children.
- [ ] If the data is per-user, the fetch uses the user's JWT (forwarded through cookies/headers) and the response is *never* cached at the page level.
- [ ] Type the Server Component's props narrowly so you don't accidentally spread `{ ...everything }` into a Client Component child.
- [ ] Run a manual test: build, view-source, search the HTML for the string "BACKEND_URL", "Bearer ", or any internal hostname pattern. Should return 0 hits.

**Reference:** Article #5 (legacy `__NEXT_DATA__`), generalized to RSC.

---

## 8. Headers / redirects / rewrites

**Triggered by:** changes to `next.config.ts` `async headers()`, `async redirects()`, `async rewrites()`.

**Checklist:**

- [ ] CSP doesn't add new `'unsafe-inline'` or `'unsafe-eval'` for any directive (currently only script-src has them by Privy necessity; tracked under audit L-3).
- [ ] New `connect-src` / `frame-src` entries are specific hostnames, not wildcards.
- [ ] `redirects()` destinations are static strings or rely on path parameters that are validated by the source pattern. Never reflect query parameters into `Location` headers.
- [ ] `rewrites()` to `destination: 'https://attacker-controlled-host'` is a footgun — only rewrite to known internal hosts (or use the proxy route pattern we already have).
- [ ] Headers like `Strict-Transport-Security` should only get *stronger* over time (longer max-age, add `preload` once you've registered).

**Reference:** [Next.js headers docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/headers).

---

## 9. Dependency confusion

**Triggered by:** any new private-scoped package (`@centuari/*`, `@internal/*`, etc.) added to `package.json`.

**Why dangerous:** if a private package name is also publicly registrable, an attacker can publish a malicious package with the same name; some package managers prefer the higher version, regardless of registry.

**Checklist:**

- [ ] Every private scope used in `dependencies` or `devDependencies` is registered (and reserved) on the public npm registry, even if the package itself stays private.
- [ ] `.npmrc` declares `@centuari:registry=` (or whatever scope) pointing to the private registry. Public registry is the default for unscoped/unmatched scopes.
- [ ] Run `confused` or `npm-confused` against the lockfile in CI before each merge: https://github.com/visma-prodsec/confused
- [ ] Review every `package-lock.json` diff for unexpected `resolved` URLs (if a private package suddenly resolves to `registry.npmjs.org`, that's a confusion-attack indicator).

**Reference:** Article #12.

---

## How to extend this doc

When you adopt a Next.js feature not covered here, add a new section. Format:

```markdown
## N. <Feature name>

**Triggered by:** <pattern in code that signals adoption>

**Why dangerous:** <one-paragraph threat model>

**Checklist:**
- [ ] item
- [ ] item

**Reference:** <article link, CVE, or Next.js docs>
```

Keep each section short — the doc loses value if it bloats into a textbook. Each item should be a binary check that a reviewer can answer yes/no in under 30 seconds.

---

## What this doc deliberately does NOT cover

- **General secure-coding hygiene** (input validation, output encoding, authn/authz). Those are universal; the audit doc and existing issues cover the current state.
- **Backend security.** Out of scope — this is the frontend repo.
- **Privy SDK internals.** Vendor-trusted; if you suspect a Privy bug, file with Privy.
- **Smart-contract security.** Separate audit. Frontend defers all on-chain validity to the contracts.

---

## References

- Audit doc: `docs/audits/2026-05-08-frontend-review/security.md`
- Issues folder: `docs/audits/2026-05-08-frontend-review/issues/`
- DeepStrike guide: https://deepstrike.io/blog/nextjs-security-testing-bug-bounty-guide
- Next.js docs: https://nextjs.org/docs
- CVE-2025-29927: https://github.com/advisories/GHSA-f82v-jwr5-mffw
- CVE-2024-34351: https://github.com/advisories/GHSA-fr5h-rqp8-mj6g
