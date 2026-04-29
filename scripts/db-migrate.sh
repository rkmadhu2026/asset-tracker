#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ -f .env.local ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

if [[ -n "${DATABASE_URL:-}" ]]; then
  psql "$DATABASE_URL" -f "$ROOT/server/migrations/001_initial.sql"
  psql "$DATABASE_URL" -f "$ROOT/server/migrations/002_assets.sql"
else
  export PGPASSWORD="${PG_PASSWORD:-changeme}"
  HOST="${PG_HOST:-localhost}"
  PORT="${PG_PORT:-5432}"
  USER="${PG_USER:-argus}"
  DB="${PG_DATABASE:-argus}"
  psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DB" -f "$ROOT/server/migrations/001_initial.sql"
  psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DB" -f "$ROOT/server/migrations/002_assets.sql"
fi

echo "PostgreSQL migrations finished (001_initial + 002_assets)."
