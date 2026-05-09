#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/home/ubuntu/exit-smiling-site/exit-smiling-backend"
SERVER_DIR="$APP_DIR/.medusa/server"
STATIC_SOURCE="/var/www/exit-smiling-static"

cd "$APP_DIR"

git pull --ff-only
npm install --include=dev --no-audit --no-fund --foreground-scripts=false
NODE_OPTIONS="--max-old-space-size=1536" npm run build

cp "$APP_DIR/.env" "$SERVER_DIR/.env"

cd "$SERVER_DIR"
npm ci --omit=dev --no-audit --no-fund --foreground-scripts=false

if [ -d "$STATIC_SOURCE" ]; then
  mkdir -p "$SERVER_DIR/static"
fi

pm2 restart exit-smiling-medusa --update-env
