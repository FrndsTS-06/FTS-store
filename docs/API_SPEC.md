# FTS Store — API Specification

FTS Store provides an enterprise RESTful API with automated interactive documentation available at `/docs` (Swagger UI) and `/redoc` (ReDoc) when running the server.

Base URL: `http://127.0.0.1:8000/api/v1` (Production v1)  
Legacy Prototype URL: `http://127.0.0.1:8000/api` (Backward Compatibility)

---

## 1. System Endpoints

### `GET /`
Returns API metadata, server status, and catalog statistics.

### `GET /health`
Liveness health check endpoint.
- **Response**: `{"status": "healthy", "timestamp": "ok"}`

---

## 2. Products API

### `GET /api/products`
Lists products with optional category, keyword search, price boundaries, and sorting.

**Query Parameters:**
| Parameter | Type | Required | Description | Example |
|---|---|---|---|---|
| `category` | string | No | Filter by category slug | `electronics`, `fashion`, `home` |
| `search` | string | No | Search text in title, description, tags | `wireless` |
| `min_price`| float | No | Lower bound price | `50.0` |
| `max_price`| float | No | Upper bound price | `300.0` |
| `badge` | string | No | Filter by badge | `Trending`, `Best Seller` |
| `sort_by` | string | No | Sort option: `featured`, `price-low`, `price-high`, `rating`, `newest` | `price-low` |

**Sample Response (`200 OK`):**
```json
{
  "total": 4,
  "count": 4,
  "items": [
    {
      "id": "prod-elec-01",
      "name": "AuraPulse Wireless Noise-Cancelling Headphones",
      "slug": "aurapulse-wireless-headphones",
      "category": "electronics",
      "price": 249.99,
      "original_price": 299.99,
      "discount_pct": 17,
      "rating": 4.9,
      "review_count": 342,
      "stock": 45,
      "badge": "Best Seller",
      "description": "Flagship hybrid active noise cancellation...",
      "features": ["Hybrid 42dB ANC", "40-hour playback"],
      "image": "https://images.unsplash.com/...",
      "tags": ["audio", "wireless"],
      "created_at": "2026-09-01T10:00:00Z"
    }
  ],
  "categories": [...]
}
```

### `GET /api/products/featured`
Returns top-rated products.
- **Query Parameter**: `limit` (default: 6)

### `GET /api/products/{product_id}`
Returns full details for a product by its ID or slug.
- **Response**: Product object (`200 OK`) or `404 Not Found`.

---

## 3. Categories API

### `GET /api/categories`
Returns all categories with slug, display icon, and item count.

### `GET /api/categories/{slug}`
Returns category details for a specific category slug.

---

## 4. Cart & Pricing API

### `POST /api/cart/calculate`
Calculates subtotal, discounts, sales tax (8%), shipping fee ($9.99 or free over $100), and final total.

**Request Body:**
```json
{
  "items": [
    { "product_id": "prod-elec-01", "quantity": 1 },
    { "product_id": "prod-home-02", "quantity": 2 }
  ],
  "coupon_code": "WELCOME10"
}
```

**Response (`200 OK`):**
```json
{
  "items": [
    {
      "product_id": "prod-elec-01",
      "product_name": "AuraPulse Wireless Noise-Cancelling Headphones",
      "unit_price": 249.99,
      "quantity": 1,
      "total_price": 249.99
    }
  ],
  "subtotal": 386.99,
  "discount_amount": 38.70,
  "discount_applied": "WELCOME10 (-10%)",
  "tax_rate": 0.08,
  "tax_amount": 27.86,
  "shipping_fee": 0.0,
  "is_free_shipping": true,
  "free_shipping_threshold": 100.0,
  "total": 376.15,
  "item_count": 3
}
```

### `POST /api/cart/coupon/validate`
Validates promo code and returns discount percentage.

**Supported Demo Coupons:**
- `WELCOME10`: 10% discount
- `SUPER20`: 20% discount
- `FESTIVE15`: 15% discount
- `VIP30`: 30% discount

---

## 5. Orders API

### `POST /api/orders`
Creates and registers a customer order.

**Request Body:**
```json
{
  "customer": {
    "full_name": "Jordan Smith",
    "email": "jordan@example.com",
    "phone": "+1-555-0144",
    "address": "456 Market St, Suite 200",
    "city": "San Francisco",
    "postal_code": "94103",
    "country": "United States"
  },
  "items": [
    { "product_id": "prod-elec-01", "quantity": 1 }
  ],
  "coupon_code": "WELCOME10",
  "payment_method": "card"
}
```

**Response (`200 OK`):**
```json
{
  "order_id": "ORD-A1B2C3D4",
  "status": "confirmed",
  "customer": {...},
  "summary": {...},
  "payment_method": "card",
  "created_at": "2026-10-13T14:20:00Z",
  "tracking_number": "TRK-F8E9D0C1B2"
}
```

### `GET /api/orders/{order_id}`
Retrieves confirmation details and live tracking number for an existing order.
