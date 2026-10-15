def test_create_order_success(client):
    order_payload = {
        "customer": {
            "full_name": "Alex Mercer",
            "email": "alex.mercer@example.com",
            "phone": "+1-555-0192",
            "address": "742 Evergreen Terrace",
            "city": "Springfield",
            "postal_code": "97477",
            "country": "United States"
        },
        "items": [
            {"product_id": "prod-elec-03", "quantity": 1},
            {"product_id": "prod-home-02", "quantity": 2}
        ],
        "coupon_code": "WELCOME10",
        "payment_method": "card"
    }
    response = client.post("/api/orders", json=order_payload)
    assert response.status_code == 200
    data = response.json()
    assert "order_id" in data
    assert data["order_id"].startswith("ORD-")
    assert "tracking_number" in data
    assert data["status"] == "confirmed"
    assert data["customer"]["full_name"] == "Alex Mercer"
    assert len(data["summary"]["items"]) == 2
    assert data["summary"]["discount_amount"] > 0

    # Retrieve order
    order_id = data["order_id"]
    get_res = client.get(f"/api/orders/{order_id}")
    assert get_res.status_code == 200
    assert get_res.json()["order_id"] == order_id

def test_create_order_empty_cart_fails(client):
    order_payload = {
        "customer": {
            "full_name": "Jane Doe",
            "email": "jane@example.com",
            "address": "123 Main St",
            "city": "Seattle",
            "postal_code": "98101",
            "country": "United States"
        },
        "items": [],
        "payment_method": "card"
    }
    response = client.post("/api/orders", json=order_payload)
    assert response.status_code == 400

def test_get_nonexistent_order_404(client):
    response = client.get("/api/orders/ORD-NONEXISTENT")
    assert response.status_code == 404
