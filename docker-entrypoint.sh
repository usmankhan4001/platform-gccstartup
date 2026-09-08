#!/bin/sh
set -e

echo "=== GCC Startup Platform ==="
echo "Running database migrations..."

cd /app

# Migrations are additive and idempotent, so this is safe on every boot. A
# failure is logged loudly but does not stop the app from starting — a site
# that serves stale content beats a container that crash-loops on boot.
if node migrate.mjs; then
  echo "Migrations applied"
else
  echo "WARNING: migrations did not apply — check DATABASE_URL and the logs above" >&2
fi

echo "Starting application..."
exec "$@"
