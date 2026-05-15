#!/usr/bin/env bash
#
# Build & deploy frontend-revamp dari laptop ke VPS (skip CI).
# Cocok untuk Apple Silicon (M1/M2/M3) — build cross-platform ke linux/amd64.
#
# Usage:
#   ./scripts/deploy-local.sh dev
#   ./scripts/deploy-local.sh staging
#   ./scripts/deploy-local.sh prod
#
# Prasyarat:
#   1. Docker Desktop (atau OrbStack) running di laptop
#   2. SSH key ke VPS: ~/.ssh/centuari_id_ed25519
#   3. Buildx builder dengan support multi-platform
#      Cek: docker buildx ls
#      Bikin kalau belum: docker buildx create --name centuari-builder --use
#   4. File .env.<env>.build di repo root frontend-revamp (gitignored)
#      Contoh: .env.dev.build, .env.staging.build, .env.prod.build
#      Lihat .env.build.example untuk template

set -euo pipefail

# ─── Config ──────────────────────────────────────────────────────────────────
SSH_KEY="${SSH_KEY:-$HOME/.ssh/centuari_id_ed25519}"
SSH_USER="${SSH_USER:-centuari-app}"
TUNNEL_PORT=5000

# Edit IP VPS sesuai setup kamu (atau set lewat env var saat run)
VPS_NONPROD="${VPS_NONPROD:-}"     # ip VPS dev+staging
VPS_PROD="${VPS_PROD:-}"           # ip VPS prod

# ─── Parse args ──────────────────────────────────────────────────────────────
ENV="${1:-}"
if [[ -z "$ENV" ]]; then
    echo "Usage: $0 <dev|staging|prod>"
    exit 1
fi

case "$ENV" in
    dev)
        VPS_IP="$VPS_NONPROD"
        NAMESPACE="centuari-dev"
        SERVICE="frontend-dev"
        COMPOSE_FILE="compose.dev.yml"
        PROJECT_NAME="centuari-dev"
        ;;
    staging)
        VPS_IP="$VPS_NONPROD"
        NAMESPACE="centuari-staging"
        SERVICE="frontend-staging"
        COMPOSE_FILE="compose.staging.yml"
        PROJECT_NAME="centuari-staging"
        ;;
    prod)
        VPS_IP="$VPS_PROD"
        NAMESPACE="centuari"
        SERVICE="frontend"
        COMPOSE_FILE="compose.prod.yml"
        PROJECT_NAME=""    # prod pakai default project
        ;;
    *)
        echo "Unknown env: $ENV (must be dev|staging|prod)"
        exit 1
        ;;
esac

if [[ -z "$VPS_IP" ]]; then
    echo "VPS_IP kosong. Set VPS_NONPROD / VPS_PROD env var, atau edit script."
    echo "Contoh:"
    echo "  VPS_NONPROD=1.2.3.4 ./scripts/deploy-local.sh dev"
    exit 1
fi

# ─── Load build vars ─────────────────────────────────────────────────────────
ENV_BUILD_FILE=".env.$ENV.build"
if [[ ! -f "$ENV_BUILD_FILE" ]]; then
    echo "❌ File $ENV_BUILD_FILE tidak ada."
    echo "   Bikin dari .env.build.example, isi dengan NEXT_PUBLIC_* untuk env $ENV"
    exit 1
fi

# Load NEXT_PUBLIC_* dari file
set -a
# shellcheck disable=SC1090
source "$ENV_BUILD_FILE"
set +a

# Verify minimum vars set
if [[ -z "${NEXT_PUBLIC_PRIVY_APP_ID:-}" ]]; then
    echo "❌ NEXT_PUBLIC_PRIVY_APP_ID kosong di $ENV_BUILD_FILE"
    exit 1
fi
if [[ -z "${NEXT_PUBLIC_WS_URL:-}" ]]; then
    echo "❌ NEXT_PUBLIC_WS_URL kosong di $ENV_BUILD_FILE"
    exit 1
fi

# ─── Compute tags ────────────────────────────────────────────────────────────
GIT_SHA="$(git rev-parse --short HEAD 2>/dev/null || echo "manual-$(date +%s)")"
IMAGE_LATEST="localhost:$TUNNEL_PORT/$NAMESPACE/frontend-revamp:latest"
IMAGE_SHA="localhost:$TUNNEL_PORT/$NAMESPACE/frontend-revamp:$GIT_SHA"

echo "═══════════════════════════════════════════════════════════"
echo "  Frontend Local Deploy"
echo "═══════════════════════════════════════════════════════════"
echo "  Env:        $ENV"
echo "  Namespace:  $NAMESPACE"
echo "  Service:    $SERVICE"
echo "  VPS:        $SSH_USER@$VPS_IP"
echo "  SHA:        $GIT_SHA"
echo "  Tags:       $IMAGE_LATEST"
echo "              $IMAGE_SHA"
echo "═══════════════════════════════════════════════════════════"
echo

# ─── Pre-flight checks ───────────────────────────────────────────────────────
echo "🔍 Pre-flight checks..."

# SSH key exists
if [[ ! -f "$SSH_KEY" ]]; then
    echo "❌ SSH key tidak ada: $SSH_KEY"
    exit 1
fi

# SSH ke VPS sukses
if ! ssh -i "$SSH_KEY" -o ConnectTimeout=5 -o StrictHostKeyChecking=accept-new \
    "$SSH_USER@$VPS_IP" "echo OK" > /dev/null 2>&1; then
    echo "❌ SSH ke $SSH_USER@$VPS_IP gagal"
    exit 1
fi

# buildx builder available
if ! docker buildx ls | grep -q "centuari-builder\|default"; then
    echo "❌ Docker buildx tidak tersedia. Install Docker Desktop atau jalankan:"
    echo "   docker buildx create --name centuari-builder --use"
    exit 1
fi

echo "✓ Pre-flight OK"
echo

# ─── Build (cross-platform untuk Apple Silicon → linux/amd64) ────────────────
echo "🔨 Building image (linux/amd64)..."

docker buildx build \
    --platform linux/amd64 \
    --build-arg NEXT_PUBLIC_PRIVY_APP_ID="${NEXT_PUBLIC_PRIVY_APP_ID:-}" \
    --build-arg NEXT_PUBLIC_WS_URL="${NEXT_PUBLIC_WS_URL:-}" \
    --build-arg NEXT_PUBLIC_CHAIN_ENV="${NEXT_PUBLIC_CHAIN_ENV:-testnet}" \
    --build-arg NEXT_PUBLIC_USE_MOCK="${NEXT_PUBLIC_USE_MOCK:-false}" \
    --build-arg NEXT_PUBLIC_RPC_URL="${NEXT_PUBLIC_RPC_URL:-}" \
    --build-arg NEXT_PUBLIC_HUB_DEPOSITOR_ADDRESS="${NEXT_PUBLIC_HUB_DEPOSITOR_ADDRESS:-}" \
    --tag "$IMAGE_LATEST" \
    --tag "$IMAGE_SHA" \
    --load \
    .

echo "✓ Build done"
echo

# ─── Open SSH tunnel ─────────────────────────────────────────────────────────
echo "🔌 Opening SSH tunnel to $VPS_IP:$TUNNEL_PORT..."

# Cleanup tunnel lama (kalau ada dari run sebelumnya)
pkill -f "ssh.*-L $TUNNEL_PORT:127.0.0.1:$TUNNEL_PORT.*$VPS_IP" 2>/dev/null || true
sleep 1

ssh -f -N -i "$SSH_KEY" \
    -o ExitOnForwardFailure=yes \
    -o ServerAliveInterval=30 \
    -L "$TUNNEL_PORT:127.0.0.1:$TUNNEL_PORT" \
    "$SSH_USER@$VPS_IP"

# Wait & verify tunnel
sleep 2
if ! curl -sf "http://localhost:$TUNNEL_PORT/v2/" > /dev/null; then
    echo "❌ Tunnel terbuka tapi registry tidak respond"
    pkill -f "ssh.*-L $TUNNEL_PORT" 2>/dev/null || true
    exit 1
fi

echo "✓ Tunnel up, registry reachable"
echo

# Trap untuk cleanup tunnel kalau script gagal di tengah jalan
trap 'echo "Cleaning up tunnel..."; pkill -f "ssh.*-L '"$TUNNEL_PORT"':127.0.0.1:'"$TUNNEL_PORT"'" 2>/dev/null || true' EXIT

# ─── Push image ──────────────────────────────────────────────────────────────
echo "📤 Pushing $IMAGE_LATEST..."
docker push "$IMAGE_LATEST"
echo "📤 Pushing $IMAGE_SHA..."
docker push "$IMAGE_SHA"
echo "✓ Push done"
echo

# ─── Close tunnel manually (sebelum deploy SSH) ──────────────────────────────
pkill -f "ssh.*-L $TUNNEL_PORT:127.0.0.1:$TUNNEL_PORT" 2>/dev/null || true
trap - EXIT

# ─── Deploy: SSH ke VPS, pull image, restart container ───────────────────────
echo "🚀 Deploying to VPS..."

if [[ "$ENV" == "prod" ]]; then
    DEPLOY_CMD="cd ~/centuari && docker compose -f $COMPOSE_FILE pull $SERVICE && docker compose -f $COMPOSE_FILE up -d --no-deps $SERVICE"
else
    DEPLOY_CMD="cd ~/centuari && docker compose -f $COMPOSE_FILE -p $PROJECT_NAME pull $SERVICE && docker compose -f $COMPOSE_FILE -p $PROJECT_NAME up -d --no-deps $SERVICE"
fi

ssh -i "$SSH_KEY" "$SSH_USER@$VPS_IP" "$DEPLOY_CMD"

echo "✓ Deploy done"
echo

# ─── Verify ──────────────────────────────────────────────────────────────────
echo "✅ Frontend deployed to $ENV!"
echo
echo "Verify:"
case "$ENV" in
    dev)     echo "  https://dev.centuari.example" ;;
    staging) echo "  https://staging.centuari.example" ;;
    prod)    echo "  https://app.centuari.example" ;;
esac
echo
echo "Cek log container:"
echo "  ssh $SSH_USER@$VPS_IP 'docker logs -f centuari-${ENV/prod/}${ENV/prod/-}frontend'"
