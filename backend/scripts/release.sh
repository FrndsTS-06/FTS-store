#!/usr/bin/env bash
set -e

echo "=== FTS Store Release Phase ==="
echo "Running database migrations..."
python -m alembic upgrade head
echo "Migrations completed successfully."

if [ "${AUTO_BOOTSTRAP_ADMIN:-false}" = "true" ]; then
    echo "Bootstrapping administrator..."
    python scripts/bootstrap_admin.py
fi
echo "Release phase complete."
