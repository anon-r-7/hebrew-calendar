#!/usr/bin/env bash
# Run the event sync (system events + user entries + events_pair_view rebuild)
# from this machine against the production database, over an SSH tunnel.
#
#   ./resync-prod.sh
#
# Reads connection details from .envrc.prod (gitignored; see .envrc.prod.example).
# The API host is too small to run the sync itself, so this does the
# orchestration locally while the heavy lifting still happens inside Postgres.
set -euo pipefail

cd "$(dirname "$0")"

ENV_FILE="${ENV_FILE:-.envrc.prod}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE (copy .envrc.prod.example and fill it in)" >&2
  exit 1
fi
# shellcheck disable=SC1090
source "$ENV_FILE"

: "${SSH_HOST:?set SSH_HOST in $ENV_FILE}"
: "${SSH_USER:?set SSH_USER in $ENV_FILE}"
: "${POSTGRES_DB:?}" "${POSTGRES_USER:?}" "${POSTGRES_PASSWORD:?}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_rsa}"
REMOTE_DB_HOST="${REMOTE_DB_HOST:-localhost}"
REMOTE_DB_PORT="${REMOTE_DB_PORT:-5432}"
LOCAL_PORT="${LOCAL_PORT:-15432}"

echo "Opening tunnel localhost:${LOCAL_PORT} -> ${SSH_USER}@${SSH_HOST} -> ${REMOTE_DB_HOST}:${REMOTE_DB_PORT}"
ssh -i "$SSH_KEY" -N \
  -o ExitOnForwardFailure=yes \
  -o ServerAliveInterval=30 \
  -o ServerAliveCountMax=6 \
  -L "${LOCAL_PORT}:${REMOTE_DB_HOST}:${REMOTE_DB_PORT}" \
  "${SSH_USER}@${SSH_HOST}" &
TUNNEL_PID=$!
trap 'echo "Closing tunnel"; kill "$TUNNEL_PID" 2>/dev/null || true' EXIT

# wait for the forward to come up
for _ in $(seq 1 30); do
  if nc -z localhost "$LOCAL_PORT" 2>/dev/null; then break; fi
  if ! kill -0 "$TUNNEL_PID" 2>/dev/null; then
    echo "SSH tunnel exited early" >&2
    exit 1
  fi
  sleep 1
done
if ! nc -z localhost "$LOCAL_PORT" 2>/dev/null; then
  echo "Tunnel did not open on port $LOCAL_PORT" >&2
  exit 1
fi

export TZ=UTC
export DB_ENDPOINT=localhost
export DB_PORT="$LOCAL_PORT"
export POSTGRES_DB POSTGRES_USER POSTGRES_PASSWORD

echo "Running sync against ${POSTGRES_DB} (this can take a long time)..."
yarn workspace hebrew-feasts-api resync
