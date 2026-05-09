#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/home/ubuntu/exit-smiling-site/exit-smiling-backend"
SERVER_DIR="$APP_DIR/.medusa/server"
STATIC_SOURCES=(
  "$APP_DIR/static"
  "/home/ubuntu/static-upload"
  "/var/www/exit-smiling-static"
)
LOCAL_API_URL="http://localhost:9000"
PUBLIC_API_URL="${PUBLIC_API_URL:-https://api.exitsmiling.com.au}"

cd "$APP_DIR"

echo "Pulling latest backend code..."
git pull --ff-only

echo "Installing backend dependencies..."
npm install --include=dev --no-audit --no-fund --foreground-scripts=false

echo "Building Medusa with memory-safe Node settings..."
NODE_OPTIONS="--max-old-space-size=1536" npm run build

echo "Copying production environment file into built server..."
cp "$APP_DIR/.env" "$SERVER_DIR/.env"

cd "$SERVER_DIR"

echo "Installing production server dependencies..."
npm ci --omit=dev --no-audit --no-fund --foreground-scripts=false

echo "Copying static merch/media assets into built server..."
mkdir -p "$SERVER_DIR/static"
for source_dir in "${STATIC_SOURCES[@]}"; do
  if [ -d "$source_dir" ]; then
    cp -r "$source_dir"/. "$SERVER_DIR/static"/
    echo "Copied static assets from $source_dir"
  fi
done

echo "Restarting PM2 process..."
pm2 restart exit-smiling-medusa --update-env
pm2 save

echo "Checking local backend response..."
curl -fsS "$LOCAL_API_URL/store/regions" >/tmp/exit-smiling-local-health.txt || true
if grep -q "Publishable API key required" /tmp/exit-smiling-local-health.txt; then
  echo "Local backend health check passed."
else
  echo "Local backend health check did not return the expected Medusa response."
  cat /tmp/exit-smiling-local-health.txt
  exit 1
fi

echo "Checking public backend response..."
curl -fsS "$PUBLIC_API_URL/store/regions" >/tmp/exit-smiling-public-health.txt || true
if grep -q "Publishable API key required" /tmp/exit-smiling-public-health.txt; then
  echo "Public backend health check passed."
else
  echo "Public backend health check did not return the expected Medusa response."
  cat /tmp/exit-smiling-public-health.txt
  exit 1
fi

echo "Backend deploy complete."
