# 🛍️ FTS Store — Enterprise Multi-Category E-Commerce Platform

A modern, production-grade, full-stack multi-category e-commerce platform built for **Frnds Tech Solution (FTS)**.

- **Frontend**: React 18+, Vite, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Python 3.10+, FastAPI, SQLAlchemy 2.0 ORM, Pydantic v2, Alembic.
- **Persistence**: PostgreSQL (production-ready) with zero-setup SQLite local development fallback.
- **Testing**: Pytest, FastAPI TestClient, and HTTPX.

---

## 📁 Repository Structure

```
e-commers/
├── frontend/                   # React + Vite + TypeScript Storefront & Admin
│   ├── src/
│   │   ├── components/         # Reusable UI (Button, Input, Loader, ErrorMessage, EmptyState, PageContainer)
│   │   ├── layout/             # Responsive Navbar, Footer, and AppLayout
│   │   ├── pages/              # Placeholder route views (Home, Products, Cart, Checkout, Login, Orders, Admin, 404)
│   │   ├── App.tsx             # Route declarations
│   │   ├── main.tsx            # DOM mounting
│   │   └── index.css           # Tailwind CSS directives & typography
│   ├── package.json            # Frontend dependencies & scripts
│   ├── vite.config.ts          # Vite configuration with API proxy
│   ├── tailwind.config.js      # Tailored theme tokens & fonts
│   ├── tsconfig.json           # Strict TypeScript configuration
│   └── .env.example            # Frontend environment variable template
├── backend/                    # Python FastAPI RESTful Service
│   ├── app/
│   │   ├── api/v1/             # Modular API v1 routers & endpoints
│   │   │   └── endpoints/
│   │   │       └── health.py   # Service liveness & DB readiness checks
│   │   ├── core/               # Settings (Pydantic), structured logging, centralized errors
│   │   ├── db/                 # SQLAlchemy session, engine, DeclarativeBase
│   │   └── main.py             # FastAPI application factory, CORS, exception handlers
│   ├── alembic/                # Database migrations (env.py, versions)
│   ├── alembic.ini             # Alembic configuration
│   ├── requirements.txt        # Backend dependencies
│   ├── run.py                  # CLI launcher
│   └── .env.example            # Backend environment variable template
├── tests/                      # Automated test suite
│   ├── conftest.py             # TestClient fixtures
│   └── test_foundation.py      # Health, database readiness, and CORS tests
├── docs/                       # Project Documentation & Operational Manuals
│   ├── PROJECT_HANDOVER.md     # Engineering handover & complete operations manual
│   ├── QA_REPORT.md            # Independent QA verification report & defect audit
│   ├── DEPLOYMENT.md           # Deployment, rollback, migration, and backup guide
│   ├── KNOWN_ISSUES.md         # Known limitations, security boundaries & risk registry
│   ├── PROJECT_REQUIREMENTS.md # Roles, journeys, business rules, acceptance criteria
│   ├── ARCHITECTURE.md         # High-level architecture, layers, security
│   ├── DATABASE_DESIGN.md      # Relational schema specification & ERD
│   ├── API_PLAN.md             # REST API specifications & request/response payloads
│   ├── IMPLEMENTATION_PLAN.md  # Phased roadmap & verification steps
│   ├── TEST_PLAN.md            # Testing pyramid & QA test cases
│   └── DECISIONS.md            # Architecture Decision Records (ADRs)
├── .env.example                # Root environment template
├── .env.production.example     # Production environment template
├── .env.staging.example        # Staging environment template
├── .env.test.example           # Testing environment template
├── docker-compose.prod.yml     # Multi-container production orchestration
├── .gitignore                  # Git ignore rules
└── README.md                   # Project overview & quickstart
```

---

## 🚀 Local Development Quickstart

### 1. Backend Service (FastAPI)

#### Prerequisites
- **Python 3.10+** (Tested and verified with Python 3.14 on Windows)

#### Steps:
```powershell
# Navigate to backend directory
cd backend

# (Optional) Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment configuration
copy .env.example .env

# Run Alembic migrations check
python -m alembic current

# Launch development server
python run.py
```

The backend starts at:
- **API Base**: `http://127.0.0.1:8000/api/v1`
- **Service Liveness Check**: `http://127.0.0.1:8000/api/v1/health`
- **Database Readiness Check**: `http://127.0.0.1:8000/api/v1/health/db`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **ReDoc UI**: `http://127.0.0.1:8000/redoc`

---

### 2. Frontend Application (React + Vite + TypeScript)

#### Prerequisites
- **Node.js (v18+)** and **npm**

#### Steps:
```powershell
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create environment configuration
copy .env.example .env

# Start Vite dev server
npm run dev

# Run type check & production build
npm run build
```

The frontend development server will be hosted at `http://localhost:3000`.

---

---

### 3. Running Automated Checks & Verification

Run tests and static analysis from the repository root:
```powershell
# Run the comprehensive backend test suite (87 tests across 9 test modules)
python -m pytest tests/ -v

# Run the 59-point live end-to-end system QA verification against running servers
python scratch/qa_full_system_verification.py

# Frontend linting and type-checking
$env:PATH = "d:\projects_demo\e-commers\.tools\node;$env:PATH"
npm run lint --prefix frontend
npx tsc --noEmit --project frontend

# Production frontend bundle compilation
npm run build --prefix frontend
```

---

### 4. Administrator Provisioning & Bootstrapping

In addition to pre-seeded credentials, super-administrators can be safely provisioned via the secure CLI bootstrap script without direct database manipulation:

```powershell
# Provision an administrator account (or promote an existing user)
python backend/scripts/bootstrap_admin.py --email admin@frndstech.com --password "Admin@FTS2026!" --name "System Administrator"
```

---

## 🛡️ Administration Dashboard & Operations

The FTS Store Administration Dashboard (`/admin`) provides full platform management, analytics, catalog operations, and lifecycle order processing with strict server-verified authorization:

### 1. Security & RBAC Enforcement
- **Server-Verified Authorization**: Every administrative endpoint enforces `require_admin` via JWT role claims or `X-Admin-Key` header.
- **Defense in Depth**: Frontend route guards (`AdminRoute.tsx`) work in tandem with backend API authorization; direct endpoint access by unauthenticated visitors returns `401 Unauthorized` and by regular customers returns `403 Forbidden`.
- **Sensitive Data Protection**: Passwords, refresh tokens, and payment secrets are never exposed in administrative views. Customer delivery details are shown only when needed for order fulfillment.

### 2. Operational Workflows
- **Summary Analytics**: Live metrics for Total Orders, Settled Revenue, Low-Stock Alerts, Active Products, and Customer counts (`GET /api/v1/admin/metrics`).
- **Order Lifecycle Processing**:
  - Search, filter by status, sort, and paginate orders (`GET /api/v1/admin/orders`).
  - View order details with immutable historical price snapshots and buyer shipping info (`GET /api/v1/admin/orders/{order_number}`).
  - Enforce status transitions: `pending` $\rightarrow$ `processing` $\rightarrow$ `shipped` $\rightarrow$ `delivered`.
  - Cancel order with atomic stock restoration and automatic refund processing (`PATCH /api/v1/admin/orders/{order_number}/status`).
- **Product Management**:
  - Register products with category, price, SKU, and inventory validation (`POST /api/v1/products`).
  - Quick inline stock updates (`PATCH /api/v1/products/{id}/stock`).
  - Edit product pricing and specifications (`PUT /api/v1/products/{id}`).
  - Archive products (`DELETE /api/v1/products/{id}`) ensuring archived items are safely hidden from the storefront.
- **Category Taxonomy**: Create, edit, and archive categories with dynamic active item counts (`/api/v1/categories`).
- **Audit Logging**: Immutable tracking of administrative events (`PRODUCT_CREATE`, `PRODUCT_STOCK_ADJUST`, `ORDER_STATUS_UPDATE`, etc.) recording actor ID, timestamp, and before/after deltas (`GET /api/v1/admin/audit-logs`).

### 3. Seed Credentials for Local Testing
- **Administrator**: `admin@frndstech.com` / `Admin@FTS2026!`
- **Customer**: `customer@frndstech.com` / `Customer@FTS2026!`

---

## 🐳 Production Container Deployment

FTS Store is containerized and ready for orchestration with Docker and Docker Compose:

```bash
# Build and launch multi-container stack (PostgreSQL 16, FastAPI backend, Nginx frontend)
docker compose -f docker-compose.prod.yml up --build -d

# Check service health
docker compose -f docker-compose.prod.yml ps

# Follow application logs
docker compose -f docker-compose.prod.yml logs -f
```

---

## 🔒 Safe Local Development Configuration

By default, the backend operates with `DATABASE_URL="sqlite:///./fts_store.db"`. This requires zero external database installation for immediate development and testing.

To connect to a production or staging **PostgreSQL** instance, set `DATABASE_URL` in `backend/.env`:
```ini
DATABASE_URL="postgresql://fts_user:fts_password@localhost:5432/fts_store"
```
The SQLAlchemy engine will automatically adjust drivers, connection pooling, and pre-ping health checks.

---

## 📚 Handover & Operations Documentation

For exhaustive technical specifications, runbooks, and audit reports, consult the official handover guides:

- [**Project Handover & Architectural Manual**](docs/PROJECT_HANDOVER.md) — System architecture, database setup, administrator runbooks, customer workflows, and pre-flight launch checklists.
- [**Production Deployment & Operations Guide**](docs/DEPLOYMENT.md) — Containerization, multi-environment profiles, migration release steps, backup/restoration, and rollback runbooks.
- [**Independent QA Verification Report**](docs/QA_REPORT.md) — Detailed results across all 59 live test checkpoints, 87 pytest test suites, defect resolutions, and accessibility audits.
- [**Known Limitations & Risk Registry**](docs/KNOWN_ISSUES.md) — Architectural constraints, in-memory caches, cloud configuration prerequisites, and mitigation pathways.


