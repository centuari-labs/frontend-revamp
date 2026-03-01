---
title: "feat: Deposit via Privy Server Wallet API"
type: feat
status: active
date: 2026-03-02
---

# feat: Deposit via Privy Server Wallet API

## Overview

Implement a real deposit flow where the frontend sends a deposit request to the backend API, and the backend executes an ERC20 `transfer` from the user's Privy embedded wallet to a central treasury address using the Privy Server Wallet API. Arbitrum Sepolia only.

## Problem Statement / Motivation

The deposit dialog (`centuari-deposit-dialog.tsx`) is currently a mock — it simulates a 1.5s delay and shows a success dialog. No real tokens are transferred. This blocks testing of the lending/borrowing protocol end-to-end.

## Proposed Solution

**Architecture: Backend-driven deposit via Privy Wallet API**

```
User clicks "Confirm Deposit"
  → Frontend POST /deposit { assetId, amount } (with auth token)
  → Backend resolves token address + decimals from assets table
  → Backend encodes ERC20 transfer(treasury, amount) calldata via viem
  → Backend calls Privy Wallet API sendTransaction from user's embedded wallet
  → Backend returns { txHash, status }
  → Frontend shows success/error
```

The user's tokens reside in their Privy embedded wallet. The backend signs and sends the ERC20 transfer using Privy's server-side Wallet API, which requires the user's JWT for authorization.

## Technical Approach

### Phase 1: Backend — Deposit Module

#### 1.1 Extend `PrivyService` with Wallet API methods

**File:** `backend-v2/src/core/privy/privy.service.ts`

Add two methods:

```typescript
/**
 * Get the Privy wallet ID for a user's embedded wallet.
 * Calls privy.getUser() and finds the embedded wallet from linkedAccounts.
 */
async getEmbeddedWalletId(privyUserId: string): Promise<string>

/**
 * Sign + send an ERC20 transfer from the user's embedded wallet
 * using the Privy Wallet API.
 *
 * Requires the user's JWT for authorization (user-owned wallets).
 */
async sendERC20Transfer(params: {
    walletId: string;
    userJwt: string;
    tokenAddress: string;
    recipient: string;
    amount: bigint;
    chainId: number;
}): Promise<{ hash: string }>
```

**Key implementation detail — concurrency:**
`privy.walletApi.updateAuthorizationKey()` mutates global state on the singleton `PrivyClient`. This is unsafe for concurrent NestJS requests. Solution: create a **new `PrivyClient` instance per transaction call** (acceptable overhead for testnet; migrate to `@privy-io/node` per-call auth later).

**ERC20 calldata encoding** uses viem (already a dependency):

```typescript
import { encodeFunctionData, parseAbi } from "viem";

const data = encodeFunctionData({
    abi: parseAbi(["function transfer(address to, uint256 amount) returns (bool)"]),
    functionName: "transfer",
    args: [recipient, amount],
});
```

#### 1.2 Create Deposit Module

**New files:**
- `backend-v2/src/deposit/deposit.module.ts`
- `backend-v2/src/deposit/deposit.controller.ts`
- `backend-v2/src/deposit/deposit.service.ts`
- `backend-v2/src/deposit/dto/deposit.dto.ts`

**`deposit.module.ts`:**

```typescript
@Module({
    imports: [CoreModule, ConfigModule, TokensModule],
    controllers: [DepositController],
    providers: [DepositService],
})
export class DepositModule {}
```

**`deposit.dto.ts`:**

```typescript
export class DepositRequestDto {
    assetId: string;   // UUID from assets table
    amount: string;    // Human-readable amount (e.g. "100.5")
}

export class DepositResponseDto {
    transactionHash: string;
    status: string;    // "success" | "failed"
    tokenAddress: string;
    amount: string;
    chainId: number;
}
```

**`deposit.controller.ts`:**

```typescript
@Controller("deposit")
@UseGuards(AuthGuard)
export class DepositController {
    @Post()
    async deposit(
        @Body() dto: DepositRequestDto,
        @CurrentUser() user: AuthUser,
        @Headers("authorization") authHeader: string,
    ): Promise<DepositResponseDto>
}
```

Extracts the raw JWT from the `Authorization` header and passes it to the service (needed for Privy Wallet API authorization).

**`deposit.service.ts`:**

```typescript
@Injectable()
export class DepositService {
    constructor(
        private readonly privyService: PrivyService,
        private readonly tokensService: TokensService,
        private readonly configService: ConfigService,
    ) {}

    async deposit(
        user: AuthUser,
        userJwt: string,
        assetId: string,
        amount: string,
    ): Promise<DepositResponseDto> {
        // 1. Get token details (address, decimals) from TokensService
        // 2. Get treasury address from TREASURY_ADDRESS env var
        // 3. Get user's Privy embedded wallet ID via privyService.getEmbeddedWalletId()
        // 4. Parse amount to bigint using token decimals
        // 5. Call privyService.sendERC20Transfer()
        // 6. Return tx hash and status
        //
        // Dev mode: if isDevMode, return mock response (follow faucet pattern)
    }
}
```

#### 1.3 Token list endpoint

**File:** `backend-v2/src/deposit/deposit.controller.ts`

Add a `GET /deposit/tokens` endpoint that returns all deposit-eligible tokens with their on-chain addresses, decimals, and image URLs. This reuses `TokensService` cache.

```typescript
@Get("tokens")
@UseGuards(AuthGuard)
async getDepositTokens(): Promise<DepositTokenDto[]>
// Returns: [{ id, symbol, name, tokenAddress, decimals, imageUrl }]
```

#### 1.4 On-chain balance endpoint

**File:** `backend-v2/src/deposit/deposit.controller.ts`

Add a `GET /deposit/balance/:assetId` endpoint that reads the user's on-chain ERC20 balance for a specific token.

```typescript
@Get("balance/:assetId")
@UseGuards(AuthGuard)
async getTokenBalance(
    @Param("assetId") assetId: string,
    @CurrentUser() user: AuthUser,
): Promise<{ balance: string; decimals: number }>
```

Uses `ViemService.readContract()` to call `balanceOf(userWalletAddress)` on the token contract. Returns raw balance as string + decimals for frontend formatting.

#### 1.5 Environment variables

Add to `backend-v2/.env`:

```
TREASURY_ADDRESS=0x...  # Central vault address on Arbitrum Sepolia
```

#### 1.6 Register module

**File:** `backend-v2/src/app.module.ts`

Add `DepositModule` to imports.

---

### Phase 2: Frontend — Deposit Dialog Upgrade

#### 2.1 API functions

**File:** `frontend-revamp/src/lib/api.ts`

```typescript
export interface DepositToken {
    id: string;
    symbol: string;
    name: string;
    tokenAddress: string;
    decimals: number;
    imageUrl: string | null;
}

export function getDepositTokens(token: string): Promise<DepositToken[]> {
    return apiClient<DepositToken[]>("/deposit/tokens", { token });
}

export function getTokenBalance(
    assetId: string,
    token: string,
): Promise<{ balance: string; decimals: number }> {
    return apiClient<{ balance: string; decimals: number }>(
        `/deposit/balance/${assetId}`,
        { token },
    );
}

export interface DepositResponse {
    transactionHash: string;
    status: string;
    tokenAddress: string;
    amount: string;
    chainId: number;
}

export function requestDeposit(
    assetId: string,
    amount: string,
    token: string,
): Promise<DepositResponse> {
    return apiClient<DepositResponse>("/deposit", {
        method: "POST",
        body: { assetId, amount },
        token,
    });
}
```

#### 2.2 Deposit hook

**New file:** `frontend-revamp/src/hooks/use-deposit.ts`

Follows `use-faucet-drip.ts` pattern:

```typescript
type DepositStatus = "idle" | "loading" | "success" | "error";

export function useDeposit() {
    // State: status, error, txHash
    // Uses useAuthToken() to get JWT
    // Mock mode: USE_MOCK → simulate delay, return mock response
    // Real mode: call requestDeposit() from api.ts
    // Returns: { deposit, status, error, txHash, reset }
}
```

#### 2.3 Token balance hook

**New file:** `frontend-revamp/src/hooks/use-token-balance.ts`

```typescript
export function useTokenBalance(assetId: string | null) {
    // Uses useAuthToken() to get JWT
    // Calls getTokenBalance(assetId, jwt) via TanStack Query
    // refetchInterval: 15_000 (15s)
    // Returns: { balance, decimals, isLoading, formattedBalance }
    // formattedBalance: human-readable string (e.g. "1,234.56")
}
```

#### 2.4 Deposit tokens hook

**New file:** `frontend-revamp/src/hooks/use-deposit-tokens.ts`

```typescript
export function useDepositTokens() {
    // Uses useAuthToken() to get JWT
    // Calls getDepositTokens(jwt) via TanStack Query
    // staleTime: 60_000 (1min — token list rarely changes)
    // Mock mode: return hardcoded mock tokens
    // Returns: { tokens, isLoading }
}
```

#### 2.5 Upgrade deposit dialog

**File:** `frontend-revamp/src/components/centuari-deposit-dialog.tsx`

Changes:
1. **Remove `SelectChain`** — only Arbitrum Sepolia, no chain selection needed
2. **Replace `SelectToken` with dynamic token list** — use `useDepositTokens()` to fetch tokens from backend. Render a custom select dropdown using the backend data (with `imageUrl` for icons).
3. **Show on-chain balance** — when a token is selected, call `useTokenBalance(selectedAssetId)`. Display `"Balance: 1,234.56 USDT"` below the amount input.
4. **Amount validation** — disable "Confirm Deposit" when `amount > balance` or `amount <= 0`. Show inline error text.
5. **"Max" button** — add a button next to the amount input that fills in the user's full balance.
6. **Wire submit to `useDeposit()`** — replace `setTimeout` mock with real API call. On success, show `TransactionSuccessDialog` with tx hash. On error, show error message.
7. **Keep mock mode support** — when `USE_MOCK`, show hardcoded tokens and fake balances.

---

### Phase 3: Tests

#### Backend tests

**New file:** `backend-v2/src/__test__/deposit/deposit.service.test.ts`

- Mock `PrivyService`, `TokensService`, `ConfigService`, `ViemService`
- Test: successful deposit returns tx hash
- Test: dev mode returns mock response
- Test: missing treasury address falls back to mock
- Test: invalid asset ID throws BadRequestException
- Test: Privy wallet signing failure returns error

---

## Acceptance Criteria

- [ ] Backend `POST /deposit` endpoint accepts `{ assetId, amount }` and returns `{ transactionHash, status }`
- [ ] Backend uses Privy Wallet API to sign ERC20 `transfer` from user's embedded wallet
- [ ] Backend `GET /deposit/tokens` returns tokens from `assets` table with addresses and decimals
- [ ] Backend `GET /deposit/balance/:assetId` returns user's on-chain ERC20 balance
- [ ] Backend falls back to mock response in dev mode (same as faucet pattern)
- [ ] Frontend deposit dialog fetches tokens from backend API (no hardcoded list)
- [ ] Frontend shows user's on-chain balance for selected token
- [ ] Frontend validates amount <= balance before submission
- [ ] Frontend shows success dialog with tx hash after deposit
- [ ] Frontend shows error message on failure
- [ ] Chain selector removed (Arbitrum Sepolia only)
- [ ] Mock mode still works (`USE_MOCK=true`)

## Dependencies & Risks

| Risk | Mitigation |
|------|------------|
| Privy Wallet API `updateAuthorizationKey` is global state (unsafe for concurrent requests) | Create new `PrivyClient` per transaction; migrate to `@privy-io/node` later |
| Privy wallet ID discovery — `linkedAccounts` may not expose wallet ID directly | Fall back to Privy wallets listing API if needed |
| `@privy-io/server-auth` is deprecated | Works for now (v1.32.5); plan migration to `@privy-io/node` as separate task |
| Treasury address not yet provided | Use env var `TREASURY_ADDRESS`; can be set when ready |
| Token balances may be stale | 15s refetch interval; add "Refresh" button if needed |

## References & Research

### Internal References
- Faucet service (deposit pattern reference): `backend-v2/src/faucet/faucet.service.ts`
- Privy service (extend this): `backend-v2/src/core/privy/privy.service.ts`
- Auth guard + JWT extraction: `backend-v2/src/common/guards/auth.guard.ts`
- Token entity: `backend-v2/src/tokens/entities/token.entity.ts`
- Viem service: `backend-v2/src/core/viem/viem.service.ts`
- Faucet hook (frontend pattern): `frontend-revamp/src/hooks/use-faucet-drip.ts`
- Current deposit dialog: `frontend-revamp/src/components/centuari-deposit-dialog.tsx`
- API client: `frontend-revamp/src/lib/api-client.ts`

### External References
- [Privy Wallet API: sendTransaction](https://docs.privy.io/wallets/using-wallets/ethereum/send-a-transaction)
- [Privy Server-Side User Wallets](https://docs.privy.io/recipes/wallets/server-side-user-wallets)
- [Privy Migration: server-auth to node](https://docs.privy.io/basics/nodeJS/advanced/migrating-from-server-auth)

### Brainstorm
- `frontend-revamp/docs/brainstorms/2026-03-02-deposit-feature-brainstorm.md`
