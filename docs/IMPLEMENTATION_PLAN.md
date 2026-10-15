# FTS Store — Phased Implementation Plan & Verification Roadmap

**Project**: FTS Store (Frnds Tech Solution)  
**Strategy**: Strict Incremental, Verifiable Delivery  
**Core Principle**: No phase begins until the previous phase is tested, verified, and approved.  

---

## 🗺️ High-Level Phase Overview

```
Phase 0: Architecture, Inspection & Planning (CURRENT - COMPLETE)
   │
   ▼
Phase 1: Backend Core Foundation, Database ORM & Migrations
   │
   ▼
Phase 2: Authentication & Role-Based Access Control (RBAC)
   │
   ▼
Phase 3: Catalog & Search Engine (Products & Categories)
   │
   ▼
Phase 4: Shopping Cart & Pricing Engine (Coupons, Tax, Shipping)
   │
   ▼
Phase 5: Checkout Workflow & Order Management
   │
   ▼
Phase 6: Frontend Modernization (React + Vite + TypeScript + Tailwind)
   │
   ▼
Phase 7: Customer Storefront Implementation (Catalog, PDP, Cart)
   │
   ▼
Phase 8: Protected Admin Dashboard & Management UI
   │
   ▼
Phase 9: Comprehensive End-to-End Testing & Security Audit
   │
   ▼
Phase 10: Production Readiness, Documentation & Handover
```

---

## 📋 Detailed Phase Breakdown

### Phase 0: Workspace Inspection & Architecture Planning (COMPLETED)
- **Status**: Completed on 2026-10-13.
- **Deliverables**: All 7 planning documents created and approved.

---

### Phase 1: Project Foundation (COMPLETED)
- **Status**: Completed on 2026-10-13.
- **Frontend Foundation Scope Completed**:
  - React 18 + Vite + TypeScript application configured in `frontend/`.
  - Tailwind CSS + PostCSS configured with custom theme tokens.
  - Reusable layout (`AppLayout`, `Navbar`, `Footer`) with responsive mobile drawer.
  - Route declarations for Home, Products, Cart, Checkout, Login, Register, My Orders, Admin, and branded 404 page.
  - Reusable UI components: `Button`, `Input`, `Loader`, `ErrorMessage`, `EmptyState`, `PageContainer`.
- **Backend Foundation Scope Completed**:
  - FastAPI modular application factory with CORS middleware, structured logging, and centralized error handling (RFC-7807 compliant error envelopes).
  - Pydantic v2 `Settings` with `.env` management.
  - SQLAlchemy 2.0 database engine, sessionmaker, and DeclarativeBase with PostgreSQL connection string and zero-setup local SQLite fallback.
  - Service liveness endpoint (`/api/v1/health`) and active database readiness check (`/api/v1/health/db`).
  - Alembic database migration environment configured (`alembic.ini`, `alembic/env.py`).
- **Validation Results**:
  - Pytest foundation suite: **5 passed in 0.05s** (`tests/test_foundation.py`).
  - Alembic status check: **Verified clean connection (SQLiteImpl)**.
- **Environment & Runtime Audit**:
  - Python: `3.14.7` installed and verified.
  - Node.js & npm: Not detected in system PATH. Frontend source code and configuration files are fully prepared for `npm install`.

---

### Phase 1: Backend Core Foundation, Database ORM & Migrations
- **Scope**:
  - Setup SQLAlchemy 2.0 database engine, connection pooling, and sessionmaker.
  - Implement full declarative models: `User`, `Category`, `Product`, `ProductImage`, `CartItem`, `Order`, `OrderItem`, `Coupon`.
  - Configure Alembic migrations environment.
  - Implement automated database initialization and seed data script (`init_db.py`).
  - Configure Pydantic v2 application settings supporting PostgreSQL connection string with SQLite development fallback.
- **Deliverables**:
  - `backend/app/db/session.py`, `backend/app/db/base.py`, `backend/app/db/init_db.py`
  - `backend/app/models/*.py` (All 8 database entities)
  - `backend/app/core/config.py`
  - Initial migration revision
- **Definition of Done**:
  - Seed script successfully populates tables without errors.
  - Database schema verified with automated schema reflection test.
- **Verification Steps**:
  - Execute `pytest tests/test_db_schema.py`.
  - Verify seed database records created and queryable.

---

### Phase 2: Authentication & Role-Based Access Control (RBAC)
- **Scope**:
  - Password hashing using `passlib[bcrypt]`.
  - JWT creation, decoding, and signature verification with HMAC-SHA256.
  - FastAPI dependencies: `get_current_user`, `get_current_active_user`, `require_admin`.
  - Endpoints: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`.
  - Pydantic v2 schemas: `UserCreate`, `UserLogin`, `UserResponse`, `TokenResponse`.
- **Deliverables**:
  - `backend/app/core/security.py`
  - `backend/app/api/deps.py`
  - `backend/app/api/v1/endpoints/auth.py`
  - `backend/app/schemas/user.py`
  - `tests/test_auth.py`
- **Definition of Done**:
  - Valid registration returns new user.
  - Duplicate registration returns `409 Conflict`.
  - Login with valid credentials returns signed JWT; invalid credentials return `401 Unauthorized`.
  - Admin endpoints reject regular customer tokens with `403 Forbidden`.
- **Verification Steps**:
  - Run `pytest tests/test_auth.py -v`. All 6 auth test scenarios pass.

---

### Phase 3: Catalog & Search Engine (Products & Categories)
- **Scope**:
  - Implement CRUD services and endpoints for Categories and Products.
  - Filtering: category slug, price range, stock status, promotional badges.
  - Text search: case-insensitive multi-field search (title, description, SKU, tags).
  - Sorting: price asc/desc, customer rating, newest arrivals.
  - Pagination: `page` and `page_size` with total count metadata.
  - Admin-only routes for product and category creation/updates.
- **Deliverables**:
  - `backend/app/services/product_service.py`
  - `backend/app/api/v1/endpoints/products.py`
  - `backend/app/api/v1/endpoints/categories.py`
  - `backend/app/schemas/product.py`, `backend/app/schemas/category.py`
  - `tests/test_catalog.py`
- **Definition of Done**:
  - Public users can search and filter catalog.
  - Admin users can add/update products; non-admin requests are rejected with `403`.
- **Verification Steps**:
  - Run `pytest tests/test_catalog.py -v`.

---

### Phase 4: Shopping Cart & Pricing Engine
- **Scope**:
  - Persistent shopping cart management supporting both guest session tokens and authenticated user IDs.
  - Add item, update quantity, remove item, clear cart.
  - Pricing calculator:
    - Line item totals.
    - Promotional coupon validation (e.g. `WELCOME10`, `SUPER20`).
    - Sales tax calculation (8%).
    - Shipping calculation ($9.99 standard or $0.00 above $100.00).
- **Deliverables**:
  - `backend/app/services/cart_service.py`
  - `backend/app/api/v1/endpoints/cart.py`
  - `backend/app/schemas/cart.py`
  - `tests/test_cart.py`
- **Definition of Done**:
  - Item quantities update correctly.
  - Invalid coupons rejected with descriptive error message.
  - Free shipping triggered at >= $100 threshold.
- **Verification Steps**:
  - Run `pytest tests/test_cart.py -v`.

---

### Phase 5: Checkout Workflow & Order Management
- **Scope**:
  - Checkout endpoint `POST /api/v1/orders`.
  - Atomic inventory decrement inside database transaction.
  - Generation of unique order number (`FTS-ORD-YYYYMMDD-XXXX`) and tracking number (`FTS-TRK-XXXX`).
  - Customer order history endpoint `GET /api/v1/orders/my-orders`.
  - Admin order management endpoint `GET /api/v1/admin/orders` and `PATCH /api/v1/admin/orders/{id}/status`.
- **Deliverables**:
  - `backend/app/services/order_service.py`
  - `backend/app/api/v1/endpoints/orders.py`
  - `backend/app/api/v1/endpoints/admin.py`
  - `tests/test_orders.py`
- **Definition of Done**:
  - Order placed successfully creates `orders` and `order_items` records and decrements product inventory.
  - Ordering more items than available stock fails with `400 Insufficient Stock` and rolls back transaction.
- **Verification Steps**:
  - Run `pytest tests/test_orders.py -v`.

---

### Phase 6: Frontend Modernization (React + Vite + TypeScript + Tailwind)
- **Scope**:
  - Initialize React + TypeScript + Vite project structure in `frontend/`.
  - Setup Tailwind CSS with modern theme tokens (vibrant indigo, emerald accents, dark/light mode).
  - Setup API client service with Axios / Fetch, base URL configuration, and Bearer token interceptor.
  - Setup React Router with route definitions: Storefront layout, Admin layout, and Protected Route guards.
  - Implement `AuthContext` and `CartContext`.
- **Deliverables**:
  - `frontend/package.json`, `vite.config.ts`, `tailwind.config.js`, `tsconfig.json`
  - `frontend/src/services/api.ts`
  - `frontend/src/context/AuthContext.tsx`, `frontend/src/context/CartContext.tsx`
  - `frontend/src/routes/AppRoutes.tsx`, `frontend/src/routes/ProtectedRoute.tsx`
- **Definition of Done**:
  - Frontend builds with zero TypeScript errors (`tsc --noEmit`).
  - Base routes render clean layout with header, footer, and navigation.
- **Verification Steps**:
  - Build validation: `npm run build`.

---

### Phase 7: Customer Storefront Implementation
- **Scope**:
  - Homepage: Hero banner with gradient spotlight, stats ticker, category pills.
  - Catalog Page: Product grid, search bar with debounce, category filter, price bounds, sorting.
  - Product Detail Page (PDP): Image gallery, rating breakdown, stock status, quantity picker.
  - Quick View Modal: Instant specification preview.
  - Slide-Over Shopping Cart Drawer: Quantity control, shipping progress bar, promo code input, checkout CTA.
  - Checkout View: Shipping address form, payment method selector, order summary, place order submission.
  - Order Confirmation View: Success checkmark animation, order receipt, tracking number.
  - Customer Account View: Order history and tracking status.
- **Deliverables**:
  - `frontend/src/pages/storefront/*.tsx`
  - `frontend/src/components/product/*.tsx`
  - `frontend/src/components/cart/*.tsx`
- **Definition of Done**:
  - Full end-to-end customer journey functional: browse -> search -> add to cart -> apply coupon -> checkout -> confirmation.
- **Verification Steps**:
  - Exercise storefront in browser / browser subagent, verifying all interactive states and network calls.

---

### Phase 8: Protected Admin Dashboard
- **Scope**:
  - Admin Dashboard Overview (`/admin`):
    - KPI cards: Total Revenue, Total Orders, Pending Fulfillment, Low Stock Alerts.
  - Admin Product Management (`/admin/products`):
    - Product table with search and category filter.
    - Create / Edit product modal with form validation (Title, SKU, Price, Stock, Category).
    - Quick stock increment/decrement button.
  - Admin Order Management (`/admin/orders`):
    - Order list with status filters (`pending`, `paid`, `processing`, `shipped`, `delivered`, `cancelled`).
    - Order detail modal with customer address and purchased line items.
    - Status updater dropdown (advances order to `processing` or `shipped` with tracking code).
- **Deliverables**:
  - `frontend/src/pages/admin/AdminDashboardPage.tsx`
  - `frontend/src/pages/admin/AdminProductsPage.tsx`
  - `frontend/src/pages/admin/AdminOrdersPage.tsx`
- **Definition of Done**:
  - Only authenticated admins can access `/admin`.
  - Creating a product in the admin UI immediately reflects in the customer catalog.
  - Updating an order status reflects in the customer's order history.
- **Verification Steps**:
  - Exercise admin workflows in browser and verify real-time data synchronization.

---

### Phase 9: Comprehensive Testing & Security Hardening
- **Scope**:
  - Execute full Pytest backend test suite covering models, services, auth, catalog, cart, and orders.
  - OWASP Security review:
    - Verify password hashing and salt strength.
    - Verify JWT signature expiration and revocation.
    - Test unauthorized access attempts on admin routes.
    - Validate SQL injection immunity across all queries.
    - Test XSS sanitization in product descriptions and reviews.
    - Verify CORS policy restricts unauthorized origins.
  - Frontend responsiveness testing on mobile, tablet, and desktop viewports.
- **Deliverables**:
  - `tests/test_security.py`
  - Security audit report in `docs/`
- **Definition of Done**:
  - 100% of automated tests pass without regressions.
  - Zero critical or high severity vulnerabilities found.
- **Verification Steps**:
  - Run full test suite: `pytest tests/ -v`.

---

### Phase 10: Production Readiness & Handover
- **Scope**:
  - Finalize production configuration, Dockerfiles, and compose files.
  - Complete `README.md` with complete architecture overview, developer guide, credentials, and troubleshooting.
  - Verify zero console errors, clean logs, and optimal bundle size.
- **Deliverables**:
  - `Dockerfile.backend`, `Dockerfile.frontend`, `docker-compose.yml`
  - Complete `README.md`
- **Definition of Done**:
  - Full system starts cleanly and passes all health checks.
