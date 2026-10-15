# FTS Store — Known Limitations & Technical Risk Registry

**Document Classification**: Engineering Operations & Handover Registry  
**Version**: 1.0.0  
**Status**: Active  

This document provides a transparent, unvarnished disclosure of all technical debt, known constraints, environment-specific limitations, and architectural recommendations before production launch.

---

## 1. Architectural & Production Limitations

### 1.1 In-Memory JWT Revocation List
- **Status**: ⚠️ **Known Limitation** (Acceptable for single-instance, requires Redis for multi-worker scaling)
- **Component**: [`backend/app/core/security.py`](file:///d:/projects_demo/e-commers/backend/app/core/security.py) (`_REVOKED_TOKENS`)
- **Impact**: When a customer or administrator logs out, their token's unique ID (`jti`) is added to an in-memory set. If the backend is horizontally scaled across multiple Gunicorn worker processes or container instances without sticky sessions, another worker process will not recognize the revoked token until its natural 60-minute expiration.
- **Remediation**: Before multi-node clustering, configure Redis:
  ```python
  redis_client.setex(f"revoked_token:{jti}", settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60, "true")
  ```

---

### 1.2 Webhook Event Deduplication Cache
- **Status**: ⚠️ **Known Limitation**
- **Component**: [`backend/app/api/v1/endpoints/orders.py`](file:///d:/projects_demo/e-commers/backend/app/api/v1/endpoints/orders.py) (`_PROCESSED_WEBHOOK_EVENTS`)
- **Impact**: Processed webhook event IDs are tracked in a module-level Python `set`. A process restart clears this set, allowing duplicate webhook replay if the payment provider re-sends a historical notification.
- **Remediation**: Persist webhook idempotency records to the `payments` table or Redis key-value store with a 72-hour TTL.

---

### 1.3 Local SQLite vs. Remote Managed PostgreSQL
- **Status**: ℹ️ **Environment Fallback**
- **Component**: [`backend/app/db/session.py`](file:///d:/projects_demo/e-commers/backend/app/db/session.py)
- **Impact**: Local development operates using SQLite (`fts_store.db`). While all migrations, constraints, and relationships have been written to standard SQL-92 and verified with Alembic, specific PostgreSQL enterprise features (such as `SELECT ... FOR UPDATE` row locks and native `jsonb` operations) require a live managed PostgreSQL instance.
- **Remediation**: In production, configure `DATABASE_URL` pointing to AWS RDS, Supabase, or Neon with SSL mode enabled (`sslmode=require`).

---

### 1.4 Browser Automation Tool Driver Download Constraint
- **Status**: ⚠️ **Environment Limitation** (CI / Tooling Level)
- **Component**: Playwright browser driver
- **Impact**: Automated execution of Playwright via the IDE subagent encountered a network `404 Not Found` response from the external Azure CDN driver archive. Real-browser automation was substituted by verified HTTP, API, session, HTML, and client-side production build checks.
- **Remediation**: When running in standard CI/CD environments (such as GitHub Actions Ubuntu runners), the driver installs cleanly via `npx playwright install --with-deps`.

---

### 1.5 Product Image Asset Storage
- **Status**: ℹ️ **Configuration Dependency**
- **Component**: [`backend/app/core/config.py`](file:///d:/projects_demo/e-commers/backend/app/core/config.py)
- **Impact**: Product images currently reference curated Unsplash CDN URLs and local fallback icons. There is no automated image resize pipeline (e.g. sharp/libvips).
- **Remediation**: Integrate AWS S3, Cloudflare R2, or Cloudinary using the pre-configured `MEDIA_STORAGE_BACKEND` settings in `Settings` before enabling user-uploaded images.

---

### 1.6 Live Payment Gateway Integration
- **Status**: 🛡️ **Simulated By Design**
- **Component**: [`backend/app/services/order_service.py`](file:///d:/projects_demo/e-commers/backend/app/services/order_service.py) (`simulate_order_payment`)
- **Impact**: Live payments are strictly simulated (`PAYMENT_GATEWAY_MODE=simulation`) with card brand detection, simulated authorization outcomes, and webhook signatures. Real payment processor API keys (Stripe, PayPal, Razorpay) are not active.
- **Remediation**: See Section 8 of [`docs/PROJECT_HANDOVER.md`](file:///d:/projects_demo/e-commers/docs/PROJECT_HANDOVER.md) for step-by-step instructions for activating live Stripe payments.

---

## 2. Summary Risk Matrix

| Risk / Limitation | Severity | Likelihood | Mitigation Strategy |
|---|---|---|---|
| In-memory token revocation across clusters | Medium | Low | Deploy Redis for centralized session blacklisting |
| In-memory webhook event deduplication | Medium | Low | Store processed event IDs in database |
| Unconfigured remote PostgreSQL | Low | High | Set `DATABASE_URL` in production `.env` |
| Image asset hosting on third-party URLs | Low | Medium | Configure dedicated S3 / Cloudflare R2 bucket |
| Live card payments disabled | None (Expected) | High | Keep simulation mode until merchant keys acquired |
