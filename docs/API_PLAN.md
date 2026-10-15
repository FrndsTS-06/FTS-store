# FTS Store — RESTful API Specification & Plan

**Base URL**: `/api/v1`  
**Protocol**: HTTPS / RESTful JSON  
**Documentation**: Automatic OpenAPI 3.0 via Swagger (`/docs`) & ReDoc (`/redoc`)  

---

## 1. Global API Conventions

### 1.1 Headers
- Content-Type: `application/json`
- Accept: `application/json`
- Authorization: `Bearer <JWT_ACCESS_TOKEN>` (for authenticated endpoints)

### 1.2 Standard Response Envelopes
Successful responses return directly typed objects or lists.

Error responses return a standardized RFC 7807 compliant structure:
```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Requested quantity (5) exceeds available stock (3) for product 'AuraPulse Headphones'.",
    "details": [
      {
        "field": "quantity",
        "issue": "out_of_stock"
      }
    ]
  }
}
```

### 1.3 Standard Status Codes
- `200 OK`: Successful read or update.
- `201 Created`: Resource successfully created (registration, product, order).
- `204 No Content`: Successful deletion.
- `400 Bad Request`: Validation failure or business rule violation.
- `401 Unauthorized`: Missing or invalid authentication token.
- `403 Forbidden`: Authenticated user lacks sufficient permissions (e.g., non-admin calling admin endpoint).
- `404 Not Found`: Resource does not exist.
- `409 Conflict`: Unique constraint violation (e.g. duplicate email, duplicate SKU).
- `422 Unprocessable Entity`: Pydantic payload validation failure.
- `500 Internal Server Error`: Unhandled server exception.

---

## 2. Comprehensive Endpoint Catalog

### 2.1 Authentication Endpoints (`/api/v1/auth`) — [IMPLEMENTED & TESTED]

| Method | Endpoint | Access | Status Codes | Description |
|---|---|---|---|---|
| `POST` | `/auth/register` | Public | `201`, `400`, `409`, `422` | Register new customer account; sets HttpOnly cookie & returns JWT |
| `POST` | `/auth/login` | Public | `200`, `401`, `422`, `429` | Authenticate credentials with sliding-window brute-force rate limiter |
| `POST` | `/auth/logout` | Customer / Admin | `200`, `401` | Revoke active JWT JTI and clear session cookies |
| `GET` | `/auth/me` | Customer / Admin | `200`, `401` | Retrieve current authenticated user profile |
| `PUT` | `/auth/me` | Customer / Admin | `200`, `400`, `401`, `422` | Update user display name and profile metadata |
| `POST` | `/auth/change-password`| Customer / Admin | `200`, `400`, `401`, `422` | Secure password change requiring current password verification |

#### Security Policies & Features:
1. **Password Hashing**: Passwords hashed with `bcrypt` (12 rounds) and unique salt. Plaintext passwords are never stored or logged.
2. **Password Complexity**: Requires minimum 8 characters, at least one letter, and at least one digit.
3. **Role-Based Authorization (RBAC)**: Role is never accepted from registration payloads; new accounts are strictly assigned `customer` role. Admin routes require `role == "admin"` verified authoritatively in the database.
4. **Brute-Force Abuse Mitigation**: Sliding-window rate limiter tracks failed login attempts; exceeding 5 failures within 5 minutes locks out authentication with `429 Too Many Requests`.
5. **Controlled Administrator Provisioning**: Default administrator accounts are not publicly exposed. Administrators must be provisioned in controlled environments using the dedicated CLI:
   ```bash
   python -m app.cli.create_admin --email admin@frndstech.com --name "System Admin"
   # Prompts securely for password without echoing
   ```

#### Payload Examples:
**`POST /auth/register` Request:**
```json
{
  "email": "customer@example.com",
  "password": "StrongPassword123!",
  "full_name": "Sarah Connor"
}
```
**`POST /auth/login` Response (`200 OK`):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "c1f7b8a0-2f3b-4c5d-8e9f-0a1b2c3d4e5f",
    "email": "customer@example.com",
    "full_name": "Sarah Connor",
    "role": "customer",
    "is_active": true,
    "created_at": "2026-10-13T16:00:00Z",
    "updated_at": "2026-10-13T16:00:00Z"
  }
}
```

---

### 2.2 Categories Endpoints (`/api/v1/categories`) — [IMPLEMENTED & TESTED]

| Method | Endpoint | Access | Status Codes | Description |
|---|---|---|---|---|
| `GET` | `/categories` | Public | `200` | List all active categories with dynamic active product counts |
| `GET` | `/categories/{id_or_slug}` | Public | `200`, `404` | Retrieve single category detail by slug or UUID |
| `POST` | `/categories` | **Admin Only** | `201`, `401`, `403`, `409`, `422` | Create a new category |
| `PUT` | `/categories/{category_id}` | **Admin Only** | `200`, `401`, `403`, `404`, `409`, `422` | Update existing category metadata or visibility |
| `DELETE`| `/categories/{category_id}` | **Admin Only** | `204`, `401`, `403`, `404` | Soft-archive category (`is_active = False`) |

#### Query Parameters:
- `include_inactive` (boolean, default: `false`): Include inactive/archived categories.

---

### 2.3 Products Endpoints (`/api/v1/products`) — [IMPLEMENTED & TESTED]

| Method | Endpoint | Access | Status Codes | Description |
|---|---|---|---|---|
| `GET` | `/products` | Public | `200`, `400` | Search, filter, sort, and paginate active catalog products |
| `GET` | `/products/featured` | Public | `200` | Retrieve top featured and highly rated products |
| `GET` | `/products/{id_or_slug}` | Public | `200`, `404` | Retrieve single product details with image gallery & stock status |
| `POST` | `/products` | **Admin Only** | `201`, `400`, `401`, `403`, `404`, `409`, `422` | Create new product with gallery images |
| `PUT` | `/products/{product_id}` | **Admin Only** | `200`, `400`, `401`, `403`, `404`, `409`, `422` | Update existing product details, pricing, or media |
| `PATCH`| `/products/{product_id}/stock` | **Admin Only** | `200`, `401`, `403`, `404`, `422` | Quick warehouse inventory quantity update |
| `DELETE`| `/products/{product_id}` | **Admin Only** | `204`, `401`, `403`, `404` | Soft-archive product (`is_active = False`) |

#### Query Parameters for `GET /api/v1/products`:
- `category` (string, optional): Filter by category slug or category UUID.
- `search` (string, optional): Keyword search matching product name or description.
- `min_price` (Decimal, >= 0, optional): Lower price bound.
- `max_price` (Decimal, >= 0, optional): Upper price bound. (Returns `400 INVALID_PRICE_RANGE` if `min_price > max_price`).
- `badge` (string, optional): Filter by promotional badge (`Trending`, `Best Seller`, `Sale`, `New Arrival`).
- `in_stock_only` (boolean, default: `false`): Only return products where `stock_quantity > 0`.
- `include_inactive` (boolean, default: `false`): Include inactive products (hidden from public shoppers by default).
- `sort_by` (string, default: `"newest"`): Sorting criteria:
  - `"price-low"` / `"price_asc"`: Price ascending
  - `"price-high"` / `"price_desc"`: Price descending
  - `"name-asc"`: Product title alphabetical (A-Z)
  - `"name-desc"`: Product title reverse alphabetical (Z-A)
  - `"newest"`: Creation date descending
  - `"oldest"`: Creation date ascending
  - `"rating"`: Product rating descending
  - `"featured"`: Badged/top products prioritized
- `page` (integer, >= 1, default: `1`): Current page index.
- `page_size` (integer, 1..100, default: `12`): Number of records per page.

#### Admin Authorization Methods:
Admin write endpoints require elevated privileges via either:
1. Header: `X-Admin-Key: fts_admin_secret_key_2026`
2. Header: `Authorization: Bearer fts-admin-token` or valid JWT with `role == "admin"`.
Unauthenticated requests receive `401 Unauthorized`; non-admin credentials receive `403 Forbidden`.

---

### 2.4 Cart & Pricing Engine Endpoints (`/api/v1/cart`) — [IMPLEMENTED & TESTED]

Cart identity uses either:
- **Guest Sessions**: `X-Session-ID: <session_uuid>` header (persisted across browser reloads via `localStorage`).
- **Authenticated Customers**: `Authorization: Bearer <token>` automatically maps the database user ID.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/cart` | Public / Auth | Retrieve current items, pricing subtotal, discounts |
| `POST` | `/cart/items` | Public / Auth | Add product to cart (merges duplicate quantities) |
| `PUT` | `/cart/items/{item_id}` | Public / Auth | Update line-item quantity |
| `DELETE`| `/cart/items/{item_id}` | Public / Auth | Remove line-item |
| `DELETE`| `/cart` | Public / Auth | Empty shopping cart |
| `POST` | `/cart/apply-coupon` | Public / Auth | Validate promo code and recalculate totals |
| `DELETE`| `/cart/remove-coupon`| Public / Auth | Remove applied discount code |
| `POST` | `/cart/calculate` | Public / Auth | Stateless dry-run cart calculation |

**Pricing Calculation Response (`POST /cart/apply-coupon`):**
```json
{
  "items": [
    {
      "product_id": "p001-uuid",
      "name": "AuraPulse Wireless Headphones",
      "unit_price": 249.99,
      "quantity": 1,
      "total_price": 249.99
    }
  ],
  "subtotal": 249.99,
  "discount_amount": 25.00,
  "coupon_code": "WELCOME10",
  "tax_rate": 0.08,
  "tax_amount": 18.00,
  "shipping_fee": 0.00,
  "is_free_shipping": true,
  "free_shipping_threshold": 100.00,
  "total": 242.99,
  "item_count": 1
}
```

---

### 2.5 Orders & Payment Endpoints (`/api/v1/orders` & `/api/v1/payments`)

> **[SIMULATION TRANSPARENCY DISCLOSURE]**  
> The implemented payment flow is an interactive **Demo Simulation** (`gateway_metadata.simulated = true`, processor: `"FTS Demo Payment Simulator"`). No real card charges, bank transfers, or funds movement occur. Webhook endpoints enforce server-side HMAC-SHA256 signatures with event replay protection.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/orders` | Public / Auth | Create order with authoritative recalculation, atomic stock deduction, price snapshots, and idempotency key support (`Idempotency-Key` header) |
| `GET` | `/orders/my-orders` | **Customer** | Retrieve authenticated customer's order history with status badges |
| `GET` | `/orders/{order_number}` | Customer / Guest Owner | Retrieve single order receipt, timeline, price snapshots, and payment records |
| `POST` | `/orders/{order_number}/pay` | Customer / Guest Owner | Simulate payment execution (`outcome: "success" \| "failure"`). Authoritatively updates order status |
| `POST` | `/orders/{order_number}/cancel` | Customer / Guest Owner | Cancel order prior to dispatch; atomically restores reserved inventory |
| `POST` | `/payments/webhook` | Server / Gateway | Process server-to-server webhook events with HMAC-SHA256 signature verification and idempotency |

**`POST /orders` Request:**
```json
{
  "shipping_address": {
    "full_name": "Jordan Smith",
    "phone": "+1-555-0192",
    "address_line1": "456 Innovation Way",
    "address_line2": "Suite 300",
    "city": "Austin",
    "state": "TX",
    "postal_code": "78701",
    "country": "United States"
  },
  "payment_method": "card",
  "coupon_code": "WELCOME10"
}
```

**`POST /orders` Response (`201 Created`):**
```json
{
  "id": "ord-88b12-uuid",
  "order_number": "FTS-20261013-A1B2C3",
  "idempotency_key": "idemp-1728821940-abc",
  "tracking_number": "TRK-9F8E7D6C5B",
  "status": "pending",
  "payment_status": "pending",
  "subtotal": 249.99,
  "discount_amount": 25.00,
  "coupon_code": "WELCOME10",
  "tax_rate": 0.08,
  "tax_amount": 18.00,
  "shipping_fee": 0.00,
  "total_amount": 242.99,
  "payment_method": "card",
  "shipping_address": { ... },
  "items": [
    {
      "id": "item-uuid",
      "product_id": "prod-uuid",
      "product_name": "AuraPulse Wireless Headphones",
      "product_sku": "FTS-AP-001",
      "unit_price": 249.99,
      "quantity": 1,
      "total_price": 249.99,
      "image_url": "https://..."
    }
  ],
  "payments": [],
  "created_at": "2026-10-13T14:35:00Z",
  "updated_at": "2026-10-13T14:35:00Z"
}
```

**`POST /orders/{order_number}/pay` Simulation Request:**
```json
{
  "outcome": "success",
  "card_last4": "4242",
  "card_brand": "Visa"
}
```

**`POST /orders/{order_number}/pay` Response:**
```json
{
  "success": true,
  "order_number": "FTS-20261013-A1B2C3",
  "payment_status": "completed",
  "order_status": "processing",
  "transaction_reference": "SIM-TXN-ABC1234567",
  "message": "Simulated payment processed successfully (no real funds transferred).",
  "is_simulation": true
}
```

---

### 2.6 Admin Dashboard & Operations Endpoints (`/api/v1/admin`) — [IMPLEMENTED & TESTED]

| Method | Endpoint | Access | Status Codes | Description |
|---|---|---|---|---|
| `GET` | `/admin/metrics` | Admin Only | `200`, `401`, `403` | Core dashboard metrics: orders, settled revenue, catalog counts, low stock alerts, recent orders |
| `GET` | `/admin/orders` | Admin Only | `200`, `401`, `403` | Paginated orders with search (order number, buyer, email), status filter, and sorting |
| `GET` | `/admin/orders/{order_number}` | Admin Only | `200`, `401`, `403`, `404` | Detailed order inspection for legitimate fulfillment operations with delivery details and item snapshots |
| `PATCH`| `/admin/orders/{order_number}/status` | Admin Only | `200`, `400`, `401`, `403`, `404` | Enforce state-machine transitions, atomic stock restoration on cancellation, and audit logging |
| `GET` | `/admin/audit-logs` | Admin Only | `200`, `401`, `403` | Immutable administrative audit log inspection with actor, entity ID, action, and JSON deltas |

#### Order Status State Machine Transitions
```
[PENDING]    ───► [PROCESSING] ───► [SHIPPED] ───► [DELIVERED] (Terminal)
    │                  │
    └──────────────────┴──────────► [CANCELLED] (Terminal + Atomic Inventory Restoration)
```
- **Allowed Transitions**:
  - `pending` $\rightarrow$ `processing`, `cancelled`
  - `processing` $\rightarrow$ `shipped`, `cancelled`
  - `shipped` $\rightarrow$ `delivered`
  - `delivered` $\rightarrow$ None (Terminal)
  - `cancelled` $\rightarrow$ None (Terminal)
- **Automatic Stock Restoration**: When transitioning to `cancelled`, all ordered quantities are atomically added back to product inventory and `is_in_stock` flags updated.
- **Payment Handling**: If the cancelled order had `payment_status == 'completed'`, payment status is automatically transitioned to `refunded`.

#### Status Update Payload:
```json
{
  "status": "shipped",
  "notes": "Carrier tracking assigned: FEDEX-9823412"
}
```


---

### 2.7 System & Diagnostics

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Service health & database connectivity check |
| `GET` | `/` | Public | API root gateway metadata and route directory |
