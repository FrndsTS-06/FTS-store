import uuid
from decimal import Decimal
from fastapi.testclient import TestClient

def test_empty_cart_defaults(client: TestClient):
    """An empty cart must return zero financial totals and empty items array."""
    session_id = f"guest-{uuid.uuid4().hex}"
    response = client.get("/api/v1/cart", headers={"X-Session-ID": session_id})
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert float(data["subtotal"]) == 0.00
    assert float(data["shipping_fee"]) == 0.00
    assert data["is_free_shipping"] is False
    assert float(data["tax_amount"]) == 0.00
    assert float(data["total"]) == 0.00
    assert data["item_count"] == 0
    assert data["unique_item_count"] == 0

def test_add_item_to_cart_and_verify_calculations(client: TestClient):
    """Adding an item recalculates subtotal, shipping, tax (8%), and total accurately."""
    session_id = f"guest-{uuid.uuid4().hex}"

    # Fetch a live product
    prods_res = client.get("/api/v1/products?page_size=1")
    assert prods_res.status_code == 200
    prod = prods_res.json()["items"][0]
    prod_id = prod["id"]
    unit_price = Decimal(str(prod["price"]))

    # Add 2 units
    payload = {"product_id": prod_id, "quantity": 2}
    res = client.post("/api/v1/cart/items", json=payload, headers={"X-Session-ID": session_id})
    assert res.status_code == 200
    cart = res.json()

    assert cart["unique_item_count"] == 1
    assert cart["item_count"] == 2
    item = cart["items"][0]
    assert item["product_id"] == prod_id
    assert item["quantity"] == 2
    assert float(item["unit_price"]) == float(unit_price)

    expected_line_total = round(unit_price * Decimal("2"), 2)
    assert float(item["line_total"]) == float(expected_line_total)
    assert float(cart["subtotal"]) == float(expected_line_total)

    # Shipping rule: subtotal >= 100 free shipping, else 9.99
    expected_shipping = Decimal("0.00") if expected_line_total >= Decimal("100.00") else Decimal("9.99")
    assert float(cart["shipping_fee"]) == float(expected_shipping)

    # Tax rule: 8% of subtotal
    expected_tax = round(expected_line_total * Decimal("0.08"), 2)
    assert float(cart["tax_amount"]) == float(expected_tax)

    expected_total = expected_line_total + expected_tax + expected_shipping
    assert float(cart["total"]) == float(expected_total)

def test_duplicate_item_merges_quantities(client: TestClient):
    """Adding the same product again increments existing line item without creating duplicate rows."""
    session_id = f"guest-{uuid.uuid4().hex}"

    prods_res = client.get("/api/v1/products?page_size=20")
    prods = [p for p in prods_res.json()["items"] if p["stock_quantity"] >= 10]
    prod_id = prods[0]["id"]

    # First add: 1 unit
    client.post("/api/v1/cart/items", json={"product_id": prod_id, "quantity": 1}, headers={"X-Session-ID": session_id})
    # Second add: 2 units
    res2 = client.post("/api/v1/cart/items", json={"product_id": prod_id, "quantity": 2}, headers={"X-Session-ID": session_id})

    assert res2.status_code == 200
    cart = res2.json()
    assert cart["unique_item_count"] == 1
    assert cart["item_count"] == 3
    assert cart["items"][0]["quantity"] == 3

def test_update_item_quantity(client: TestClient):
    """Updating line item quantity modifies quantity and refreshes all totals."""
    session_id = f"guest-{uuid.uuid4().hex}"

    prods_res = client.get("/api/v1/products?page_size=20")
    prods = [p for p in prods_res.json()["items"] if p["stock_quantity"] >= 10]
    prod_id = prods[0]["id"]

    client.post("/api/v1/cart/items", json={"product_id": prod_id, "quantity": 1}, headers={"X-Session-ID": session_id})

    # Update to 3
    update_res = client.put(f"/api/v1/cart/items/{prod_id}", json={"quantity": 3}, headers={"X-Session-ID": session_id})
    assert update_res.status_code == 200
    cart = update_res.json()
    assert cart["items"][0]["quantity"] == 3
    assert cart["item_count"] == 3

def test_invalid_quantity_rejected(client: TestClient):
    """Zero, negative, or excessive quantities must be rejected."""
    session_id = f"guest-{uuid.uuid4().hex}"
    prods_res = client.get("/api/v1/products?page_size=1")
    prod_id = prods_res.json()["items"][0]["id"]

    # Zero quantity -> 422 or 400
    res_zero = client.post("/api/v1/cart/items", json={"product_id": prod_id, "quantity": 0}, headers={"X-Session-ID": session_id})
    assert res_zero.status_code in [400, 422]

    # Negative quantity -> 422 or 400
    res_neg = client.post("/api/v1/cart/items", json={"product_id": prod_id, "quantity": -3}, headers={"X-Session-ID": session_id})
    assert res_neg.status_code in [400, 422]

    # Excessive quantity (> 99)
    res_excess = client.post("/api/v1/cart/items", json={"product_id": prod_id, "quantity": 150}, headers={"X-Session-ID": session_id})
    assert res_excess.status_code in [400, 422]

def test_insufficient_stock_rejected(client: TestClient):
    """Requesting more units than in warehouse stock must fail with INSUFFICIENT_STOCK."""
    session_id = f"guest-{uuid.uuid4().hex}"

    # Create temporary low stock product via admin
    admin_headers = {"X-Admin-Key": "fts_admin_secret_key_2026"}
    cat_id = client.get("/api/v1/categories").json()[0]["id"]
    suffix = uuid.uuid4().hex[:6]
    new_prod_res = client.post("/api/v1/products", json={
        "name": f"Limited Stock Watch {suffix}",
        "slug": f"limited-watch-{suffix}",
        "sku": f"LW-{suffix.upper()}",
        "description": "Only 2 in stock",
        "price": 199.99,
        "stock_quantity": 2,
        "category_id": cat_id
    }, headers=admin_headers)
    assert new_prod_res.status_code == 201
    limited_prod_id = new_prod_res.json()["id"]

    # Attempt to add 5 units when only 2 are in stock
    res_fail = client.post("/api/v1/cart/items", json={"product_id": limited_prod_id, "quantity": 5}, headers={"X-Session-ID": session_id})
    assert res_fail.status_code == 400
    assert res_fail.json()["error"]["code"] == "INSUFFICIENT_STOCK"

def test_cart_session_persistence_and_isolation(client: TestClient):
    """Cart state persists across requests and isolates different guest sessions."""
    session_a = f"session-a-{uuid.uuid4().hex}"
    session_b = f"session-b-{uuid.uuid4().hex}"

    prod_id = client.get("/api/v1/products?page_size=1").json()["items"][0]["id"]

    # Session A adds product
    client.post("/api/v1/cart/items", json={"product_id": prod_id, "quantity": 2}, headers={"X-Session-ID": session_a})

    # Session B queries cart -> should be empty
    res_b = client.get("/api/v1/cart", headers={"X-Session-ID": session_b})
    assert res_b.json()["item_count"] == 0

    # Session A queries cart again -> should still have 2 items
    res_a = client.get("/api/v1/cart", headers={"X-Session-ID": session_a})
    assert res_a.json()["item_count"] == 2
    assert res_a.json()["items"][0]["product_id"] == prod_id

def test_coupon_application_and_removal(client: TestClient):
    """Applying a coupon calculates the discount and recalculates tax/total."""
    session_id = f"guest-{uuid.uuid4().hex}"
    prod_id = client.get("/api/v1/products?page_size=1").json()["items"][0]["id"]

    client.post("/api/v1/cart/items", json={"product_id": prod_id, "quantity": 1}, headers={"X-Session-ID": session_id})

    # Apply valid coupon
    coupon_res = client.post("/api/v1/cart/apply-coupon", json={"coupon_code": "WELCOME10"}, headers={"X-Session-ID": session_id})
    assert coupon_res.status_code == 200
    cart_with_coupon = coupon_res.json()
    assert cart_with_coupon["coupon_code"] == "WELCOME10"
    assert float(cart_with_coupon["discount_amount"]) > 0

    # Apply invalid coupon -> 400 INVALID_COUPON
    fake_res = client.post("/api/v1/cart/apply-coupon", json={"coupon_code": "UNKNOWN_DISCOUNT_99"}, headers={"X-Session-ID": session_id})
    assert fake_res.status_code == 400
    assert fake_res.json()["error"]["code"] == "INVALID_COUPON"

    # Remove coupon
    del_res = client.delete("/api/v1/cart/remove-coupon", headers={"X-Session-ID": session_id})
    assert del_res.status_code == 200
    assert del_res.json()["coupon_code"] is None
    assert float(del_res.json()["discount_amount"]) == 0.00

def test_remove_item_and_clear_cart(client: TestClient):
    """Removing an individual item and clearing the entire cart."""
    session_id = f"guest-{uuid.uuid4().hex}"
    prods = client.get("/api/v1/products?page_size=2").json()["items"]
    prod1_id = prods[0]["id"]
    prod2_id = prods[1]["id"]

    client.post("/api/v1/cart/items", json={"product_id": prod1_id, "quantity": 1}, headers={"X-Session-ID": session_id})
    client.post("/api/v1/cart/items", json={"product_id": prod2_id, "quantity": 2}, headers={"X-Session-ID": session_id})

    # Remove product 1
    rem_res = client.delete(f"/api/v1/cart/items/{prod1_id}", headers={"X-Session-ID": session_id})
    assert rem_res.status_code == 200
    assert rem_res.json()["unique_item_count"] == 1
    assert rem_res.json()["items"][0]["product_id"] == prod2_id

    # Clear entire cart
    clear_res = client.delete("/api/v1/cart", headers={"X-Session-ID": session_id})
    assert clear_res.status_code == 200
    assert clear_res.json()["unique_item_count"] == 0
    assert clear_res.json()["item_count"] == 0

def test_stateless_cart_calculate_endpoint(client: TestClient):
    """Stateless calculate endpoint validates an ad-hoc items list without modifying persistent cart."""
    prods = client.get("/api/v1/products?page_size=1").json()["items"]
    prod_id = prods[0]["id"]

    payload = {
        "items": [{"product_id": prod_id, "quantity": 2}],
        "coupon_code": "WELCOME10"
    }
    calc_res = client.post("/api/v1/cart/calculate", json=payload)
    assert calc_res.status_code == 200
    data = calc_res.json()
    assert data["item_count"] == 2
    assert float(data["subtotal"]) > 0
    assert float(data["discount_amount"]) > 0
