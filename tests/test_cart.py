def test_calculate_cart_without_coupon(client):
    payload = {
        "items": [
            {"product_id": "prod-home-03", "quantity": 1}  # $54.00
        ]
    }
    response = client.post("/api/cart/calculate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["subtotal"] == 54.00
    assert data["item_count"] == 1
    assert data["is_free_shipping"] is False
    assert data["shipping_fee"] == 9.99
    # Tax: 54 * 0.08 = 4.32
    assert data["tax_amount"] == 4.32
    assert data["total"] == round(54.00 + 4.32 + 9.99, 2)

def test_calculate_cart_free_shipping_threshold(client):
    payload = {
        "items": [
            {"product_id": "prod-elec-01", "quantity": 1}  # $249.99 (> $100)
        ]
    }
    response = client.post("/api/cart/calculate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_free_shipping"] is True
    assert data["shipping_fee"] == 0.0

def test_calculate_cart_with_valid_coupon(client):
    payload = {
        "items": [
            {"product_id": "prod-fash-01", "quantity": 1}  # $285.00
        ],
        "coupon_code": "SUPER20"  # 20% off
    }
    response = client.post("/api/cart/calculate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["subtotal"] == 285.00
    assert data["discount_amount"] == round(285.00 * 0.20, 2)  # 57.00
    assert "SUPER20" in data["discount_applied"]

def test_validate_coupon_endpoint(client):
    # Valid coupon
    res1 = client.post("/api/cart/coupon/validate", json={"code": "WELCOME10", "subtotal": 100})
    assert res1.status_code == 200
    assert res1.json()["valid"] is True
    assert res1.json()["discount_pct"] == 10

    # Invalid coupon
    res2 = client.post("/api/cart/coupon/validate", json={"code": "FAKEDISCOUNT99", "subtotal": 100})
    assert res2.status_code == 200
    assert res2.json()["valid"] is False
