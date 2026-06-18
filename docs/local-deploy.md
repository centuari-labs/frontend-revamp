# Local Deploy — Frontend Revamp

Build & deploy frontend Docker image **dari laptop kamu** (skip CI/CD), langsung ke registry di VPS dan deploy container. Cocok untuk:

- 🚀 Iterate cepat tanpa nunggu CI (~5 menit lebih cepat per cycle)
- 🔧 Bypass CI saat ada masalah workflow
- 🐛 Hotfix urgent ke prod
- 🧪 Test build dengan env vars custom

Script: `scripts/deploy-local.sh`

---

## Cara kerja

```
Laptop (Apple Silicon)                  VPS (linux/amd64)
┌──────────────────────────┐           ┌───────────────────────┐
│ 1. docker buildx build   │           │                       │
│    --platform linux/amd64│           │                       │
│    + NEXT_PUBLIC_* args  │           │                       │
│         ↓                │           │                       │
│ 2. SSH tunnel :5000 ─────┼──────────▶│ 127.0.0.1:5000        │
│         ↓                │           │ (registry container)  │
│ 3. docker push           │           │                       │
│         ↓                │           │                       │
│ 4. SSH deploy command ───┼──────────▶│ docker compose pull + │
│                          │           │ up -d frontend        │
└──────────────────────────┘           └───────────────────────┘
```

Build cross-platform (`linux/amd64`) wajib karena laptop M1/M2/M3 itu `arm64` tapi VPS pakai `amd64`.

---

## Prerequisites

### 1. Docker Desktop / OrbStack dengan buildx

```bash
docker buildx ls
```

Harus muncul builder dengan `linux/amd64` di list platforms. Kalau belum:

```bash
docker buildx create --name centuari-builder --use
docker buildx inspect --bootstrap
```

### 2. SSH key ke VPS

```bash
ls ~/.ssh/centuari_id_ed25519
```

Test SSH manual dulu:
```bash
ssh -i ~/.ssh/centuari_id_ed25519 centuari-app@<ip-vps> "echo OK && docker ps"
```

### 3. Registry running di VPS target

VPS-NONPROD: `centuari-registry` container running di port `127.0.0.1:5000`.
VPS-PROD: sama.

Verify dari laptop (lewat tunnel sementara):
```bash
ssh -L 5000:127.0.0.1:5000 centuari-app@<ip-vps> -N &
sleep 1
curl http://localhost:5000/v2/    # expected: {}
pkill -f "ssh.*5000:127"
```

### 4. Compose file di VPS sudah set up

VPS target harus sudah punya `~/centuari/compose.dev.yml` (atau staging/prod) yang reference image dari `127.0.0.1:5000/centuari-<env>/frontend-revamp:latest`.

---

## Setup pertama kali

### 1. Buat env build file untuk tiap environment

```bash
cd frontend-revamp

cp .env.build.example .env.dev.build
cp .env.build.example .env.staging.build
cp .env.build.example .env.prod.build
```

### 2. Isi value tiap file

`.env.dev.build`:
```env
NEXT_PUBLIC_PRIVY_APP_ID=cm5xxx...        # dev Privy App ID
NEXT_PUBLIC_WS_URL=https://dev-api.centuari.example
NEXT_PUBLIC_CHAIN_ENV=testnet
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_RPC_URL=
NEXT_PUBLIC_HUB_DEPOSITOR_ADDRESS=0x122ea513fE68d78CdAD06F982237B1b67a335439
```

`.env.staging.build`: sama struktur, ganti URL ke `staging-api.*` dan App ID Privy staging.

`.env.prod.build`:
```env
NEXT_PUBLIC_PRIVY_APP_ID=cm6xxx...        # prod Privy App ID
NEXT_PUBLIC_WS_URL=https://api.centuari.example
NEXT_PUBLIC_CHAIN_ENV=mainnet              # production = mainnet
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/<your-key>
NEXT_PUBLIC_HUB_DEPOSITOR_ADDRESS=<prod-hub-depositor-address>
```

> **Penting:** ketiga file otomatis di-gitignore via `.env.*.build` pattern. Jangan commit, value bisa beda per developer.

### 3. Set IP VPS via env var (sekali setup)

Tambah ke `~/.zshrc` atau `~/.bashrc`:

```bash
export VPS_NONPROD=1.2.3.4    # IP VPS dev+staging
export VPS_PROD=5.6.7.8       # IP VPS prod
```

Reload shell:
```bash
source ~/.zshrc
```

Atau set inline tiap run:
```bash
VPS_NONPROD=1.2.3.4 ./scripts/deploy-local.sh dev
```

---

## Usage

### Deploy ke dev

```bash
cd frontend-revamp
./scripts/deploy-local.sh dev
```

### Deploy ke staging

```bash
./scripts/deploy-local.sh staging
```

### Deploy ke prod

```bash
./scripts/deploy-local.sh prod
```

### Output normal

```
═══════════════════════════════════════════════════════════
  Frontend Local Deploy
═══════════════════════════════════════════════════════════
  Env:        dev
  Namespace:  centuari-dev
  Service:    frontend-dev
  VPS:        centuari-app@1.2.3.4
  SHA:        a1b2c3d
  Tags:       localhost:5000/centuari-dev/frontend-revamp:latest
              localhost:5000/centuari-dev/frontend-revamp:a1b2c3d
═══════════════════════════════════════════════════════════

🔍 Pre-flight checks...
✓ Pre-flight OK

🔨 Building image (linux/amd64)...
... (3-5 menit di Apple Silicon)
✓ Build done

🔌 Opening SSH tunnel to 1.2.3.4:5000...
✓ Tunnel up, registry reachable

📤 Pushing localhost:5000/centuari-dev/frontend-revamp:latest...
📤 Pushing localhost:5000/centuari-dev/frontend-revamp:a1b2c3d...
✓ Push done

🚀 Deploying to VPS...
✓ Deploy done

✅ Frontend deployed to dev!

Verify:
  https://dev.centuari.example
```

Total waktu: **~5-7 menit** dari mulai sampai container running.

---

## Verify deployment

### Cek image di registry

```bash
ssh centuari-app@<ip-vps>
curl -s http://127.0.0.1:5000/v2/centuari-dev/frontend-revamp/tags/list
# Expected: {"name":"centuari-dev/frontend-revamp","tags":["latest","a1b2c3d", ...]}
```

### Cek container running

```bash
docker ps | grep frontend
# Expected: centuari-dev-frontend ... Up X seconds
```

### Cek log

```bash
docker logs -f centuari-dev-frontend --tail 30
# Expected:
# ▲ Next.js 15.5.7
# - Local:        http://localhost:3200
# - Network:      http://0.0.0.0:3200
# ✓ Ready in 1.2s
```

### Test di browser

| Env | URL |
|---|---|
| dev | https://dev.centuari.example |
| staging | https://staging.centuari.example |
| prod | https://app.centuari.example |

---

## Troubleshooting

### `❌ SSH key tidak ada: /Users/wei/.ssh/centuari_id_ed25519`

Generate key, atau export `SSH_KEY` ke path lain:
```bash
SSH_KEY=~/.ssh/my-key.pem ./scripts/deploy-local.sh dev
```

### `❌ SSH ke centuari-app@... gagal`

- Cek IP VPS benar (`echo $VPS_NONPROD`)
- Cek SSH key sudah authorized di VPS (`~/.ssh/authorized_keys`)
- Test manual: `ssh -i ~/.ssh/centuari_id_ed25519 centuari-app@<ip>`

### `❌ Docker buildx tidak tersedia`

```bash
docker buildx create --name centuari-builder --use
docker buildx inspect --bootstrap
```

### `❌ NEXT_PUBLIC_PRIVY_APP_ID kosong di .env.dev.build`

Edit `.env.dev.build`, isi minimal `NEXT_PUBLIC_PRIVY_APP_ID` dan `NEXT_PUBLIC_WS_URL`.

### `❌ Tunnel terbuka tapi registry tidak respond`

Registry container di VPS belum jalan. SSH ke VPS:
```bash
ssh centuari-app@<ip-vps>
docker ps | grep registry
# Kalau tidak ada:
docker compose -f ~/centuari/compose.shared.yml up -d registry
```

### Build sukses tapi push timeout

Image Next.js besar (~500 MB - 1 GB), push lewat SSH tunnel bisa 1-3 menit. Kalau timeout terus:

```bash
# Test bandwidth ke VPS
ssh centuari-app@<ip-vps> "dd if=/dev/zero bs=1M count=100" | dd of=/dev/null bs=1M
# Kalau < 5 MB/s, network lambat, push akan lama
```

Workaround: split image jadi layer lebih kecil (multi-stage build sudah dilakukan, tapi node_modules tetap besar).

### Container `centuari-dev-frontend` crash loop "image not found"

Image push sukses tapi compose tidak bisa pull dari `127.0.0.1:5000`. Cek:

```bash
ssh centuari-app@<ip-vps>
docker pull 127.0.0.1:5000/centuari-dev/frontend-revamp:latest
# Kalau error "no such host", tag image salah. Pastikan workflow/script push pakai
# tag yang sama dengan compose file reference.
```

### Build error "platform not supported"

Pakai `--platform linux/amd64` (sudah ada di script). Kalau masih error, cek docker buildx versi:
```bash
docker buildx version
# Min v0.10
```

### Frontend load tapi semua API call gagal (CORS / 404)

- `NEXT_PUBLIC_WS_URL` kemungkinan kosong atau salah saat build → cek `.env.<env>.build`
- Build ulang dengan value yang benar (vars di-bake saat build, tidak bisa diganti runtime)

### Disk space habis di laptop

```bash
docker system df             # cek usage
docker system prune -af      # cleanup image/cache tidak dipakai
docker buildx prune -af      # cleanup buildx cache
```

---

## Comparison: Local Deploy vs CI/CD

| Aspek | Local Deploy | CI/CD (push branch) |
|---|---|---|
| Trigger | Manual command | Push commit |
| Build location | Laptop | GitHub-hosted runner (`ubuntu-latest`) |
| Build args source | `.env.<env>.build` lokal | GitHub Environment `vars.*` |
| Platform | `linux/amd64` (cross-build di M1/M2/M3) | `linux/amd64` native |
| Disk usage | Laptop ~2 GB cache + image | GitHub runner (gratis) |
| Total waktu | ~5-7 menit | ~7-10 menit |
| Audit trail | Tidak ada (manual run) | GitHub Actions log |
| Reproducibility | Per developer (env file beda) | Konsisten via Environment vars |
| Cocok untuk | Iterasi cepat, hotfix, test | Standard deploy workflow |

**Rekomendasi:**
- **Daily dev work** → push branch, biar CI yang handle (audit trail jelas)
- **Iterasi UI cepat** atau **hotfix prod urgent** → pakai local deploy
- **Test build args baru** sebelum commit ke GitHub Variables → local deploy

---

## Catatan keamanan

1. **`.env.*.build` jangan pernah di-commit** — sudah di-gitignore via pattern `.env.*.build`. Verify dengan `git check-ignore .env.dev.build`.
2. **`NEXT_PUBLIC_*` vars masuk ke client bundle** — bukan secret, tapi tetap hindari simpan API key sensitive di sini (pakai backend proxy untuk endpoint sensitive).
3. **SSH private key** — `~/.ssh/centuari_id_ed25519` jangan share. Kalau bocor, regenerate keypair + update `authorized_keys` di VPS.
4. **Local deploy bypass code review** — image yang kamu push langsung jadi production tanpa lewat PR. **Hati-hati untuk prod** — pertimbangkan tetap pakai CI/CD untuk prod, local deploy hanya dev/staging.

---

## Referensi

- Script: [`scripts/deploy-local.sh`](../scripts/deploy-local.sh)
- Env template: [`.env.build.example`](../.env.build.example)
- Dockerfile: [`Dockerfile`](../Dockerfile)
- CI workflow (alternatif): [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)
- VPS architecture overview: lihat `docs/deployment/multi-env-architecture.md` di repo root
