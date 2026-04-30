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

COMPOSE=(docker compose -f "$ROOT/docker-compose.yml")

migrate_docker() {
  "${COMPOSE[@]}" exec -T db psql -U "${PG_USER:-argus}" -d "${PG_DATABASE:-argus}" -v ON_ERROR_STOP=1 <"$1"
}

if command -v psql >/dev/null 2>&1; then
  if [[ -n "${DATABASE_URL:-}" ]]; then
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$ROOT/server/migrations/001_initial.sql"
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$ROOT/server/migrations/002_assets.sql"
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$ROOT/server/migrations/003_infrastructure_config.sql"
  else
    export PGPASSWORD="${PG_PASSWORD:-changeme}"
    HOST="${PG_HOST:-localhost}"
    PORT="${PG_PORT:-5432}"
    USER="${PG_USER:-argus}"
    DB="${PG_DATABASE:-argus}"
    psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DB" -v ON_ERROR_STOP=1 -f "$ROOT/server/migrations/001_initial.sql"
    psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DB" -v ON_ERROR_STOP=1 -f "$ROOT/server/migrations/002_assets.sql"
    psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DB" -v ON_ERROR_STOP=1 -f "$ROOT/server/migrations/003_infrastructure_config.sql"
  fi
elif [[ -f "$ROOT/docker-compose.yml" ]] && "${COMPOSE[@]}" exec -T db true 2>/dev/null; then
  echo "Using Docker Postgres (psql not installed locally)…"
  migrate_docker "$ROOT/server/migrations/001_initial.sql"
  migrate_docker "$ROOT/server/migrations/002_assets.sql"
  migrate_docker "$ROOT/server/migrations/003_infrastructure_config.sql"
else
  echo "PostgreSQL migrations need either:" >&2
  echo "  • psql on your PATH, or" >&2
  echo "  • Docker running with: npm run db:up" >&2
  exit 1
fi

echo "PostgreSQL migrations finished (001_initial + 002_assets + 003_infrastructure_config)."
