#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
export PYTHONPATH="$PWD/admin_panel${PYTHONPATH:+:$PYTHONPATH}"
export DJANGO_SETTINGS_MODULE="${DJANGO_SETTINGS_MODULE:-admin_panel.settings}"
export BALLSDEXBOT_DB_URL="${BALLSDEXBOT_DB_URL:-${DATABASE_URL:-}}"

if [[ -z "${BALLSDEXBOT_DB_URL}" ]]; then
  echo "DATABASE_URL is required for the F1 Dex bot database." >&2
  exit 1
fi

uv sync --python 3.13 --no-dev
uv run --python 3.13 python -m django migrate --noinput
uv run --python 3.13 python bootstrap_f1.py
exec uv run --python 3.13 python -m ballsdex --dev --disable-message-content