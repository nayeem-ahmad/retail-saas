#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOOKS_DIR="$ROOT/.githooks"

if [ ! -d "$HOOKS_DIR" ]; then
  echo "Git hooks directory not found: $HOOKS_DIR" >&2
  exit 1
fi

chmod +x "$HOOKS_DIR"/pre-commit "$HOOKS_DIR"/pre-push 2>/dev/null || true
git -C "$ROOT" config core.hooksPath .githooks

echo "Git hooks enabled (core.hooksPath=.githooks)"