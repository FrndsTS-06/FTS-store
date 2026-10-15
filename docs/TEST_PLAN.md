# FTS Store — Quality Assurance & Comprehensive Test Plan

**Project**: FTS Store (Frnds Tech Solution)  
**Lead**: Senior QA Engineer & Security Reviewer  
**Frameworks**: Pytest, FastAPI TestClient, HTTPX, Vitest, Playwright  

---

## 1. Testing Pyramid & Strategy

```
           / \
          /   \
         / E2E \         End-to-End User Journeys (Playwright / Browser)
        /-------\
       /  API    \       API Integration & Business Logic Tests (Pytest + HTTPX)
      / Integration\
     /---------------\
    /  Unit & Security\  Model Constraints, Security Guards, Utilities, Components
   /-------------------\
```

---

## 2. Backend Automated Test Suite Matrix

### 2.1 Authentication & Authorization (`tests/test_auth.py`)
| Test ID | Test Scenario | Inputs | Expected Output | Status Code |
|---|---|---|---|---|
| `AUTH-01` | Successful customer registration | Unique email, password, full name | User created, password hashed, token returned | `201 Created` |
| `AUTH-02` | Duplicate email registration | Already registered email | Error detail: "Email already registered" | `409 Conflict` |
| `AUTH-03` | Weak password validation | Password < 8 characters | Error detail: "Password must be at least 8 characters" | `422 Unprocessable` |
| `AUTH-04` | Successful login | Valid email and password | Signed JWT access token with user payload | `200 OK` |
| `AUTH-05` | Login with incorrect password | Valid email, wrong password | Error detail: "Invalid credentials" | `401 Unauthorized` |
| `AUTH-06` | Access `/auth/me` with valid token | Bearer valid JWT | Returns user profile details | `200 OK` |
| `AUTH-07` | Access `/auth/me` with expired token | Expired Bearer JWT | Error detail: "Signature has expired" | `401 Unauthorized` |
| `AUTH-08` | Customer attempts to access Admin endpoint | Customer JWT token calling `/admin/metrics` | Error detail: "Admin privileges required" | `403 Forbidden` |

---

### 2.2 Catalog & Search Engine (`tests/test_catalog.py`)
| Test ID | Test Scenario | Inputs | Expected Output | Status Code |
|---|---|---|---|---|
| `CAT-01` | List all active categories | None | Array of categories with product counts | `200 OK` |
| `CAT-02` | List products with pagination | `page=1&page_size=10` | 10 products, `total`, `total_pages` metadata | `200 OK` |
| `CAT-03` | Filter products by category | `category=electronics` | Only electronics products returned | `200 OK` |
| `CAT-04` | Search products by keyword | `search=headphones` | Products matching name, tags, or description | `200 OK` |
| `CAT-05` | Filter products by price range | `min_price=100&max_price=200` | All returned items satisfy $100 <= price <= $200 | `200 OK` |
| `CAT-06` | Sort products by price ascending | `sort_by=price-low` | Prices monotonically increasing | `200 OK` |
| `CAT-07` | Sort products by rating | `sort_by=rating` | Ratings ordered highest to lowest | `200 OK` |
| `CAT-08` | Single product detail retrieval | Valid product slug | Product object with images and specs | `200 OK` |
| `CAT-09` | Non-existent product retrieval | Invalid slug | Error detail: "Product not found" | `404 Not Found` |
| `CAT-10` | Admin creates new product | Admin JWT + product payload | Product persisted, SKU unique | `201 Created` |
| `CAT-11` | Non-admin attempts to create product | Customer JWT + product payload | Rejected | `403 Forbidden` |

---

### 2.3 Shopping Cart & Pricing Engine (`tests/test_cart.py`)
| Test ID | Test Scenario | Inputs | Expected Output | Status Code |
|---|---|---|---|---|
| `CART-01` | Add item to cart | Product ID and quantity = 2 | Cart item created with calculated line total | `200 OK` |
| `CART-02` | Update cart item quantity | Item ID, new quantity = 4 | Cart quantity updated, totals refreshed | `200 OK` |
| `CART-03` | Remove item from cart | Item ID | Item removed from cart | `200 OK` |
| `CART-04` | Apply valid 10% coupon (`WELCOME10`) | Cart subtotal = $200.00 | Discount = $20.00, Subtotal = $180.00 | `200 OK` |
| `CART-05` | Apply invalid coupon code | `INVALID99` | Error: "Coupon code is invalid or expired" | `400 Bad Request` |
| `CART-06` | Free shipping threshold calculation | Subtotal = $120.00 | `shipping_fee = 0.00`, `is_free_shipping = true` | `200 OK` |
| `CART-07` | Standard shipping fee applied | Subtotal = $45.00 | `shipping_fee = 9.99`, `is_free_shipping = false` | `200 OK` |
| `CART-08` | Sales tax calculation | Subtotal after discount = $100.00 | Tax amount = $8.00 (8.00% rate) | `200 OK` |

---

### 2.4 Checkout & Order Processing (`tests/test_orders.py`)
| Test ID | Test Scenario | Inputs | Expected Output | Status Code |
|---|---|---|---|---|
| `ORD-01` | Successful order creation | Customer address, items, payment method | Order created, tracking number generated | `201 Created` |
| `ORD-02` | Inventory decrement verification | Initial stock = 10, ordered = 3 | Remaining database stock = 7 | `201 Created` |
| `ORD-03` | Out of stock rejection | Initial stock = 2, ordered = 5 | Order rejected, stock remains 2 | `400 Bad Request` |
| `ORD-04` | Empty cart checkout attempt | Empty items array | Error: "Cannot place order with empty cart" | `400 Bad Request` |
| `ORD-05` | Customer views own order history | Customer JWT | Array containing only customer's own orders | `200 OK` |
| `ORD-06` | IDOR security protection | Customer A requests Order of Customer B | Access denied | `403 Forbidden` / `404` |
| `ORD-07` | Admin updates order status | Admin JWT + status = `shipped` | Status updated, timestamp recorded | `200 OK` |
| `ORD-08` | Invalid order status transition | Transition `delivered` -> `pending` | Rejected: "Invalid status transition" | `400 Bad Request` |

---

## 3. Security & Vulnerability Test Scenarios (`tests/test_security.py`)

1. **SQL Injection Resistance**:
   - Querying `/api/v1/products?search=' OR '1'='1` must safely search for the literal string without returning unindexed records or syntax errors.
2. **Client-Side Price Tampering Defense**:
   - Submitting an order payload with client-supplied unit price `$0.01` must be ignored; the backend must recalculate totals exclusively using server-side database prices.
3. **Password Security**:
   - Verify passwords are stored with bcrypt hash strings (e.g. `$2b$12$...`) and never in plain text.
4. **CORS Enforcement**:
   - Preflight `OPTIONS` requests from unauthorized origins (e.g., `http://malicious-site.com`) are rejected with no CORS headers.
5. **Mass-Assignment Protection**:
   - Sending `role: "admin"` in customer registration payload must be stripped by Pydantic; user must always be assigned `role: "customer"`.

---

## 4. Frontend Verification & Accessibility Checklist

- [ ] Responsive navigation bar collapses into mobile drawer on viewports < 768px.
- [ ] Debounced search displays results without page refresh within 300ms.
- [ ] Add-to-cart button displays loading spinner during network request and triggers success toast.
- [ ] Cart drawer displays live free shipping progress bar.
- [ ] Form validation prevents submission of empty addresses or invalid emails with clear inline errors.
- [ ] Dark and Light themes toggle cleanly with appropriate contrast in both states.
- [ ] All interactive elements are reachable via keyboard tab navigation.
- [ ] Screen readers announce cart count updates via `aria-live="polite"`.
