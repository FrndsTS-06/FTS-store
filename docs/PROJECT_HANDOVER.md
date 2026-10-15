# FTS Store — Comprehensive Project Handover & Architectural Manual

**Project**: FTS Store (Frnds Tech Solution Multi-Category E-Commerce Platform)  
**Handover Date**: 2026-10-13  
**Engineering Lead**: Senior Full-Stack Software Architect & QA Lead  
**Document Classification**: Engineering Handover & Operational Manual  
**Version**: 1.0.0  

---

## 1. Executive Summary & Final Status Report

| Domain | Status | Notes |
|---|---|---|
| **Frontend Storefront & Admin UI** | **PASS** | React 18, TypeScript, Tailwind CSS, dark aesthetic, fully responsive |
| **Backend RESTful API** | **PASS** | FastAPI, Pydantic v2, structured error handling, RFC-7807 envelopes |
| **Database Schema & Migrations** | **PASS** | SQLAlchemy 2.0, Alembic migrations at `head`, decimal currency safety |
| **Authentication & RBAC** | **PASS** | Bcrypt 12 rounds, HMAC-SHA256 JWT, server-side admin role verification |
| **Cart & Server Pricing** | **PASS** | Authoritative server-side calculations, persistence, coupon engine |
| **Checkout & Order Lifecycle** | **PASS** | Atomic stock deduction, historical price snapshots, idempotency |
| **Order State Machine** | **PASS** | Strict transition enforcement, cancellation inventory restoration |
| **Automated Testing Suite** | **PASS** | 87/87 Pytest unit & integration tests (100% pass rate in 9.32s) |
| **Live End-to-End System Tests** | **PASS** | 59/59 Live HTTP & customer/admin journey verification tests (100%) |
| **Frontend Quality Gates** | **PASS** | ESLint: 0 errors, TypeScript: 0 errors, Vite build: 0 errors |
| **Production Containerization** | **PASS** | Multi-stage Dockerfiles, Nginx SPA config, Docker Compose ready |
| **Remote Cloud Deployment** | **BLOCKED** | External hosting accounts (AWS, Render, Vercel) unconfigured in local env |
| **Real Payment Gateway** | **NOT TESTED** | Production simulation engine active; real Stripe keys required |

---

## 2. System Architecture

```
[Customer Browser / Mobile]         [Administrator Browser]
            │                                   │
            ▼                                   ▼
┌─────────────────────────────────────────────────────────────┐
│                 React 18 + Vite Frontend                    │
│   Storefront (Catalog, Cart, Checkout, Order History)       │
│   Protected Admin Dashboard (KPIs, Catalog, Orders, Audit)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON REST API (/api/v1)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     FastAPI Backend                         │
│  - Core: Security (Bcrypt/JWT), Settings, Structured Logs   │
│  - Middleware: CORS, TrustedHost, Security Headers, RateLim │
│  - Services: CartService, OrderService, AdminService        │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
    ┌────────────────────┐          ┌────────────────────┐
    │ SQLAlchemy Models  │          │ Alembic Migrations │
    │ Users, Categories, │          │ Version Control    │
    │ Products, Images,  │          │ (a67dd0b0425e)     │
    │ Carts, Orders,     │          └────────────────────┘
    │ Payments, Audits   │
    └──────────┬─────────┘
               │
               ▼
    ┌────────────────────┐
    │ Database Engine    │
    │ PostgreSQL / SQLite│
    └────────────────────┘
```

---

## 3. Repository Structure

```
d:/projects_demo/e-commers/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py               # Auth & cart identity dependencies
│   │   │   └── v1/
│   │   │       ├── api.py            # Central v1 route registry
│   │   │       └── endpoints/        # auth, products, categories, cart, orders, admin, health
│   │   ├── core/
│   │   │   ├── config.py             # Pydantic BaseSettings & multi-env validation
│   │   │   ├── errors.py             # RFC-7807 standardized error envelopes
│   │   │   ├── logging.py            # Structured logging (text/json)
│   │   │   ├── pricing.py            # Authoritative decimal currency calculations
│   │   │   └── security.py           # Bcrypt password hashing & JWT token lifecycle
│   │   ├── db/
│   │   │   ├── base.py               # Declarative base & metadata
│   │   │   ├── session.py            # Connection pooling & dialect setup
│   │   │   └── seed.py               # Idempotent master data seeding
│   │   ├── models/                   # SQLAlchemy declarative models & enums
│   │   ├── schemas/                  # Pydantic v2 validation contracts
│   │   ├── services/                 # Business logic: cart, order, admin
│   │   └── main.py                   # FastAPI application factory
│   ├── alembic/                      # Database schema migrations
│   ├── scripts/                      # bootstrap_admin.py, entrypoint.sh, release.sh
│   ├── Dockerfile                    # Multi-stage production container
│   └── requirements.txt              # Production Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/               # admin, cart, catalog, common, layout, auth
│   │   ├── context/                  # AuthContext, CartContext
│   │   ├── pages/                    # Home, Products, Detail, Cart, Checkout, Orders, Admin
│   │   ├── services/api.ts           # Centralized typed HTTP API client
│   │   └── types/                    # TypeScript interfaces
│   ├── Dockerfile                    # Multi-stage production Nginx container
│   ├── nginx.conf                    # Nginx reverse proxy & SPA routing
│   ├── vercel.json                   # Vercel deployment configuration
│   └── package.json                  # React 18, Vite 5, Tailwind CSS 3
├── tests/                            # 87 automated Pytest unit & integration tests
├── docs/
│   ├── API_PLAN.md                   # RESTful API specifications
│   ├── DEPLOYMENT.md                 # Production deployment & operations guide
│   ├── QA_REPORT.md                  # Comprehensive QA verification results
│   ├── KNOWN_ISSUES.md               # Technical limitations & risk registry
│   └── PROJECT_HANDOVER.md           # Master handover document (this file)
├── docker-compose.prod.yml           # Production multi-container orchestrator
└── README.md                         # Clean setup & operational guide
```

---

## 4. Environment & Database Setup

### 4.1 Prerequisites
- Python 3.11+ (Python 3.12 or 3.14 recommended)
- Node.js v18+ (Node v20 LTS recommended)
- Git & PostgreSQL 15+ (or default SQLite for local development)

### 4.2 Quickstart Local Setup
```powershell
# 1. Clone repository & configure environment
cd d:\projects_demo\e-commers
copy .env.example .env

# 2. Setup Backend Virtual Environment & Dependencies
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt

# 3. Apply Migrations & Seed Sample Data
cd backend
python -m alembic upgrade head
python -c "from app.db.session import SessionLocal; from app.db.seed import seed_database; seed_database(SessionLocal())"
cd ..

# 4. Bootstrap Super-Administrator
python backend\scripts\bootstrap_admin.py

# 5. Setup Frontend
cd frontend
npm install
cd ..

# 6. Launch Servers
# Terminal 1 (Backend):
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload

# Terminal 2 (Frontend):
npm run dev --prefix frontend -- --host 127.0.0.1 --port 3000
```

---

## 5. Seed Credentials

| Role | Email Address | Password | Permissions |
|---|---|---|---|
| **Administrator** | `admin@frndstech.com` | `Admin@FTS2026!` | Full platform access, catalog CRUD, order state machine, audit logs |
| **Customer** | `customer@frndstech.com` | `Customer@FTS2026!` | Storefront browsing, persistent cart, checkout, order history |

---

## 6. Verified User Journeys

### 6.1 Customer Storefront Journey
1. **Catalog Exploration**: Discovered categories, searched keywords, filtered by category and price range, sorted by price ascending/descending.
2. **Product Details**: Inspected high-res images, verified inventory count, read specifications.
3. **Cart Operations**: Added products, modified quantities, applied promotional coupon (`WELCOME10`), removed items, validated session cookie persistence.
4. **Authentication**: Registered new account with password complexity validation, logged in, inspected profile (`/auth/me`).
5. **Checkout**: Validated address, selected payment method, calculated subtotal, tax, and shipping on the server, placed order.
6. **Payment**: Simulated payment processing, verified transition to `processing`.
7. **Order History**: Inspected created order in `/orders` with purchase price snapshots.
8. **Logout**: Invalidated token and verified route protection on private pages.

### 6.2 Administrator Operations Journey
1. **Authentication & RBAC**: Logged in via admin credentials; verified that regular customer accounts are blocked (HTTP 403) from all administrative endpoints.
2. **Dashboard Overview**: Monitored live KPI summary cards (Total Orders, Settled Revenue, Low-Stock Alerts, Active Catalog, Customers).
3. **Catalog Management**: Created products, updated prices and specifications, executed quick inline stock adjustments, verified immediate public storefront reflection.
4. **Product Archiving**: Archived a product via `DELETE /products/{id}` and verified it is hidden (HTTP 404) on the storefront while retained in the admin database.
5. **Order Fulfillment**: Queried orders table with status filters, opened order detail modal, advanced status (`pending` $\rightarrow$ `processing` $\rightarrow$ `shipped` $\rightarrow$ `delivered`).
6. **Order Cancellation**: Cancelled an order, verified atomic inventory restoration, and verified automatic refund transition.
7. **Audit Logging**: Inspected immutable audit events logging actor, action, timestamps, and JSON state deltas.

---

## 7. Automated Test Execution Commands

```powershell
# Run complete automated backend test suite (87 tests)
python -m pytest tests/ -v

# Run live system QA integration verification (59 tests)
python scratch/qa_full_system_verification.py

# Run frontend linting & type checks
npm run lint --prefix frontend
npx tsc --noEmit --project frontend

# Run frontend production bundle build
npm run build --prefix frontend
```

---

## 8. Steps Required Before Accepting Real Customer Orders

Before transitioning from simulation mode to live production customer orders:

1. **Deploy Managed PostgreSQL**:
   - Provision an AWS RDS, Supabase, or Neon PostgreSQL 15/16 instance with automated daily snapshots and point-in-time recovery (PITR).
   - Configure `DATABASE_URL` in `.env.production` with `sslmode=require`.
2. **Configure Production Secret Keys**:
   - Generate cryptographically secure keys: `openssl rand -hex 32` for `SECRET_KEY` and `ADMIN_API_KEY`.
   - Never deploy with default fallback keys.
3. **Configure Merchant Payment Gateway**:
   - Create a Stripe or PayPal merchant account.
   - Set `STRIPE_PUBLIC_KEY`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET`.
   - Update `payment_router` in `backend/app/api/v1/endpoints/orders.py` to handle live webhook events (`payment_intent.succeeded`).
4. **Deploy Dedicated Redis Cache**:
   - Deploy a Redis instance (AWS ElastiCache or Redis Cloud) to back `_REVOKED_TOKENS` and `_PROCESSED_WEBHOOK_EVENTS` across horizontally scaled backend workers.
5. **Configure Cloud Media Storage**:
   - Set up an AWS S3 or Cloudflare R2 bucket for product images and configure `MEDIA_STORAGE_BACKEND="s3"`.
6. **Domain & SSL Certificates**:
   - Point DNS records (`A` / `CNAME`) to frontend CDN and backend API gateway.
   - Enforce TLS 1.3 encryption across all traffic.
