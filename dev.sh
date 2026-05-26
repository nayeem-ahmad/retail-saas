#!/usr/bin/env bash
# Local dev startup — loads root .env and starts backend + frontend
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Loading env from $SCRIPT_DIR/.env"
set -a
# shellcheck disable=SC1091
source "$SCRIPT_DIR/.env"
set +a

# Trap to kill child processes on exit
cleanup() {
  echo ""
  echo "Shutting down..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "Starting backend on :4000 ..."
cd "$SCRIPT_DIR/apps/backend"
npm run dev &
BACKEND_PID=$!

echo "Starting frontend on :3000 ..."
cd "$SCRIPT_DIR/apps/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "  Backend:  http://localhost:4000/api/v1/health"
echo "  Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both."

wait
