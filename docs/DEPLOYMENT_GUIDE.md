# FTS Store — Production Deployment Guide & Runbook

**Document Status**: Official Release & Deployment Specification  
**Platform Version**: 1.0.0 (FTS Store E-Commerce Platform)  
**Date**: October 13, 2026  

---

## 1. Overview & Architecture

The **FTS Store** platform is architected for containerized or bare-metal high-availability deployment:

- **Frontend Tier**: Single Page Application (SPA) built with React 18, TypeScript, Vite, and Tailwind CSS. Static assets are optimized for CDN edge caching and served via Nginx or CloudFront/Vercel with SPA rewrite rules (`try_files $uri $uri/ /index.html;` / `_redirects`).
- **Backend Tier**: Asynchronous RESTful service built with FastAPI, Pydantic v2, and Python 3.12, served by Gunicorn with Uvicorn worker concurrency (`uvicorn.workers.UvicornWorker`).
- **Database Tier**: Managed PostgreSQL 15+ with connection pooling, transactional ACID compliance, and Alembic database migrations.
- **Security & Caching**: Strict Transport Security (`HSTS`), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `SameSite=Lax` + `Secure` cookies over HTTPS, and explicit domain CORS whitelisting.

---

## 2. Outstanding Production Blockers (Pre-Flight Checklist)

Before provisioning the live production deployment, the infrastructure team must provide the following parameters:

| Blocker / Dependency | Description & Resolution Requirement |
|---|---|
| **Hosting Access / Cloud CLI** | Cloud hosting credentials (AWS, GCP, DigitalOcean, Railway, or VPS SSH keys) are not provisioned in this local sandbox. |
| **Domain & DNS Assignment** | Production domain (e.g., `ftsstore.com` and `api.ftsstore.com`) must have `A` or `CNAME` records pointing to the hosting ingress/load balancer. |
| **SSL/TLS Certificates** | Wildcard or domain SSL certificates (via Let's Encrypt / AWS Certificate Manager / Cloudflare) required for HTTPS enforcement. |
| **Managed PostgreSQL Connection** | Production PostgreSQL URI with SSL mode (`postgresql://user:pass@host:5432/dbname?sslmode=require`). |
| **Production Secrets Generation** | Strong 64-character random hexadecimal keys for `SECRET_KEY` and `ADMIN_API_KEY`. |
| **Payment Gateway Integration** | Live API credentials for Stripe, Razorpay, or UPI provider once production merchant KYC is finalized (currently in validated simulation mode). |

---

## 3. Production Environment Variables Reference

Create `.env.production` on the production server (ensure `.env*` is never committed to version control):

```bash
# ==============================================================================
# FTS Store — Production Environment Configuration (.env.production)
# ==============================================================================

# Application Profile
ENVIRONMENT=production
DEBUG=false
PROJECT_NAME="FTS Store — Frnds Tech Solution"
PROJECT_VERSION="1.0.0"

# Host & Binding
HOST=0.0.0.0
PORT=8000
FORWARDED_ALLOW_IPS="*"
ALLOWED_HOSTS="api.ftsstore.com,ftsstore.com"

# Security & Secrets (Generate via: openssl rand -hex 32)
SECRET_KEY="REPLACE_WITH_HEX64_SECRET_KEY_FOR_PRODUCTION"
ADMIN_API_KEY="REPLACE_WITH_HEX32_ADMIN_SECRET_KEY"
ACCESS_TOKEN_EXPIRE_MINUTES=60
SECURE_COOKIES=true

# Administrator Initial Bootstrap
AUTO_BOOTSTRAP_ADMIN=true
INITIAL_ADMIN_EMAIL="admin@frndstech.com"
INITIAL_ADMIN_PASSWORD="REPLACE_WITH_STRONG_UNGUESSABLE_PASSWORD"

# Managed PostgreSQL Database
DATABASE_URL="postgresql://fts_admin:REPLACE_WITH_PASSWORD@postgres.internal:5432/fts_store_prod?sslmode=require"
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=30
DATABASE_POOL_TIMEOUT=30
DATABASE_POOL_RECYCLE=1800
DATABASE_SSL_MODE="require"

# Production CORS Whitelist (Explicit domain origins only — NO WILDCARD)
BACKEND_CORS_ORIGINS="https://ftsstore.com,https://www.ftsstore.com,https://admin.ftsstore.com"

# Logging & Monitoring
LOG_LEVEL="INFO"
LOG_FORMAT="json"
DOCS_ENABLED=false

# Media Storage
MEDIA_STORAGE_BACKEND="s3"
S3_BUCKET_NAME="fts-store-production-assets"
S3_REGION="ap-south-1"
AWS_ACCESS_KEY_ID="REPLACE_WITH_IAM_ACCESS_KEY"
AWS_SECRET_ACCESS_KEY="REPLACE_WITH_IAM_SECRET_KEY"
CDN_BASE_URL="https://cdn.ftsstore.com"

# Payment Gateway
PAYMENT_GATEWAY_MODE="simulation"
```

---

## 4. Deployment Option 1: Docker & Docker Compose (Recommended)

### Prerequisites:
- Server running Ubuntu 22.04 LTS / Debian 12 with Docker Engine 24+ and Docker Compose v2.

### Step-by-Step Procedure:

```bash
# 1. Clone repository on production host
git clone https://github.com/frndstech/e-commers.git /opt/fts-store
cd /opt/fts-store

# 2. Configure production secrets
cp .env.production.example .env.production
nano .env.production

# 3. Build and launch containers
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# 4. Verify running containers
docker compose -f docker-compose.prod.yml ps

# 5. Check migration and bootstrap logs
docker compose -f docker-compose.prod.yml logs backend
```

---

## 5. Deployment Option 2: Linux VPS / Bare-Metal (Systemd + Nginx)

### A. Backend Tier Setup

```bash
# 1. Install dependencies
sudo apt update && sudo apt install -y python3.12 python3.12-venv python3-pip libpq-dev

# 2. Setup virtual environment
cd /opt/fts-store/backend
python3.12 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# 3. Run database migrations
python -m alembic upgrade head

# 4. Bootstrap Super-Admin
python scripts/bootstrap_admin.py

# 5. Create Systemd Service (/etc/systemd/system/fts-backend.service)
sudo tee /etc/systemd/system/fts-backend.service > /dev/null <<EOF
[Unit]
Description=FTS Store FastAPI Gunicorn Application
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/opt/fts-store/backend
EnvironmentFile=/opt/fts-store/.env.production
ExecStart=/opt/fts-store/backend/venv/bin/gunicorn app.main:app \\
    --workers 4 \\
    --worker-class uvicorn.workers.UvicornWorker \\
    --bind 127.0.0.1:8000 \\
    --timeout 60 \\
    --access-logfile /var/log/fts-store/access.log \\
    --error-logfile /var/log/fts-store/error.log
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable fts-backend
sudo systemctl start fts-backend
```

### B. Frontend Tier Setup

```bash
# 1. Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 2. Build production assets
cd /opt/fts-store/frontend
npm ci
VITE_API_BASE_URL="https://api.ftsstore.com/api/v1" npm run build

# 3. Deploy assets to web root
sudo mkdir -p /var/www/fts-store
sudo cp -r dist/* /var/www/fts-store/
sudo chown -R www-data:www-data /var/www/fts-store
```

### C. Nginx Reverse Proxy & SSL Configuration

```nginx
# /etc/nginx/sites-available/ftsstore.com.conf
server {
    listen 80;
    server_name ftsstore.com www.ftsstore.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ftsstore.com www.ftsstore.com;

    ssl_certificate /etc/letsencrypt/live/ftsstore.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ftsstore.com/privkey.pem;

    root /var/www/fts-store;
    index index.html;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/javascript application/json application/javascript image/svg+xml;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Static Assets Long-Term Caching
    location ~* \.(?:ico|css|js|gif|jpe?g|png|woff2?|svg)$ {
        expires 6M;
        access_log off;
        add_header Cache-Control "public, max-age=15552000, immutable";
    }

    # SPA Client-Side Routing Fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}

server {
    listen 443 ssl http2;
    server_name api.ftsstore.com;

    ssl_certificate /etc/letsencrypt/live/ftsstore.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ftsstore.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

---

## 6. Operational Health Checks & Verification

After deployment, run the following verification checks:

1. **Service Liveness Check**:
   ```bash
   curl -fsSL https://api.ftsstore.com/health
   # Expected: {"status":"healthy","service":"FTS Store API","version":"1.0.0"}
   ```

2. **Database Readiness Check**:
   ```bash
   curl -fsSL https://api.ftsstore.com/ready
   # Expected: {"status":"ready","service":"FTS Store API","database":{"status":"ready","readiness":true}}
   ```

3. **API Catalog Verification**:
   ```bash
   curl -fsSL https://api.ftsstore.com/api/v1/products/featured?limit=4
   # Expected: HTTP 200 with JSON product array
   ```

4. **Frontend Direct Route Refresh**:
   ```bash
   curl -fsSL https://ftsstore.com/products -o /dev/null -w "%{http_code}\n"
   # Expected: 200 (served via index.html rewrite)
   ```

5. **Security Headers Verification**:
   ```bash
   curl -I https://api.ftsstore.com/health
   # Expected: X-Content-Type-Options: nosniff, Strict-Transport-Security, X-Frame-Options: DENY
   ```
