#!/usr/bin/env bash
# Copy the production database into the local docker Postgres.
#
#   ./sync-prod-db.sh              # dump prod over an SSH tunnel, then load it locally
#   ./sync-prod-db.sh --load-only  # reuse the last dump in ./tmp/
#
# Prod connection details come from .envrc.prod (SSH_HOST, SSH_USER, SSH_KEY,
# REMOTE_DB_HOST, REMOTE_DB_PORT, LOCAL_PORT, POSTGRES_DB/USER/PASSWORD) — the same
# file resync-prod.sh uses. The local target comes from the direnv-loaded .envrc
# (POSTGRES_DB/USER/PASSWORD of the compose `db` service). No credentials are typed here.
# pg_dump/psql run from the postgres:18 image, so nothing needs installing.
set -euo pipefail
cd "$(dirname "$0")"

PROD_ENV="${PROD_ENV:-.envrc.prod}"
[[ -f "$PROD_ENV" ]] || { echo "Missing $PROD_ENV (copy .envrc.prod.example and fill it in)" >&2; exit 1; }
: "${POSTGRES_DB:?local .envrc not loaded (run: direnv allow)}" "${POSTGRES_USER:?}" "${POSTGRES_PASSWORD:?}"
LOCAL_DB="$POSTGRES_DB"; LOCAL_USER="$POSTGRES_USER"

mkdir -p tmp
DUMP="tmp/prod-$(date +%Y%m%d).sql.gz"

if [[ "${1:-}" != "--load-only" ]]; then
  # ---- 1. dump prod through an SSH tunnel (prod vars only inside this subshell)
  (
    # shellcheck disable=SC1090
    source "$PROD_ENV"
    : "${SSH_HOST:?}" "${SSH_USER:?}" "${POSTGRES_DB:?}" "${POSTGRES_USER:?}" "${POSTGRES_PASSWORD:?}"
    SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_rsa}"
    REMOTE_DB_HOST="${REMOTE_DB_HOST:-localhost}"; REMOTE_DB_PORT="${REMOTE_DB_PORT:-5432}"; LOCAL_PORT="${LOCAL_PORT:-15432}"

    echo "Opening tunnel localhost:${LOCAL_PORT} -> ${SSH_USER}@${SSH_HOST} -> ${REMOTE_DB_HOST}:${REMOTE_DB_PORT}"
    ssh -i "$SSH_KEY" -N -o ExitOnForwardFailure=yes -L "${LOCAL_PORT}:${REMOTE_DB_HOST}:${REMOTE_DB_PORT}" "${SSH_USER}@${SSH_HOST}" &
    TUNNEL=$!
    trap 'kill "$TUNNEL" 2>/dev/null || true' EXIT
    sleep 2

    echo "Dumping ${POSTGRES_DB} -> ${DUMP}"
    docker run --rm -i \
      -e PGPASSWORD="$POSTGRES_PASSWORD" \
      --add-host=host.docker.internal:host-gateway \
      postgres:18 pg_dump -h host.docker.internal -p "$LOCAL_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
        --no-owner --no-privileges --format=plain \
      | gzip > "$DUMP"
    ls -lh "$DUMP"
  )
fi

# ---- 2. load into the local compose db (drop + recreate for a clean copy)
docker compose up -d db
until docker compose exec -T db pg_isready -U "$LOCAL_USER" >/dev/null 2>&1; do sleep 1; done
echo "Recreating local database ${LOCAL_DB}"
docker compose exec -T db psql -U "$LOCAL_USER" -d postgres -v ON_ERROR_STOP=1 \
  -c "DROP DATABASE IF EXISTS \"${LOCAL_DB}\" WITH (FORCE);" \
  -c "CREATE DATABASE \"${LOCAL_DB}\";"
echo "Loading ${DUMP}"
gunzip -c "$DUMP" | docker compose exec -T db psql -U "$LOCAL_USER" -d "$LOCAL_DB" -q -v ON_ERROR_STOP=0 >/dev/null
docker compose exec -T db psql -U "$LOCAL_USER" -d "$LOCAL_DB" -c \
  "SELECT (SELECT count(*) FROM hebrew_dates) AS hebrew_dates, (SELECT count(*) FROM \"SequelizeMeta\") AS migrations_applied;"
echo "Done. Now: cd packages/api && yarn db:migrate   # applies only what prod hasn't got yet"
