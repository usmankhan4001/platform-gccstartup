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

# First-run seed. Idempotent (upserts by natural key), so it is safe on every
# boot, and it only runs when the operator has supplied admin credentials —
# without them a fresh database would have no user to log in with.
if [ -n "$SEED_ADMIN_PASSWORD" ]; then
  echo "Seeding database..."
  if node seed.mjs; then
    echo "Seed complete"
  else
    echo "WARNING: seed did not complete — check the logs above" >&2
  fi
else
  echo "SEED_ADMIN_PASSWORD not set — skipping seed"
fi

echo "Starting application..."
exec "$@"
