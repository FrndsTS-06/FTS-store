# ==============================================================================
# FTS Store — Production Backend Dockerfile
# Multi-stage secure build with unprivileged runtime user
# ==============================================================================

FROM python:3.12-slim AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Final Runtime Image
FROM python:3.12-slim AS runner

WORKDIR /app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root system user
RUN groupadd -g 10001 ftsgroup && \
    useradd -u 10001 -g ftsgroup -s /bin/bash -m ftsuser

# Copy installed Python packages from builder
COPY --from=builder /root/.local /home/ftsuser/.local
ENV PATH=/home/ftsuser/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Copy application source code
COPY --chown=ftsuser:ftsgroup . .

# Ensure entrypoint scripts are executable
RUN chmod +x scripts/*.sh

USER ftsuser

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://127.0.0.1:8000/api/v1/health || exit 1

ENTRYPOINT ["scripts/entrypoint.sh"]
