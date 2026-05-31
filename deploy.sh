#!/usr/bin/env bash
set -euo pipefail

# ── Smart Quran deploy script ─────────────────────────────────────────────────
# Usage:
#   ./deploy.sh          # full deploy
#   ./deploy.sh --pull   # pull latest images first

COMPOSE="docker compose"
PULL=${1:-}

echo "▶ Smart Quran deployment"

# Ensure .env exists
if [ ! -f .env ]; then
  echo "ERROR: .env not found. Copy .env.example and fill in values."
  exit 1
fi

# Validate required secrets
source .env
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD must be set in .env}"
: "${SECRET_KEY:?SECRET_KEY must be set in .env}"
: "${TELEGRAM_BOT_TOKEN:?TELEGRAM_BOT_TOKEN must be set in .env}"

# Pull latest code
if [ "$PULL" = "--pull" ]; then
  echo "▶ Pulling latest code..."
  git pull origin main
fi

echo "▶ Building images..."
$COMPOSE build --no-cache

echo "▶ Starting database..."
$COMPOSE up -d db
echo "  Waiting for Postgres to be healthy..."
until $COMPOSE exec -T db pg_isready -U "${POSTGRES_USER:-sq_user}" -d smart_quran &>/dev/null; do
  sleep 1
done

echo "▶ Starting backend..."
$COMPOSE up -d backend

echo "▶ Starting frontend..."
$COMPOSE up -d frontend

echo "▶ Starting nginx..."
$COMPOSE up -d nginx

echo "▶ Checking health..."
sleep 5
$COMPOSE ps

echo ""
echo "✅ Deployment complete."
echo "   Frontend: https://smartquran.app"
echo "   API:      https://smartquran.app/health"
