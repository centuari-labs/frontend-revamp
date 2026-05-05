---
title: "refactor: Token Metadata Optimization (CENT-114)"
type: refactor
status: active
date: 2026-05-05
origin: docs/brainstorms/cent-114-token-metadata-optimization-requirements.md
---

# refactor: Token Metadata Optimization (CENT-114)

**Target repos:**
- **Primary (FE):** `centuari-revamp/frontend-revamp/` — all `src/...` paths are relative to this root
- **Secondary (BE):** `centuari-backend-v2/backend-v2/` — paths prefixed with `[BE]`

---

## Overview

Token/asset metadata (`symbol`, `name`, `decimals`, `imageUrl`, `tokenAddress`) saat ini disertakan di hampir semua backend response (orders, positions, market, history) via SQL JOIN ke tabel `assets`. Refactor ini menghapus redundansi tersebut: backend hanya mengembalikan `assetId`, sedangkan frontend menyimpan semua token metadata di localStorage dengan strategi stale-while-revalidate dari satu endpoint tunggal (`GET /deposit/tokens`).

---

## Problem Frame

Setiap API call yang menyangkut orders, positions, history, dan market membawa ulang data token yang sama. Ini memboroskan bandwidth, menambah DB JOIN yang tidak perlu, dan memaksa frontend mendefinisikan ulang tipe token (`MarketAsset`, `DepositToken`, `OrderHistoryAsset`) di berbagai tempat. Sumber: `docs/brainstorms/cent-114-token-metadata-optimization-requirements.md`.

---

## Requirements Trace

- R1. Response orders, positions, history, dan market tidak lagi menyertakan nested asset metadata; hanya `assetId: string`
- R2. Frontend memiliki satu tipe `Token` yang dipakai di seluruh codebase
- R3. Token metadata di-fetch dari `GET /deposit/tokens` sekali dan di-cache di localStorage (`centuari_tokens`)
- R4. Strategi cache: baca localStorage dulu (zero delay), fetch di background setiap app load, update silently
- R5. First visit (localStorage kosong): tampilkan loading state sampai fetch selesai
- R6. Tidak ada JOIN ke tabel `assets` di keempat query type yang diubah

---

## Scope Boundaries

- Perubahan schema endpoint `GET /deposit/tokens` — tidak berubah
- Penambahan token baru ke sistem — di luar scope
- TTL-based expiry — tidak diperlukan; stale-while-revalidate sudah cukup
- Real-time token update via WebSocket — di luar scope
- Migrasi raw SQL ke QueryBuilder di backend — pre-existing violation; tetap raw SQL untuk konsistensi, kecuali `getUserPositions` yang sudah QueryBuilder
- Normalisasi casing `market_id`/`borrow_rate` di `MarketItem` — scope terpisah; jangan campur dalam PR ini

---

## Context & Research

### Relevant Code and Patterns

**Backend:**
- `[BE] src/portfolio/repositories/portfolio.repository.ts` — 4 queries dengan asset JOIN: `getOpenOrders` (line 602), `getOrderHistory` (line 508), `getTransactionHistory` (line 755), `getUserPositions` lend (line 235) + borrow (line 293)
- `[BE] src/portfolio/dto/open-orders.dto.ts` — `OpenOrderItem.asset: AssetDto` (line 46), `RawOpenOrderRow.asset_id` (line 59)
- `[BE] src/portfolio/dto/order-history.dto.ts` — `OrderHistoryItem.asset: AssetDto` (line 45)
- `[BE] src/portfolio/dto/transaction-history.dto.ts` — `TransactionHistoryItem.asset: AssetDto` (line 38)
- `[BE] src/portfolio/dto/portfolio.dto.ts` — `MyPositionItemDto` memiliki flat fields `symbol`, `name`, `imageUrl` (lines 110–116)
- `[BE] src/portfolio/service.ts` — mapping asset ke response: open orders (lines 898–924), order history (833–862), transaction history (1303–1339), positions (731–757)
- `[BE] src/market/dto/market.dto.ts` — `MarketItemDto.asset` (lines 2–11), `MarketDetailResponseDto.asset` (lines 44–50)
- `[BE] src/market/market.service.ts` — `getMarketSnapshot()` (lines 87–94), `getMarketDetail()` (lines 146–151)
- `[BE] src/common/dto/asset.dto.ts` — `AssetDto` yang di-remove dari semua 3 portfolio DTOs
- `[BE] src/orders/dto/order-response.dto.ts` — **referensi pattern**: sudah pakai `assetId: string` (tanpa nested object)

**Frontend:**
- `src/hooks/use-portfolio-from-storage.ts` — **pola localStorage** yang harus diikuti: SSR guard (`typeof window === "undefined"`), `try/catch` dengan fallback, custom event `centuari-*` untuk same-tab broadcast
- `src/contexts/price-context.tsx` — pola `PriceProvider` sebagai referensi context dengan per-ID selector (`useTokenPrice(assetId)`)
- `src/lib/query-keys.ts` — `QUERY_KEYS` const object; `invalidateUserQueries()` helper
- `src/lib/query-config.ts` — `QUERY_CONFIG.DEPOSIT_TOKENS_STALE_TIME` (5 menit) sudah ada
- `src/lib/tokens.ts` — `Token` type (line 46) adalah tipe statis dari array `{ value, label, icon }` — akan di-rename ke `StaticToken`
- `src/lib/api.ts` — type definitions yang akan dikonsolidasi: `MarketAsset` (lines 3–9), `DepositToken` (467–475), `OrderHistoryAsset` (586–593)

### Institutional Learnings

- `orders/dto/order-response.dto.ts` di BE sudah menggunakan `assetId: string` — ini adalah shape target yang sudah ada sebagai preseden
- `use-portfolio-from-storage.ts` adalah satu-satunya hook yang saat ini pakai localStorage; wajib ikuti pola SSR guard-nya
- `@tanstack/react-query-persist-client` belum diinstall — jangan tambahkan dependensi baru; gunakan hand-rolled localStorage
- `DepositToken` (bukan `MarketAsset`) adalah shape kanonik: camelCase, paling lengkap (ada `tokenAddress`, `chainId`)
- `"deposit-tokens"` di `use-deposit-tokens.ts` adalah hardcoded string — ini pelanggaran CLAUDE.md yang perlu diperbaiki

---

## Key Technical Decisions

- **Unified type bernama `Token`** (bukan `TokenMetadata`): `lib/tokens.ts` punya `Token` type statis → rename ke `StaticToken` lebih dulu; lalu buat `Token` baru di `src/types/token.ts` dengan shape dari `DepositToken`
- **Tidak pakai TanStack persist plugin**: hand-rolled localStorage mengikuti pola `use-portfolio-from-storage.ts` — konsisten dengan existing codebase, tidak tambah dependency baru
- **`use-tokens.ts` menggantikan `use-deposit-tokens.ts`**: hook baru menjadi global token store; `use-deposit-tokens.ts` tetap ada tapi delegasikan ke `use-tokens.ts` agar tidak breaking existing callers secara langsung
- **`assetId` (camelCase)** sebagai field pengganti nested `asset` object — sesuai CLAUDE.md backend naming convention untuk response fields
- **Backend dan frontend bisa dikerjakan paralel** setelah U1+U2 dan U3 selesai; U5 dan U6 tidak bisa mulai sebelum backend sudah return `assetId`-only

---

## Open Questions

### Resolved During Planning

- **Field name pengganti**: `assetId` (camelCase) — dikonfirmasi user, sesuai CLAUDE.md
- **Cache strategy**: Stale-while-revalidate — dikonfirmasi user
- **Persist plugin**: Tidak install baru; pakai hand-rolled — karena plugin belum ada di stack dan pola sudah ada di codebase
- **Endpoint source of truth**: `GET /deposit/tokens` — dikonfirmasi user
- **`Token` type name collision**: Rename `lib/tokens.ts` existing type ke `StaticToken`; buat `Token` baru di `src/types/`

### Deferred to Implementation

- Apakah `use-deposit-tokens.ts` dihapus atau hanya re-export dari `use-tokens.ts`: implementor harus cek apakah ada consumer yang import dari path tersebut secara langsung dan putuskan removal vs delegation
- Apakah `centuari_tokens` localStorage key perlu versioning (e.g., `centuari_tokens_v1`) untuk handle breaking shape changes di masa depan: keputusan dapat dibuat saat implementasi berdasarkan stabilitas shape

---

## High-Level Technical Design

> *Ini adalah gambaran arah implementasi untuk review, bukan spesifikasi implementasi. Implementor memperlakukannya sebagai konteks, bukan kode yang harus direproduksi.*

```
App Load
  │
  ├─ useTokens() dipanggil (app-level, sekali)
  │     │
  │     ├─ localStorage["centuari_tokens"] ada?
  │     │     ├─ Ya  → set state langsung (zero delay)
  │     │     │         trigger background fetch → update localStorage + state silently
  │     │     └─ Tidak → tampilkan loading → fetch → simpan → render
  │     │
  │     └─ Expose: getTokenById(assetId) → Token | undefined
  │
  ├─ Backend response: { assetId: "uuid" }  (tidak ada nested asset)
  │
  └─ Component:
        const token = getTokenById(order.assetId)
        render: token?.symbol, token?.imageUrl
```

**Data contract setelah refactor:**

```
// Backend response (orders, positions, history, market)
{ ..., assetId: "c9b79b46-..." }       ← sebelumnya: asset: { id, name, symbol, ... }

// localStorage["centuari_tokens"]
[{ id, symbol, name, tokenAddress, decimals, imageUrl, chainId }, ...]

// Frontend lookup
getTokenById("c9b79b46-...") → { id: "...", symbol: "USDC", ... }
```

---

## Implementation Units

- U1. **[BE] Strip Asset Metadata dari Portfolio Queries dan DTOs**

**Goal:** Hapus asset JOIN dan metadata fields dari 4 query type di portfolio; kembalikan hanya `assetId`

**Requirements:** R1, R6

**Dependencies:** None

**Files:**
- Modify: `[BE] src/portfolio/repositories/portfolio.repository.ts`
- Modify: `[BE] src/portfolio/dto/open-orders.dto.ts`
- Modify: `[BE] src/portfolio/dto/order-history.dto.ts`
- Modify: `[BE] src/portfolio/dto/transaction-history.dto.ts`
- Modify: `[BE] src/portfolio/dto/portfolio.dto.ts`
- Modify: `[BE] src/portfolio/service.ts`
- Modify: `[BE] src/portfolio/service.ts` (test file paths mirror src/)
- Test: `[BE] src/__test__/portfolio/`

**Approach:**
- `getOpenOrders` (raw SQL): hapus `a.name, a.symbol, a.image_url, COALESCE(a.decimals,0) as decimals, a.token_address` dari SELECT; hapus `JOIN assets a ON o.asset_id = a.id`; pertahankan `o.asset_id as asset_id`
- `getOrderHistory` (raw SQL): sama — hapus kolom metadata dari SELECT, hapus JOIN line 508, pertahankan `o.asset_id`
- `getTransactionHistory` (raw SQL): sama — hapus kolom metadata, hapus JOIN line 755, pertahankan `m.asset_id`
- `getUserPositions` (QueryBuilder): hapus lima `.addSelect("t.symbol"/"t.name"/"t.token_address"/"t.image_url"/"t.decimals")`, hapus `.innerJoin("assets", "t", ...)` (lines 235 + 293 untuk lend/borrow), hapus semua `t.*` dari `.addGroupBy()`
- `RawOpenOrderRow`, `RawOrderHistoryRow`, `RawTransactionHistoryRow`, `RawPosition`: hapus fields `name`, `symbol`, `image_url`, `decimals`, `token_address` — pertahankan `asset_id`
- `OpenOrderItem`, `OrderHistoryItem`, `TransactionHistoryItem`: ganti `asset: AssetDto` → `assetId: string`; hapus import `AssetDto`
- `MyPositionItemDto`: hapus flat fields `symbol`, `name`, `imageUrl`; tambah `assetId: string`
- `portfolio.service.ts`: di semua 4 mapping sections, hapus konstruksi `asset: { id, name, symbol, ... }` / flat symbol/name/imageUrl; tambah `assetId: row.asset_id`

**Patterns to follow:**
- `[BE] src/orders/dto/order-response.dto.ts` — sudah pakai `assetId: string` tanpa nested object

**Test scenarios:**
- Happy path: `getOpenOrders()` returns list dengan `assetId` string, tanpa `asset.name`/`asset.symbol` fields
- Happy path: `getOrderHistory()` returns `assetId` bukan nested `asset` object
- Happy path: `getTransactionHistory()` returns `assetId` bukan nested `asset` object
- Happy path: `getUserPositions()` returns positions dengan `assetId`, tanpa `symbol`/`name`/`imageUrl` flat fields
- Edge case: query dengan zero results tetap return array kosong tanpa error
- Edge case: filter by `assetId` query param tetap berfungsi (kolom filter beda dari kolom SELECT)

**Verification:**
- `pnpm run test` di backend lulus
- Response JSON dari `/portfolio/open-orders`, `/portfolio/order-history`, `/portfolio/transaction-history`, `/portfolio/positions` tidak mengandung `name`, `symbol`, `decimals`, `imageUrl` fields
- `assetId` hadir di semua response tersebut

---

- U2. **[BE] Strip Asset Metadata dari Market Responses**

**Goal:** Hapus nested `asset` object dari market snapshot dan detail responses; kembalikan hanya `assetId`

**Requirements:** R1, R6

**Dependencies:** None

**Files:**
- Modify: `[BE] src/market/dto/market.dto.ts`
- Modify: `[BE] src/market/market.service.ts`
- Test: `[BE] src/__test__/market/`

**Approach:**
- `MarketItemDto`: ganti inline type `asset: { id, name, symbol, decimals, image_url }` → `assetId: string`
- `MarketDetailResponseDto`: ganti inline type `asset: { id, name, symbol, decimals, imageUrl }` → `assetId: string`
- `getMarketSnapshot()` (lines 87–94): ganti `asset: { id: asset.id, name: ..., ... }` → `assetId: asset.id`
- `getMarketDetail()` (lines 146–151): sama → `assetId: asset.id`
- Market service tidak melakukan SQL JOIN untuk asset — data asset di-fetch dari `TokensService` (in-memory cache); setelah refactor, hanya `asset.id` yang diperlukan

**Patterns to follow:**
- `[BE] src/orders/dto/order-response.dto.ts` — pattern `assetId: string`

**Test scenarios:**
- Happy path: `getMarketSnapshot()` returns array dengan `assetId` per item, tanpa `asset.name`/`asset.symbol`
- Happy path: `getMarketDetail()` returns detail dengan `assetId`, tanpa nested `asset` object
- Edge case: market dengan asset yang tidak dikenal tetap return `assetId` string, tidak throw

**Verification:**
- `pnpm run test` di backend lulus
- Response `/market` dan `/market/:id` tidak mengandung nested `asset` object

---

- U3. **[FE] Unified `Token` Type dan Query Keys**

**Goal:** Definisikan satu tipe `Token` kanonik di `src/types/`; rename konflik type; tambah `TOKENS` key ke registry

**Requirements:** R2

**Dependencies:** None (bisa paralel dengan U1/U2)

**Files:**
- Create: `src/types/token.ts`
- Modify: `src/lib/tokens.ts` (rename `Token` → `StaticToken`)
- Modify: `src/lib/query-keys.ts` (tambah `TOKENS`)
- Modify: `src/types/index.ts` (re-export `Token` jika ada barrel export)

**Approach:**
- Buat `src/types/token.ts` dengan tipe `Token` yang mirip shape `DepositToken` di `api.ts` (camelCase, fields: `id`, `symbol`, `name`, `tokenAddress`, `decimals`, `imageUrl`, `chainId`); ini adalah canonical type yang menggantikan semua definisi tersebar
- Di `lib/tokens.ts`, rename `type Token = (typeof TOKENS)[number]` → `type StaticToken = ...`; update semua penggunaan type ini di file yang sama
- Di `lib/query-keys.ts`, tambah `TOKENS: "tokens"` ke object `QUERY_KEYS`; **jangan** tambahkan ke `invalidateUserQueries()` — token metadata bukan user-specific data
- Cek `src/types/index.ts` atau barrel exports: pastikan `Token` bisa diimport dari `@/types`

**Patterns to follow:**
- Shape `DepositToken` di `src/lib/api.ts` (lines 467–475) — camelCase, termasuk `tokenAddress` dan `chainId`
- CLAUDE.md: "Shared types in `types/`"
- CLAUDE.md: "Query keys centralized — all query keys defined in `lib/query-keys.ts`"

**Test scenarios:**
- Test expectation: none — unit ini hanya type definitions dan constants; TypeScript compiler validation adalah verification-nya

**Verification:**
- `pnpm run build` atau `tsc --noEmit` lulus tanpa type error
- `Token` bisa diimport dari `@/types/token`
- `QUERY_KEYS.TOKENS` tersedia
- Tidak ada `type Token = (typeof TOKENS)[number]` lagi di `lib/tokens.ts`

---

- U4. **[FE] Global Token Store Hook (`use-tokens.ts`)**

**Goal:** Buat hook `useTokens()` dengan localStorage-first + stale-while-revalidate; update `use-deposit-tokens.ts` agar pakai `QUERY_KEYS.TOKENS`

**Requirements:** R3, R4, R5

**Dependencies:** U3

**Files:**
- Create: `src/hooks/use-tokens.ts`
- Modify: `src/hooks/use-deposit-tokens.ts`
- Test: `src/__tests__/hooks/use-tokens.test.ts`

**Approach:**
- `use-tokens.ts` mengikuti pola `use-portfolio-from-storage.ts`:
  - SSR guard: `if (typeof window === "undefined") return { tokens: [], getTokenById: () => undefined, isLoading: true }`
  - Read localStorage `centuari_tokens` dalam `try/catch`; jika ada, set initial state langsung (zero delay)
  - Gunakan `useQuery` dengan `queryKey: [QUERY_KEYS.TOKENS]`, `staleTime: QUERY_CONFIG.DEPOSIT_TOKENS_STALE_TIME`, fetch ke `getDepositTokens()` dari `lib/api.ts`
  - Di `select` atau `useEffect` setelah query success: tulis ke localStorage `centuari_tokens`; dispatch custom event `centuari-tokens-updated` untuk same-tab broadcast
  - Return: `tokens: Token[]`, `getTokenById(id: string): Token | undefined`, `isLoading: boolean`
- `use-deposit-tokens.ts`: ganti hardcoded `["deposit-tokens"]` → `[QUERY_KEYS.TOKENS]`; pertahankan interface yang sama agar tidak breaking existing callers (wrapper thin di atas `use-tokens`)

**Patterns to follow:**
- `src/hooks/use-portfolio-from-storage.ts` — SSR guard, try/catch, custom event dispatch
- `src/contexts/price-context.tsx` — per-ID selector pattern (`useTokenPrice(assetId)`)
- CLAUDE.md: "Hooks are the data layer", "Wrap TanStack Query — never use useQuery directly in components"

**Test scenarios:**
- Happy path: pertama kali load (localStorage kosong) → `isLoading: true` → setelah fetch berhasil → `tokens` berisi data, `isLoading: false`
- Happy path: load berikutnya (localStorage ada) → `tokens` tersedia segera (`isLoading: false` dari awal), background fetch terjadi, localStorage terupdate
- Happy path: `getTokenById("valid-uuid")` → return token object yang tepat
- Edge case: `getTokenById("unknown-uuid")` → return `undefined`
- Edge case: localStorage corrupt/invalid JSON → `try/catch` → fallback ke empty state, fetch dari network
- Edge case: fetch gagal (network error) tapi localStorage ada → return data dari localStorage, tidak crash
- Error path: SSR environment (`typeof window === "undefined"`) → return `{ tokens: [], getTokenById: () => undefined, isLoading: true }` tanpa memanggil localStorage
- Integration: setelah `useQuery` fetch success, localStorage `centuari_tokens` berisi data yang baru

**Verification:**
- `pnpm run test` lulus
- Di browser, setelah load pertama: `localStorage.getItem("centuari_tokens")` berisi JSON array tokens
- Load berikutnya: token tersedia sebelum network response selesai

---

- U5. **[FE] Update API Response Types di `lib/api.ts`**

**Goal:** Ganti semua nested `asset` object di response types dengan `assetId: string`; hapus type definitions yang redundan

**Requirements:** R1, R2

**Dependencies:** U3

**Files:**
- Modify: `src/lib/api.ts`
- Test: `src/__tests__/lib/api.test.ts` (jika ada)

**Approach:**
- Hapus interface `MarketAsset` (lines 3–9) dan `OrderHistoryAsset` (lines 586–593)
- `MarketItem`: ganti `asset: MarketAsset` → `assetId: string`
- `MarketDetailResponse`: ganti inline `asset: { id, name, symbol, decimals, imageUrl }` → `assetId: string`
- `OrderHistoryItem`: ganti `asset: OrderHistoryAsset` → `assetId: string`
- `TransactionHistoryItem`: ganti `asset: OrderHistoryAsset` → `assetId: string`
- `OpenOrderItem`: ganti `asset: OrderHistoryAsset` → `assetId: string`
- `MyPositionItem`: hapus flat fields `symbol`, `name`, `imageUrl`; tambah `assetId: string`
- `MyAssetItem`: hapus flat `symbol`, `name`, `imageUrl`; tambah `assetId: string` (verify dulu apakah BE juga sudah mengirim `assetId` di `/portfolio/assets` — jika belum, ini adalah scope backend tambahan yang perlu di-flag)
- `UserAssetDetail`: sama dengan `MyAssetItem` — flag jika endpoint belum diubah di U1
- `DepositToken`: tetap ada untuk `getDepositTokens()` function — ini adalah shape source of truth; dapat dijadikan `Token` type alias atau tetap terpisah
- **Jangan hapus `getDepositTokens()` function** — masih dipakai oleh `use-tokens.ts`

**Patterns to follow:**
- Existing `DepositToken` shape (camelCase) sebagai referensi
- CLAUDE.md: "No `any` casts", TypeScript strict

**Test scenarios:**
- Test expectation: none untuk test file — type-only changes; verification via TypeScript compiler
- Integration: setelah U1/U2 selesai dan backend di-run, semua API calls yang mengkonsumsi types ini harus compile tanpa error

**Verification:**
- `tsc --noEmit` atau `pnpm run build` lulus
- Tidak ada lagi `asset.symbol`, `asset.name`, `asset.imageUrl` di API response type definitions
- Semua response types menggunakan `assetId: string`

---

- U6. **[FE] Migrate Semua Consumers ke Token Store Lookup**

**Goal:** Ganti semua penggunaan `useDepositTokens()` dan direct `asset.*` field access dengan lookup via `useTokens()` / `getTokenById(assetId)`

**Requirements:** R2, R4

**Dependencies:** U4, U5

**Files:**
- Modify: `src/components/centuari-deposit-dialog.tsx`
- Modify: `src/components/centuari-lend-dialog.tsx`
- Modify: `src/components/faucet/faucet-token-grid.tsx`
- Modify: `src/hooks/use-on-chain-balance.ts`
- Modify: `src/components/home/token-grid.tsx`
- Modify: `src/components/market/position-section.tsx`
- Modify: `src/hooks/use-market-detail.ts`
- Modify: `src/hooks/use-borrow-portfolio-data.ts`
- Modify: `src/hooks/use-lend-form.ts`
- Modify: `src/components/tables/shared-columns.tsx`
- Modify: `src/components/centuari-withdraw-dialog.tsx`
- Modify: `src/components/lend-deposit-view.tsx` (local re-definition `DepositToken` interface perlu dihapus)
- Test: `src/__tests__/hooks/` (relevant hook tests)

**Approach:**
- **Komponen yang sebelumnya pakai `useDepositTokens()` untuk token list** (`centuari-deposit-dialog`, `centuari-lend-dialog`, `faucet-token-grid`, `use-on-chain-balance`): ganti dengan `const { tokens } = useTokens()` dan filter/map sesuai kebutuhan
- **Komponen yang pakai `market.asset.*`** (`token-grid.tsx`): ganti `market.asset.id` → `market.assetId`, lalu `const token = getTokenById(market.assetId)` untuk ambil `symbol`/`imageUrl`/`name`
- **Komponen yang pakai `o.asset.*` / `t.asset.*`** (`position-section.tsx`, `shared-columns.tsx`): ganti dengan `getTokenById(o.assetId)` dan destruct fields yang dibutuhkan; handle `undefined` case (token mungkin belum loaded)
- **Hooks yang pakai `data?.asset.*`** (`use-market-detail.ts`, `use-borrow-portfolio-data.ts`, `use-lend-form.ts`): ganti direct field access dengan lookup; return `assetId` dan biarkan consumer lookup sendiri, atau expose `token` dari hasil lookup
- **`lend-deposit-view.tsx`**: hapus local re-definition `interface DepositToken { id, symbol, imageUrl }` dan gunakan `Token` dari `@/types/token`
- **Graceful undefined handling**: setiap `getTokenById()` call harus handle case `undefined` — tampilkan fallback (e.g., `token?.symbol ?? "Unknown"`) karena tokens mungkin belum loaded saat pertama kali render

**Patterns to follow:**
- CLAUDE.md: "Hooks are the data layer — components should not contain fetch logic"
- CLAUDE.md: "One hook per file", "Hook max size < 200 lines"
- `src/contexts/price-context.tsx` — pola single-ID selector

**Test scenarios:**
- Happy path: `centuari-deposit-dialog` renders token list dari `useTokens()` dengan symbol dan imageUrl yang benar
- Happy path: `token-grid.tsx` menampilkan token info via `getTokenById(market.assetId)` tanpa crash
- Happy path: `position-section.tsx` menampilkan `symbol` dan `imageUrl` dari token store untuk open orders dan transactions
- Edge case: `getTokenById(assetId)` returns `undefined` (tokens belum loaded) → komponen render fallback, tidak crash
- Edge case: `use-on-chain-balance.ts` dapat resolve `tokenAddress` dan `decimals` via `getTokenById(assetId)` untuk `useReadContract`
- Integration: setelah full flow (BE mengirim `assetId`, FE lookup dari store), komponen menampilkan data yang benar end-to-end

**Verification:**
- `pnpm run test` lulus
- `pnpm run build` lulus tanpa type error
- Tidak ada import `useDepositTokens` di komponen non-hook (hanya boleh di hooks)
- Tidak ada akses `*.asset.name`, `*.asset.symbol`, `*.asset.imageUrl` di komponen/hooks (sudah diganti dengan lookup)

---

## System-Wide Impact

- **Interaction graph:** `useTokens()` perlu dipanggil setinggi mungkin di tree (idealnya di layout/root), agar semua children sudah punya tokens saat render. Provider pattern seperti `PriceProvider` bisa dipertimbangkan jika banyak komponen membutuhkan lookup
- **Error propagation:** Jika `getTokenById()` return `undefined` (race condition: tokens belum loaded tapi component sudah render), komponen harus handle dengan graceful fallback — jangan throw, jangan blank render
- **State lifecycle risks:** localStorage `centuari_tokens` tidak punya expiry — jika shape berubah di masa depan, data lama akan gagal parse. Saat ini `try/catch` dengan fallback sudah cukup untuk handle korupsi
- **API surface parity:** Endpoint `/portfolio/assets` (untuk `MyAssetItem`) dan `/user-details` (untuk `UserAssetDetail`) mungkin juga embed token metadata flat — perlu dikonfirmasi apakah termasuk dalam scope U1 atau perlu BE task terpisah
- **Integration coverage:** Setelah U1+U2 deployed, frontend yang belum di-update (U5/U6) akan menerima response tanpa `asset.*` fields dan akan crash/render blank — deploy harus dilakukan bersamaan atau FE harus di-deploy lebih dulu
- **Unchanged invariants:** `GET /deposit/tokens` endpoint tidak berubah; `TokensService` backend (in-memory cache) tidak berubah; `invalidateUserQueries()` tidak diubah (tokens bukan user-specific)

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| FE deploy tidak sinkron dengan BE deploy: FE lama masih expect `asset.*`, BE sudah kirim hanya `assetId` | Koordinasikan deploy; atau FE backward-compat: cek `response.asset?.id ?? response.assetId` sementara |
| `MyAssetItem` dan `UserAssetDetail` mungkin juga embed token metadata flat — belum diverifikasi di U1 | Verifikasi di awal U1; jika iya, tambahkan ke scope; jika tidak, catat sebagai deferred |
| `Token` type collision di `lib/tokens.ts` jika rename terlupa sebelum U6 | U3 harus selesai dan di-verify (`tsc --noEmit`) sebelum U4/U5 dimulai |
| `centuari-lend-dialog.tsx` pakai `depositTokens[0].id` sebagai default value — perlu handle loading state | Tambah guard: jika `tokens.length === 0`, jangan set default; atau set setelah `isLoading` false |
| SSR di Next.js: `useTokens()` dipanggil di server (typeof window undefined) → localStorage tidak tersedia | Wajib ikuti SSR guard dari `use-portfolio-from-storage.ts` |

---

## Sources & References

- **Origin document:** [docs/brainstorms/cent-114-token-metadata-optimization-requirements.md](docs/brainstorms/cent-114-token-metadata-optimization-requirements.md)
- Pattern references: `src/hooks/use-portfolio-from-storage.ts`, `src/contexts/price-context.tsx`
- Backend reference pattern: `[BE] src/orders/dto/order-response.dto.ts`
- Backend CLAUDE.md: `centuari-backend-v2/backend-v2/CLAUDE.md`
- Frontend CLAUDE.md: `src/` (Next.js, TanStack Query conventions)
