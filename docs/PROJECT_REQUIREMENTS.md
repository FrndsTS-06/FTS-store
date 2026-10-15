# FTS Store — Project Requirements & Specification

**Client / Organization**: Frnds Tech Solution (FTS)  
**Project**: FTS Store — Enterprise Multi-Category E-Commerce Platform  
**Document Version**: 1.0.0 (Planning Stage)  
**Status**: Approved for Planning Review  

---

## 1. Executive Summary & Objective

**FTS Store** is a full-stack, enterprise-grade e-commerce application designed for **Frnds Tech Solution**. The system provides a responsive, performant customer storefront, a multi-category product catalog with real-time stock management, persistent shopping carts, discount coupons, an encrypted multi-step checkout workflow, authenticated customer order management, and a protected role-based **Admin Dashboard** for catalog and order fulfillment control.

---

## 2. User Roles & Authorization Matrix

| Role | Description | Access Rights & Scope |
|---|---|---|
| **Guest Shopper** | Anonymous visitor browsing the storefront | View catalog, search, filter, view product details, maintain guest cart (localStorage / session), initiate checkout. |
| **Authenticated Customer** | Registered shopper with verified credentials | All Guest rights + save shipping addresses, view historical orders, track live shipment status, manage profile, persist server-side cart. |
| **Store Admin** | Internal administrative personnel | All Customer rights + manage products (CRUD), manage categories (CRUD), update order statuses (pending -> paid -> processing -> shipped -> delivered -> cancelled), view sales and inventory analytics. |
| **Super Admin** | System owner / DevOps | All Admin rights + manage admin users, export system audit logs, configure global store parameters (tax rates, shipping fees, currency). |

---

## 3. End-to-End User Journeys

### 3.1 Customer Shopping Journey
1. **Discovery**: Customer visits homepage, views curated hero highlights, explores category pills, uses instant debounced search to find items.
2. **Evaluation**: Customer filters by category, price bounds, or customer rating, clicks into Product Detail Page (PDP) to inspect high-resolution imagery, feature bullet points, and stock availability.
3. **Cart Addition**: Customer selects quantity, adds product to cart; cart slide-over drawer animates open displaying subtotal, tax estimation, and free shipping progress ($100 threshold).
4. **Checkout**: Customer navigates to checkout, supplies shipping address, enters optional discount promo code (e.g., `WELCOME10`), selects payment method (Credit Card simulation, PayPal, Cash on Delivery).
5. **Confirmation**: Order is validated against live inventory; upon confirmation, customer receives a unique Order ID (`FTS-ORD-XXXX`) and shipment tracking number (`FTS-TRK-XXXX`).

### 3.2 Customer Account Journey
1. **Registration & Login**: Customer signs up with email, full name, and password; receives JWT token with encrypted session cookie / bearer token.
2. **Order History**: Customer navigates to `/account/orders`, views past order receipts, status timestamps, and line-item breakdowns.
3. **Address Book**: Customer manages default delivery address for 1-click checkout.

### 3.3 Admin Fulfillment & Operations Journey
1. **Authentication**: Admin logs into `/admin/login` using credentials with `role: admin`.
2. **Dashboard Overview**: Admin reviews real-time metrics: Total Sales Revenue, Pending Orders count, Low Stock Alerts (< 5 units), and Recent Orders stream.
3. **Product Management**: Admin adds new product with title, description, category, SKU, cost price, retail price, stock units, and media URLs.
4. **Order Processing**: Admin filters orders by status (`pending`, `processing`, `shipped`), reviews customer shipping address, marks order as `shipped`, entering carrier tracking details.

---

## 4. Core Business Rules

1. **Inventory Management & Reservation**:
   - A product cannot be ordered if `stock_quantity < requested_quantity`.
   - When an order is confirmed, inventory is decremented atomically in a database transaction.
   - If an order is cancelled or refunded, stock is automatically returned to inventory.
   - Products with `stock_quantity == 0` display an "Out of Stock" badge and disable the "Add to Cart" action.
2. **Pricing, Discounts & Taxes**:
   - Currency: USD (`$`).
   - Default Sales Tax: 8.00% applied to subtotal after promotional discounts.
   - Standard Shipping Fee: $9.99 for orders under $100.00.
   - Free Shipping Threshold: Subtotal >= $100.00 qualifies for $0.00 standard shipping.
   - Discount Coupons:
     - Percentage discount (e.g. 10%, 20%).
     - Applied to subtotal prior to tax calculation.
     - Case-insensitive, validated against active date range and usage limits.
3. **Order State Machine**:
   - Permissible transitions:
     - `pending` -> `paid` -> `processing` -> `shipped` -> `delivered`
     - `pending` | `paid` | `processing` -> `cancelled`
   - Only admins can transition orders to `processing`, `shipped`, or `delivered`.
   - Customers can cancel only while status is `pending`.
4. **Security & Data Privacy**:
   - Passwords hashed using bcrypt / Argon2 with minimum cost factor of 12.
   - Authentication tokens: JWT signed with HMAC-SHA256, expiration: 60 minutes for access tokens, 7 days for refresh tokens.
   - Role-Based Access Control (RBAC): Protected backend endpoints verify user identity and enforce `admin` role claims.
   - Sensitive customer data (passwords, payment card CVVs) are NEVER logged or stored in plain text.

---

## 5. Non-Functional Requirements

1. **Performance**:
   - Catalog queries < 150ms response time under 50 concurrent connections.
   - Frontend bundle load time < 1.5s on broadband; First Contentful Paint (FCP) < 0.8s.
2. **Accessibility**:
   - WCAG 2.1 Level AA compliance: keyboard navigation, descriptive `aria-label` tags, appropriate contrast ratios (> 4.5:1).
3. **Responsiveness**:
   - Seamless usability across mobile (320px+), tablet (768px+), desktop (1024px+), and ultrawide displays.
4. **Reliability & Error Handling**:
   - Standardized API error envelopes with machine-readable error codes.
   - Resilient database transaction rollbacks upon unexpected failures.
5. **Observability**:
   - Structured JSON logging for API requests and errors with correlation IDs.

---

## 6. Acceptance Criteria Matrix

| Feature Area | Criteria |
|---|---|
| **Product Catalog** | Displays multi-category products with pagination, instant keyword search, category pills, and sort dropdown. |
| **Product Detail** | Displays title, SKU, gallery images, rating, stock status, features list, and quantity selector. |
| **Cart System** | Updates dynamically, persists across page refreshes, computes subtotal, tax, free shipping bar, and coupon deductions. |
| **Authentication** | Registration validates email uniqueness, login returns JWT, token persists, route guards prevent unauthorized access. |
| **Checkout & Orders** | Validates addresses, checks stock in transaction, produces immutable order receipt with unique tracking ID. |
| **Admin Dashboard** | Protected route (`/admin`), displays KPI stats, allows product creation/editing, and updates order statuses. |
| **Code Quality** | Type-safe TypeScript frontend, Pydantic validated backend schemas, automated Pytest coverage >= 80%. |
