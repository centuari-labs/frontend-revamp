---
title: "Authenticate the faucet drip endpoint — `requestFaucetTokens` skips JWT"
labels: ["security", "medium", "area:faucet", "bug"]
---

# Summary

`requestFaucetTokens` is the only POST in `lib/api.ts` that does not pass a JWT to `apiClient`. Frontend lets `POST /api/faucet/request-tokens` go through with no `Authorization` header, so anyone can call the faucet for any `recipientAddress` from any client (curl, scripts, other browsers) — gated only by whatever rate-limit the backend enforces.

# Why

```ts
// src/lib/api.ts:454-463
export function requestFaucetTokens(
  chainId: number,
  recipientAddress: string,
  tokens: string[],
): Promise<FaucetResponse> {
  return apiClient<FaucetResponse>("/faucet/request-tokens", {
    method: "POST",
    body: { chainId, recipientAddress, token: tokens },
    // ← NO `token` parameter; apiClient sends no Authorization header
  });
}
```

Every other state-changing endpoint in `api.ts` passes `token` so the user's Privy JWT is forwarded. This one doesn't.

**Realistic impact:**

- Testnet: anyone can drain the faucet inventory by scripting the endpoint with rotating recipient addresses (one address per rate-limit bucket, depending on backend logic).
- Architectural: if the same pattern is reused for a mainnet airdrop / claim / drip flow without revisiting the auth gate, this becomes a Critical mainnet finding by default.
- Audit trail: backend can't tie drip requests to specific Privy users, only to wallet addresses (which are public).

This is a Medium today because (a) testnet posture limits damage and (b) backend probably has IP/address rate limiting. The frontend fix is trivial and removes a class of issue.

# Acceptance criteria

- [ ] `requestFaucetTokens` accepts a `token: string` parameter and passes it to `apiClient`.
- [ ] `useFaucetDrip` calls `requestFaucetTokens` through `useAuthToken().authFetch` (matches the pattern used by `useDeposit`, `useWithdraw`, `useRepay`, etc.).
- [ ] If the user is not authenticated, `useFaucetDrip.requestDrip` throws/returns an error before hitting the network — match the existing `if (!address) throw …` pattern at `use-faucet-drip.ts:25`.
- [ ] Negative test: calling the proxy directly with `POST /api/faucet/request-tokens` and **no** Authorization header returns the same response shape as backend rejection (the proxy itself doesn't add auth — it just forwards what's there). Document this as expected behavior in the test file comment.
- [ ] Vitest covering: happy-path with token; missing-token throws before fetch; faucet UI requires authentication.

# Files to change

- `src/lib/api.ts` (line 454-463): add `token: string` parameter, forward to `apiClient`.
- `src/hooks/use-faucet-drip.ts` (line 29-33): wrap call in `authFetch`.
- `src/components/faucet/faucet-token-grid.tsx` (line 35 area): ensure UI gates the drip button on `authenticated` state.
- `src/hooks/__tests__/use-faucet-drip.test.ts` (new or extended).

# Suggested patch

```ts
// src/lib/api.ts
export function requestFaucetTokens(
  chainId: number,
  recipientAddress: string,
  tokens: string[],
  token: string,                    // ← new
): Promise<FaucetResponse> {
  return apiClient<FaucetResponse>("/faucet/request-tokens", {
    method: "POST",
    body: { chainId, recipientAddress, token: tokens },
    token,                          // ← forward
  });
}

// src/hooks/use-faucet-drip.ts
import { useAuthToken } from "@/hooks/use-auth-token";

export function useFaucetDrip() {
  const address = useWalletAddress();
  const { authFetch } = useAuthToken();
  // ...

  const requestDrip = useCallback(
    async (tokenValues: string[]): Promise<FaucetResponse | null> => {
      // ...
      const result = await authFetch((jwt) =>
        requestFaucetTokens(ACTIVE_CHAIN.id, address, tokenValues, jwt),
      );
      // ...
    },
    [address, authFetch],
  );
}
```

# Out of scope

- Backend rate-limit policy (what counts as abuse, what's the bucket key). Backend's call.
- Captcha / proof-of-humanity on the faucet UI. Separate decision.
- Mainnet airdrop / claim flow design — track separately when that lands.

# Estimated effort

~10 LOC + 1 test. ~30 minutes.

# Dependencies

None. Standalone.

# References

- Audit: `docs/audits/2026-05-08-frontend-review/security.md` (deep-dive Round 3, M-5)
- Pattern reference: every other authenticated POST in `lib/api.ts`
