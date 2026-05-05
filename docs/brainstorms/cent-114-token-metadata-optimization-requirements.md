# CENT-114: Token Metadata Optimization

**Date:** 2026-05-05
**Status:** Ready for planning
**Scope:** Standard — FE + BE

---

## Problem

Token/asset metadata (`symbol`, `name`, `decimals`, `imageUrl`, `tokenAddress`) saat ini di-embed di hampir semua backend response — orders, positions, market data, history — via SQL JOIN ke tabel `assets`. Akibatnya:

- Data metadata yang sama dikirim berulang kali di setiap API response
- Setiap query melakukan JOIN ke tabel `assets` yang tidak perlu
- Frontend tidak punya centralized token store; tiap endpoint punya type definisi sendiri-sendiri (`MarketAsset`, `DepositToken`, `OrderHistoryAsset`, dll.)

---

## Goal

Fetch token metadata **sekali** dan cache secara lokal di frontend. Semua response API lainnya hanya mengembalikan `assetId` sebagai referensi, dan frontend meresolve metadata dari cache lokal.

---

## Source of Truth

**`GET /deposit/tokens`** — endpoint yang sudah ada, mengembalikan semua token dengan metadata lengkap.

Response shape (existing):
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "uuid",
      "symbol": "USDC",
      "name": "USD Coin",
      "tokenAddress": "0x...",
      "decimals": 6,
      "imageUrl": "/tokens/usdc-icon.webp",
      "chainId": "421614"
    }
  ]
}
```

---

## Backend Requirements

### Responses yang dimodifikasi

Keempat response type berikut **tidak lagi** menyertakan nested asset metadata. Field `assetId` (yang sudah ada di data) tetap dikembalikan sebagai satu-satunya referensi ke token.

| Response | Sebelum | Sesudah |
|---|---|---|
| Orders / Open Orders | `asset: { id, name, symbol, decimals, imageUrl, tokenAddress }` | `assetId: string` |
| Portfolio Positions (lend/borrow) | `symbol`, `name`, `token_address`, `image_url`, `decimals` via JOIN | `assetId: string` |
| Order History / Matches | `asset: { id, name, symbol, ... }` via JOIN | `assetId: string` |
| Market Responses | `asset: { id, name, symbol, decimals, imageUrl }` | `assetId: string` |

### Naming convention

Mengikuti CLAUDE.md: field di response menggunakan **camelCase**.

```
// Sebelum
{
  "asset": {
    "id": "c9b79b46-...",
    "name": "USD Coin",
    "symbol": "USDC",
    "decimals": 6,
    "imageUrl": "/tokens/usdc-icon.webp"
  }
}

// Sesudah
{
  "assetId": "c9b79b46-..."
}
```

### Konsekuensi backend

- SQL JOIN ke tabel `assets` dihapus dari semua 4 query type di atas
- DTO yang menyertakan nested asset fields diperbarui (hapus field metadata, pastikan `assetId` ada)
- Backend `TokensService` (in-memory cache) tidak berubah — masih digunakan untuk internal validation

---

## Frontend Requirements

### Token store (localStorage)

- **Storage key:** `centuari_tokens`
- **Value:** serialized JSON array dari token objects (shape mengikuti response `/deposit/tokens`)
- **Unified type:** Buat satu tipe `Token` yang digunakan di seluruh codebase, menggantikan semua definisi yang ada (`MarketAsset`, `DepositToken`, `OrderHistoryAsset`, dll.)

### Loading strategy: Stale-While-Revalidate

Setiap kali app load:

1. **Baca dari localStorage** — jika ada data, langsung tersedia untuk rendering (zero delay)
2. **Fetch di background** — trigger fetch ke `/deposit/tokens` secara paralel
3. **Update store** — ketika fresh data tiba, update localStorage dan in-memory state secara silent
4. **First visit (localStorage kosong)** — tampilkan loading state sampai fetch selesai, lalu render

```
App load
  ├─ localStorage ada → sajikan langsung → background fetch → update silently
  └─ localStorage kosong → fetch → simpan → render
```

### Global token resolution

- Semua komponen yang sebelumnya menerima token metadata dari API response kini menggunakan `assetId` untuk lookup ke token store lokal
- Sediakan helper/hook untuk lookup: `getTokenById(assetId: string): Token | undefined`

### Lokasi perubahan frontend (unverified — konfirmasi saat planning)

- `src/lib/api.ts` — unifikasi type definisi token
- `src/hooks/` — buat hook baru untuk global token store (misal `use-tokens.ts`)
- `src/lib/query-keys.ts` — tambah query key untuk tokens
- Semua hooks yang saat ini mengkonsumsi metadata dari nested `asset` object di API responses

---

## Out of Scope

- Perubahan schema `/deposit/tokens` endpoint
- Penambahan token baru ke sistem
- TTL-based expiry (tidak diperlukan dengan stale-while-revalidate)
- Real-time token update via WebSocket (metadata token tidak berubah secara real-time)

---

## Success Criteria

- [ ] Response orders, positions, history, dan market tidak lagi menyertakan `name`, `symbol`, `decimals`, `imageUrl`, `tokenAddress` sebagai nested fields
- [ ] Frontend dapat merender token symbol/name dengan benar via lookup dari localStorage
- [ ] Tidak ada network call redundan untuk token metadata pada page load berikutnya (served dari localStorage)
- [ ] Background refresh terjadi setiap app load tanpa memblokir UI
- [ ] Hanya ada satu tipe `Token` yang digunakan di seluruh frontend codebase

---

## Dependencies

- Tidak ada perubahan database schema yang diperlukan
- Backend dan frontend dapat dikerjakan secara paralel setelah kontrak `assetId` disepakati
- Frontend perlu menyelesaikan token store sebelum bisa menghapus konsumsi metadata dari individual responses
