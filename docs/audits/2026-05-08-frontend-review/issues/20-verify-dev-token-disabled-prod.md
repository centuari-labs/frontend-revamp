---
title: "Verify backend `DEV_TOKEN_<wallet>` auth path is disabled in production"
labels: ["security", "info", "area:backend-coordination", "tracking"]
---

# Summary

The frontend e2e helpers authenticate with `Bearer DEV_TOKEN_<wallet>` strings (not Privy JWTs):

```ts
// e2e/helpers/api.ts:13-14
export const LENDER_AUTH = `Bearer DEV_TOKEN_${LENDER_WALLET}`;
export const BORROWER_AUTH = `Bearer DEV_TOKEN_${BORROWER_WALLET}`;
```

This means the **backend accepts a `DEV_TOKEN_<address>` Bearer token as valid auth, identifying the caller as the wallet whose address is embedded in the token**. The frontend itself does not use this path — the runtime obtains a real Privy JWT via `useAuthToken`. But the e2e tests document and rely on the backend backdoor.

**This is a backend concern, not a frontend vulnerability.** It is filed here because:

1. The audit surfaced it from the e2e helpers (frontend repo).
2. If the backdoor is enabled in production by misconfiguration, anyone who knows or guesses a wallet address can authenticate as that wallet, read its portfolio, submit orders, and trigger withdraw flows. That would be **Critical**.
3. Wallet addresses are public on-chain, so brute-forcing isn't even needed — every active user's address is known.

This issue tracks the *verification* — coordinate with backend to confirm and lock down.

# Verification checklist

- [ ] Backend confirms the `DEV_TOKEN_*` auth handler exists.
- [ ] Backend confirms it is gated by an environment-explicit guard such as:
  - `if (NODE_ENV === "test" || NODE_ENV === "development") { /* accept DEV_TOKEN_ */ }`
  - **Not** `if (NODE_ENV !== "production")` — that's vulnerable to env-var unset (where `NODE_ENV` is `undefined`, the negation passes and the backdoor is enabled).
- [ ] Backend confirms there is **no environment in which `NODE_ENV` could legitimately be unset** AND the `DEV_TOKEN_` handler is reachable. If unset is possible (containers without `NODE_ENV` baked in), tighten the guard to `=== "test" || === "development"` only.
- [ ] Backend's production deploy logs / monitoring fire an **alert** on any incoming Authorization header matching `^Bearer DEV_TOKEN_`. Even one such request in production should page someone.
- [ ] Backend integration tests verify: with `NODE_ENV=production`, `Bearer DEV_TOKEN_<wallet>` returns 401, regardless of wallet address.
- [ ] Document the test-only auth path in the backend's threat model with explicit "this is intentional and gated" notation, so a future contributor cannot delete the gate without auditors noticing.
- [ ] Long-term: replace `DEV_TOKEN_*` strings with **issued JWTs signed with a test-only key** that the production environment doesn't have. The current scheme means the backdoor is "the absence of validation", which fails open. JWT-based dev tokens fail closed (production lacks the signing key).

# Why this is filed at "Info"

The frontend has no code change to make. The codebase as-is is correct. The risk is entirely on the backend's side, but the *signal* — that an unsafe auth scheme exists in test infrastructure — is something this audit must flag to avoid a "we never told you" handoff.

If the backend confirms (a) the `DEV_TOKEN_` handler is properly gated and (b) monitoring alerts on stray production usage, this issue closes with no code change.

If the backend reports the gate is missing or weak, this becomes Critical and a backend issue is opened to fix it.

# Long-term frontend follow-up (separate issue, not this one)

Once the backend has issued JWT-signed dev tokens, update `e2e/helpers/api.ts` to use the JWT-based dev token instead of the magic-string scheme. That removes the documentation of the backdoor from this repo entirely.

# Out of scope

- Implementing the backend gate (backend repo).
- The long-term JWT-based dev token (separate issue).
- A wider audit of every backend endpoint's auth — that's the backend team's audit.

# Estimated effort

Frontend: 0 LOC. Verification: ~1 hour of backend cross-team review.

# Dependencies

None.

# References

- Audit: `docs/audits/2026-05-08-frontend-review/security.md` (deep-dive Round 7, I-NEW-1)
- File where the scheme is documented in this repo: `e2e/helpers/api.ts:13-14`
