#!/usr/bin/env bash
set -e

echo "=== FTS Store Backend Production Entrypoint ==="
echo "Environment: ${ENVIRONMENT:-production}"

# Step 1: Run Database Migrations
echo "Applying database schema migrations..."
python -m alembic upgrade head
echo "Database migrations up to date."

# Step 2: Bootstrap Initial Super-Admin if configured
if [ "${AUTO_BOOTSTRAP_ADMIN:-false}" = "true" ]; then
    echo "Running administrator bootstrap procedure..."
    python scripts/bootstrap_admin.py
fi

# Step 3: Start Application with Production Gunicorn / Uvicorn Workers
CONCURRENCY=${WEB_CONCURRENCY:-4}
BIND_HOST=${HOST:-0.0.0.0}
BIND_PORT=${PORT:-8000}

echo "Starting Gunicorn server with ${CONCURRENCY} workers on ${BIND_HOST}:${BIND_PORT}..."
exec gunicorn app.main:app \
    --workers "${CONCURRENCY}" \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind "${BIND_HOST}:${BIND_PORT}" \
    --timeout 60 \
    --keep-alive 5 \
    --access-logfile - \
    --error-logfile - \
    --forwarded-allow-ips "*"
