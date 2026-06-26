#!/usr/bin/env bash
# Manual deploy helper for the VPS. Pulls the latest code and (re)builds the
# production stack. Idempotent — safe to re-run.
set -euo pipefail

BRANCH="${1:-main}"
COMPOSE_FILE="docker-compose.prod.yml"

# Resolve repo root regardless of where the script is called from.
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if [ ! -f ".env.production" ]; then
  echo "ERROR: .env.production not found in $REPO_ROOT — create it before deploying." >&2
  exit 1
fi

echo "==> Fetching origin/$BRANCH"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "==> Building and starting the stack"
docker compose -f "$COMPOSE_FILE" up -d --build

echo "==> Current status"
docker compose -f "$COMPOSE_FILE" ps
