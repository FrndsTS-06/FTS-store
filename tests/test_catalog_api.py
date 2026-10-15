import uuid
import pytest
from decimal import Decimal
from fastapi.testclient import TestClient

ADMIN_KEY = "fts_admin_secret_key_2026"
ADMIN_HEADERS = {"X-Admin-Key": ADMIN_KEY}
BEARER_ADMIN_HEADERS = {"Authorization": "Bearer fts-admin-token"}
INVALID_AUTH_HEADERS = {"Authorization": "Bearer invalid_token_123"}

# =============================================================================
# Category API Tests
# =============================================================================

def test_list_categories(client: TestClient):
    """Verify listing active categories with dynamic item counts."""
    response = client.get("/api/v1/categories")
    assert response.status_code == 200
    categories = response.json()
    assert isinstance(categories, list)
    assert len(categories) >= 6

    # Verify attributes in response
    first = categories[0]
    assert "id" in first
    assert "name" in first
    assert "slug" in first
    assert "item_count" in first
    assert first["is_active"] is True
    assert isinstance(first["item_count"], int)


def test_get_category_by_slug_and_id(client: TestClient):
    """Retrieve category by both slug and UUID."""
    # 1. By slug
    res_slug = client.get("/api/v1/categories/electronics")
    assert res_slug.status_code == 200
    cat_data = res_slug.json()
    assert cat_data["slug"] == "electronics"
    assert "Electronics" in cat_data["name"]
    cat_id = cat_data["id"]

    # 2. By ID
    res_id = client.get(f"/api/v1/categories/{cat_id}")
    assert res_id.status_code == 200
    assert res_id.json()["id"] == cat_id
    assert res_id.json()["slug"] == "electronics"


def test_get_category_not_found(client: TestClient):
    """Verify 404 structured error for non-existent category."""
    response = client.get("/api/v1/categories/non-existent-category-slug-999")
    assert response.status_code == 404
    error = response.json().get("error", {})
    assert error.get("code") == "CATEGORY_NOT_FOUND"


def test_category_admin_access_control(client: TestClient):
    """Verify unauthenticated or unauthorized category modification attempts are blocked."""
    payload = {
        "name": "Smart Home Automation",
        "slug": f"smart-home-{uuid.uuid4().hex[:6]}",
        "description": "IoT and smart living hardware"
    }

    # Missing credentials -> 401
    res_no_auth = client.post("/api/v1/categories", json=payload)
    assert res_no_auth.status_code == 401

    # Invalid credentials -> 403
    res_bad_auth = client.post("/api/v1/categories", json=payload, headers=INVALID_AUTH_HEADERS)
    assert res_bad_auth.status_code == 403


def test_category_lifecycle_admin(client: TestClient):
    """Admin can create, update, and archive a category."""
    unique_slug = f"test-cat-{uuid.uuid4().hex[:8]}"
    create_payload = {
        "name": "Test Robotics",
        "slug": unique_slug,
        "description": "Cutting edge hobby and professional robotics",
        "icon_name": "Cpu",
        "is_active": True
    }

    # 1. Create with X-Admin-Key
    res_create = client.post("/api/v1/categories", json=create_payload, headers=ADMIN_HEADERS)
    assert res_create.status_code == 201
    created_cat = res_create.json()
    cat_id = created_cat["id"]
    assert created_cat["name"] == "Test Robotics"
    assert created_cat["slug"] == unique_slug

    # 2. Attempt duplicate slug -> 409 Conflict
    res_dup = client.post("/api/v1/categories", json=create_payload, headers=ADMIN_HEADERS)
    assert res_dup.status_code == 409
    assert res_dup.json()["error"]["code"] == "DUPLICATE_CATEGORY_SLUG"

    # 3. Update category with Bearer auth
    update_payload = {
        "name": "Advanced Robotics & AI",
        "description": "Updated description for robotics"
    }
    res_update = client.put(f"/api/v1/categories/{cat_id}", json=update_payload, headers=BEARER_ADMIN_HEADERS)
    assert res_update.status_code == 200
    assert res_update.json()["name"] == "Advanced Robotics & AI"

    # 4. Soft-archive category (DELETE)
    res_delete = client.delete(f"/api/v1/categories/{cat_id}", headers=ADMIN_HEADERS)
    assert res_delete.status_code == 204

    # 5. Check visibility: should not be in default list
    res_list = client.get("/api/v1/categories")
    active_ids = [c["id"] for c in res_list.json()]
    assert cat_id not in active_ids

    # But present if include_inactive=true
    res_all = client.get("/api/v1/categories?include_inactive=true")
    all_ids = [c["id"] for c in res_all.json()]
    assert cat_id in all_ids


# =============================================================================
# Product Catalogue Listing, Filtering, Sorting & Search Tests
# =============================================================================

def test_list_products_default_pagination(client: TestClient):
    """Verify default product listing returns structured pagination metadata and active products."""
    response = client.get("/api/v1/products")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "page_size" in data
    assert "total_pages" in data

    assert data["page"] == 1
    assert data["total"] >= 10
    assert len(data["items"]) <= 12

    # Check enriched product fields
    sample = data["items"][0]
    assert "is_in_stock" in sample
    assert "stock_status" in sample
    assert sample["stock_status"] in ["in_stock", "low_stock", "out_of_stock"]
    assert "primary_image" in sample
    assert "images" in sample
    assert sample["is_active"] is True


def test_filter_products_by_category(client: TestClient):
    """Filter products by category slug and verify all returned items match."""
    response = client.get("/api/v1/products?category=electronics")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    for item in data["items"]:
        assert item["category"] is not None
        assert item["category"]["slug"] == "electronics"


def test_search_products_by_name_and_description(client: TestClient):
    """Keyword search across name and description."""
    response = client.get("/api/v1/products?search=headphones")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    for item in data["items"]:
        match = "headphone" in item["name"].lower() or "headphone" in item["description"].lower()
        assert match


def test_filter_products_by_price_range(client: TestClient):
    """Filter products within min_price and max_price."""
    response = client.get("/api/v1/products?min_price=50&max_price=200")
    assert response.status_code == 200
    data = response.json()
    for item in data["items"]:
        price = float(item["price"])
        assert 50.0 <= price <= 200.0


def test_filter_products_invalid_price_range(client: TestClient):
    """Min price greater than max price must return 400 Bad Request."""
    response = client.get("/api/v1/products?min_price=300&max_price=100")
    assert response.status_code == 400
    error = response.json().get("error", {})
    assert error.get("code") == "INVALID_PRICE_RANGE"


def test_sort_products_price_asc_and_desc(client: TestClient):
    """Test price-low and price-high sorting."""
    # Price ascending
    res_low = client.get("/api/v1/products?sort_by=price-low&page_size=20")
    assert res_low.status_code == 200
    prices_low = [float(p["price"]) for p in res_low.json()["items"]]
    assert prices_low == sorted(prices_low)

    # Price descending
    res_high = client.get("/api/v1/products?sort_by=price-high&page_size=20")
    assert res_high.status_code == 200
    prices_high = [float(p["price"]) for p in res_high.json()["items"]]
    assert prices_high == sorted(prices_high, reverse=True)


def test_sort_products_name_asc(client: TestClient):
    """Test alphabetical sorting."""
    response = client.get("/api/v1/products?sort_by=name-asc&page_size=20")
    assert response.status_code == 200
    names = [p["name"] for p in response.json()["items"]]
    assert names == sorted(names)


def test_sort_products_invalid_criteria(client: TestClient):
    """Invalid sort criteria returns 400."""
    response = client.get("/api/v1/products?sort_by=unsupported_sort")
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "INVALID_SORT_OPTION"


def test_products_pagination(client: TestClient):
    """Pagination slices items and updates page metadata."""
    res_page1 = client.get("/api/v1/products?page=1&page_size=3")
    assert res_page1.status_code == 200
    data1 = res_page1.json()
    assert data1["page"] == 1
    assert data1["page_size"] == 3
    assert len(data1["items"]) == 3

    res_page2 = client.get("/api/v1/products?page=2&page_size=3")
    assert res_page2.status_code == 200
    data2 = res_page2.json()
    assert data2["page"] == 2
    assert len(data2["items"]) == 3

    # Check distinct items between pages
    ids_page1 = {item["id"] for item in data1["items"]}
    ids_page2 = {item["id"] for item in data2["items"]}
    assert ids_page1.isdisjoint(ids_page2)


def test_get_featured_products(client: TestClient):
    """Retrieve featured products endpoint."""
    response = client.get("/api/v1/products/featured?limit=4")
    assert response.status_code == 200
    items = response.json()
    assert isinstance(items, list)
    assert len(items) <= 4
    for item in items:
        assert item["is_active"] is True


def test_get_single_product_by_id_and_slug(client: TestClient):
    """Retrieve single product by slug and UUID."""
    # List one product to get id and slug
    list_res = client.get("/api/v1/products?page_size=1")
    target = list_res.json()["items"][0]
    prod_id = target["id"]
    prod_slug = target["slug"]

    # 1. By slug
    res_slug = client.get(f"/api/v1/products/{prod_slug}")
    assert res_slug.status_code == 200
    assert res_slug.json()["id"] == prod_id
    assert res_slug.json()["slug"] == prod_slug
    assert "description" in res_slug.json()
    assert "stock_quantity" in res_slug.json()

    # 2. By ID
    res_id = client.get(f"/api/v1/products/{prod_id}")
    assert res_id.status_code == 200
    assert res_id.json()["id"] == prod_id


def test_get_product_not_found(client: TestClient):
    """Retrieve non-existent product returns 404."""
    response = client.get("/api/v1/products/completely-unknown-product-xyz")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "PRODUCT_NOT_FOUND"


# =============================================================================
# Admin Product Management & Stock Control Tests
# =============================================================================

def test_admin_create_product_access_control(client: TestClient):
    """Unauthenticated users cannot create products."""
    payload = {
        "name": "Unauthorized Gadget",
        "slug": "unauthorized-gadget",
        "sku": "UNAUTH-001",
        "description": "Test",
        "price": 99.99,
        "stock_quantity": 10,
        "category_id": "any-id"
    }

    res_no_auth = client.post("/api/v1/products", json=payload)
    assert res_no_auth.status_code == 401

    res_bad_auth = client.post("/api/v1/products", json=payload, headers=INVALID_AUTH_HEADERS)
    assert res_bad_auth.status_code == 403


def test_admin_create_product_category_validation(client: TestClient):
    """Product creation with non-existent category_id returns 404."""
    payload = {
        "name": "Invalid Category Product",
        "slug": f"invalid-cat-{uuid.uuid4().hex[:6]}",
        "sku": f"SKU-{uuid.uuid4().hex[:6].upper()}",
        "description": "Valid description",
        "price": 49.99,
        "stock_quantity": 5,
        "category_id": "non-existent-cat-uuid"
    }
    response = client.post("/api/v1/products", json=payload, headers=ADMIN_HEADERS)
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "CATEGORY_NOT_FOUND"


def test_admin_product_full_lifecycle(client: TestClient):
    """
    Test full admin lifecycle:
    1. Create product with images.
    2. Enforce duplicate slug / SKU conflict (409).
    3. Update product details and price.
    4. Patch stock quantity and verify stock_status transitions.
    5. Soft-archive (delete) product and verify it is hidden from public shoppers.
    """
    # 1. Fetch valid category
    cat_res = client.get("/api/v1/categories/electronics")
    cat_id = cat_res.json()["id"]

    unique_suffix = uuid.uuid4().hex[:6]
    product_slug = f"quantum-pro-drone-{unique_suffix}"
    product_sku = f"QDRONE-{unique_suffix.upper()}"

    create_payload = {
        "name": f"Quantum Pro Drone {unique_suffix.upper()}",
        "slug": product_slug,
        "sku": product_sku,
        "description": "High-performance aerial camera drone with 8K obstacle avoidance.",
        "price": 899.99,
        "compare_at_price": 1099.99,
        "stock_quantity": 12,
        "category_id": cat_id,
        "badge": "New Arrival",
        "is_active": True,
        "images": [
            {
                "url": "https://images.unsplash.com/photo-drone-1",
                "alt_text": "Quantum Pro Drone Front View",
                "is_primary": True,
                "display_order": 0
            },
            {
                "url": "https://images.unsplash.com/photo-drone-2",
                "alt_text": "Quantum Pro Drone In Flight",
                "is_primary": False,
                "display_order": 1
            }
        ]
    }

    # 1. Create product
    res_create = client.post("/api/v1/products", json=create_payload, headers=ADMIN_HEADERS)
    assert res_create.status_code == 201
    created_prod = res_create.json()
    prod_id = created_prod["id"]

    assert created_prod["name"] == create_payload["name"]
    assert created_prod["slug"] == product_slug
    assert created_prod["sku"] == product_sku
    assert float(created_prod["price"]) == 899.99
    assert float(created_prod["compare_at_price"]) == 1099.99
    assert created_prod["discount_pct"] == 18
    assert created_prod["is_in_stock"] is True
    assert created_prod["stock_status"] == "in_stock"
    assert created_prod["primary_image"] == "https://images.unsplash.com/photo-drone-1"
    assert len(created_prod["images"]) == 2

    # 2. Duplicate slug conflict
    dup_slug_payload = dict(create_payload, sku=f"OTHER-{unique_suffix.upper()}")
    res_dup_slug = client.post("/api/v1/products", json=dup_slug_payload, headers=ADMIN_HEADERS)
    assert res_dup_slug.status_code == 409
    assert res_dup_slug.json()["error"]["code"] == "DUPLICATE_PRODUCT_SLUG"

    # Duplicate SKU conflict
    dup_sku_payload = dict(create_payload, slug=f"other-slug-{unique_suffix}")
    res_dup_sku = client.post("/api/v1/products", json=dup_sku_payload, headers=ADMIN_HEADERS)
    assert res_dup_sku.status_code == 409
    assert res_dup_sku.json()["error"]["code"] == "DUPLICATE_PRODUCT_SKU"

    # 3. Update product details (PUT)
    update_payload = {
        "price": 849.99,
        "badge": "Flash Sale",
        "description": "Updated drone description with enhanced battery specs."
    }
    res_update = client.put(f"/api/v1/products/{prod_id}", json=update_payload, headers=ADMIN_HEADERS)
    assert res_update.status_code == 200
    updated = res_update.json()
    assert float(updated["price"]) == 849.99
    assert updated["badge"] == "Flash Sale"
    assert "battery specs" in updated["description"]

    # 4. Stock management (PATCH /stock)
    # Transition to low stock (quantity = 3)
    res_stock_low = client.patch(
        f"/api/v1/products/{prod_id}/stock",
        json={"stock_quantity": 3},
        headers=ADMIN_HEADERS
    )
    assert res_stock_low.status_code == 200
    assert res_stock_low.json()["stock_quantity"] == 3
    assert res_stock_low.json()["stock_status"] == "low_stock"
    assert res_stock_low.json()["is_in_stock"] is True

    # Transition to out of stock (quantity = 0)
    res_stock_out = client.patch(
        f"/api/v1/products/{prod_id}/stock",
        json={"stock_quantity": 0},
        headers=ADMIN_HEADERS
    )
    assert res_stock_out.status_code == 200
    assert res_stock_out.json()["stock_quantity"] == 0
    assert res_stock_out.json()["stock_status"] == "out_of_stock"
    assert res_stock_out.json()["is_in_stock"] is False

    # Negative stock validation rejected
    res_neg_stock = client.patch(
        f"/api/v1/products/{prod_id}/stock",
        json={"stock_quantity": -5},
        headers=ADMIN_HEADERS
    )
    assert res_neg_stock.status_code == 422

    # 5. Archive product (DELETE)
    res_archive = client.delete(f"/api/v1/products/{prod_id}", headers=ADMIN_HEADERS)
    assert res_archive.status_code == 204

    # 6. Verify inactive product is hidden from shoppers
    # Should 404 on direct lookup
    res_public_get = client.get(f"/api/v1/products/{prod_id}")
    assert res_public_get.status_code == 404
    assert res_public_get.json()["error"]["code"] == "PRODUCT_NOT_FOUND"

    # Should not appear in general listing
    res_public_list = client.get(f"/api/v1/products?search={product_slug}")
    assert res_public_list.json()["total"] == 0

    # But viewable by admin with include_inactive=true
    res_admin_view = client.get(f"/api/v1/products/{prod_id}?include_inactive=true")
    assert res_admin_view.status_code == 200
    assert res_admin_view.json()["is_active"] is False
