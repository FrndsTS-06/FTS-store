# FTS Store — Architecture Decision Records (ADRs)

**System**: FTS Store (Frnds Tech Solution)  
**Status**: Accepted & Documented  
**Scope**: Full-Stack Architecture, Technology Selection, and Migration Strategy  

---

## 🏛️ Summary of Decisions

| ADR ID | Decision Title | Status | Date |
|---|---|---|---|
| **ADR-001** | Selection of Core Technology Stack (FastAPI + React/TS/Tailwind) | Accepted | 2026-10-13 |
| **ADR-002** | Dual Database Strategy (PostgreSQL Primary + SQLite Dev Fallback) | Accepted | 2026-10-13 |
| **ADR-003** | Stateless JWT Authentication with Role-Based Access Control (RBAC) | Accepted | 2026-10-13 |
| **ADR-004** | Client State Management via React Context + Custom Hooks | Accepted | 2026-10-13 |
| **ADR-005** | API-First Contract-Driven Architecture with OpenAPI 3.0 | Accepted | 2026-10-13 |
| **ADR-006** | Monorepo Directory Organization (`frontend/` + `backend/`) | Accepted | 2026-10-13 |
| **ADR-007** | Phased Non-Destructive Migration from Prototype to Production FTS Store | Accepted | 2026-10-13 |

---

### ADR-001: Selection of Core Technology Stack
- **Context**: FTS Store requires high throughput, strict type safety, fast developer velocity, and a responsive customer and admin UI.
- **Decision**:
  - **Backend**: Python 3.10+, FastAPI, SQLAlchemy 2.0 ORM, Pydantic v2.
  - **Frontend**: React 18+, Vite, TypeScript, Tailwind CSS.
- **Rationale**:
  - FastAPI provides native async support, automatic OpenAPI/Swagger documentation, and Pydantic validation that catches bugs at the network boundary.
  - React + TypeScript + Tailwind provides a mature ecosystem, reusable components for both storefront and admin dashboard, and rapid compile times via Vite.
- **Consequences**: Developers must maintain TypeScript types in sync with Pydantic schemas (or generate client SDKs from `/openapi.json`).

---

### ADR-002: Dual Database Strategy (PostgreSQL Primary + SQLite Dev Fallback)
- **Context**: In production/staging, FTS Store requires enterprise concurrency, ACID compliance, and relational integrity. In local development or testing environments, a PostgreSQL daemon might not be running or accessible.
- **Decision**: Configure SQLAlchemy with a dynamic connection string:
  - If `DATABASE_URL` starts with `postgresql://`, use the asyncpg/psycopg2 PostgreSQL driver with connection pooling.
  - If `DATABASE_URL` is omitted or set to `sqlite`, fall back to a local SQLite database (`sqlite:///./fts_store.db`) with `check_same_thread=False`.
- **Rationale**: Enables instant onboarding, testing, and continuous integration without requiring external container dependencies, while ensuring zero schema divergence between environments.
- **Consequences**: We must avoid database-specific dialect extensions (like PostgreSQL JSONB operators or raw SQL) unless wrapped with SQLAlchemy vendor-agnostic functions.

---

### ADR-003: Stateless JWT Authentication with Role-Based Access Control (RBAC)
- **Context**: FTS Store has distinct user roles (`customer`, `admin`) and requires fast authentication without server-side session lookup bottlenecks.
- **Decision**: Use HMAC-SHA256 signed JSON Web Tokens (JWT) containing `{ "sub": user_id, "role": user_role, "exp": expiration }`.
- **Rationale**:
  - Stateless tokens eliminate session storage overhead on the backend.
  - Role claim embedded in token allows instantaneous frontend route guard checks (`ProtectedRoute`, `AdminRoute`) and fast backend middleware authorization (`require_admin`).
- **Consequences**: Token revocation prior to expiration requires a token blocklist (Redis) if immediate logout is strictly necessary; for this version, short token lifespans (60 min) with refresh tokens will be standard.

---

### ADR-004: Client State Management via React Context + Custom Hooks
- **Context**: The frontend requires sharing authentication state (`user`, `token`, `login`, `logout`) and shopping cart state (`items`, `addItem`, `removeItem`, `coupon`) across disparate components (Navbar, Cart Drawer, Checkout, Account Page).
- **Decision**: Implement lightweight React Context providers (`AuthContext`, `CartContext`) paired with custom hooks (`useAuth()`, `useCart()`) and `localStorage` hydration.
- **Rationale**:
  - Avoids adding heavy external state libraries (Redux Toolkit) for straightforward domain stores.
  - Simplifies component testing and keeps the bundle lightweight.
- **Consequences**: Context re-renders are kept minimal by isolating high-frequency state updates.

---

### ADR-005: API-First Contract-Driven Architecture with OpenAPI 3.0
- **Context**: Frontend and backend are developed in parallel. Discrepancies in payload shapes cause integration bugs.
- **Decision**: FastAPI acts as the single source of truth. Every endpoint defines explicit Pydantic request and response schemas, producing OpenAPI 3.0 specs available at `/docs`.
- **Rationale**: Eliminates guesswork; frontend engineers and automated test suites validate payloads against typed schemas.
- **Consequences**: Any schema change must be versioned and reflected in API documentation.

---

### ADR-006: Monorepo Directory Organization (`frontend/` + `backend/`)
- **Context**: Project consists of both frontend and backend codebases.
- **Decision**: Keep both codebases in the root directory under `frontend/` and `backend/`, with top-level `tests/` and `docs/`.
- **Rationale**:
  - Single repository simplifies coordinated version control, atomic PRs, and unified CI/CD pipelines.
  - Matches the user's explicit folder structure requirements.

---

### ADR-007: Phased Non-Destructive Migration from Prototype to Production FTS Store
- **Context**: An existing lightweight prototype was created in `frontend/` and `backend/`.
- **Decision**:
  - Preserve the existing prototype as a verified baseline during the planning and backend foundation stages.
  - Migrate incrementally:
    1. First build the production-grade SQLAlchemy backend, database models, and Pytest suite.
    2. Then scaffold the React + Vite + TypeScript frontend.
    3. Verify and test each phase before cutting over.
- **Rationale**: Respects Non-Negotiable Development Rule #3: "Do not overwrite existing project files without inspecting them first" and Rule #4: "Work in small, independently verifiable phases."
- **Consequences**: No existing working functionality is broken prematurely.

---

### ADR-008: Atomic Stock Deduction, Historical Price Snapshots, and Idempotent Order Creation
- **Context**: High concurrency checkouts can oversell inventory. Network timeouts or double-clicks can submit duplicate orders. Changing product prices can distort past order records.
- **Decision**:
  1. **Idempotency Key**: Orders accept an optional or generated `Idempotency-Key` header (`Order.idempotency_key` unique indexed string). When an order with the same key is submitted, the existing order is returned immediately without creating new line items or re-deducting inventory.
  2. **Atomic Stock Deduction**: Stock availability is verified and deducted atomically inside a database transaction (`product.stock_quantity -= qty`). If any item is out of stock, the transaction rolls back cleanly with a 400 error.
  3. **Immutable Price Snapshots**: Line items persist `unit_price`, `product_sku`, and `product_name` at purchase time in `order_items`, insulating historical orders from subsequent catalog price updates.
  4. **Inventory Restoration on Cancellation**: Orders in `pending` or `processing` status can be cancelled, which automatically and atomically increments stock back (`product.stock_quantity += qty`) and sets payment status to `refunded`.

---

### ADR-009: Transparent Demo Payment Simulation Architecture & Webhook Security
- **Context**: The store requires a safe checkout demonstration before live payment gateway credentials and contracts are wired up.
- **Decision**:
  1. **Simulation Transparency**: Built an interactive in-browser and API Demo Payment Simulator (`/orders/{order_number}/pay`). The simulator explicitly tags records with `gateway_metadata = {"mode": "simulation", "simulated": true, "processor": "FTS Demo Payment Simulator"}`.
  2. **Strict Security Posture**: Real payment credentials (full PAN, CVV) are never accepted or stored.
  3. **Server-Side Authority**: The browser can never dictate payment success; payment states transition exclusively via authoritative backend endpoints or verified webhooks.
  4. **HMAC Webhook Verification**: `POST /payments/webhook` enforces constant-time HMAC-SHA256 signature checking (`X-Webhook-Signature`) and in-memory event deduplication to safely ignore replayed or out-of-order events.

