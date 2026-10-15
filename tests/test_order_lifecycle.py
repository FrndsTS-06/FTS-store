import hmac
import hashlib
import json
import uuid
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token
from app.models.enums import OrderStatus, PaymentStatus
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.user import User

@pytest.fixture
def test_db_session():
    from app.db.session import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_sample_customer(db: Session) -> Tuple[User, str]:
    email = f"cust_{uuid.uuid4().hex[:8]}@example.com"
    user = User(
        id=str(uuid.uuid4()),
        email=email,
        full_name="Test Customer",
        hashed_password="hashed_pw_dummy",
        role="customer",
        is_active=True
    )
    db.add(user)
    db.commit()
    token = create_access_token(subject=user.id, role="customer", email=email)
    return user, token

from typing import Tuple

def test_checkout_atomic_creation_and_stock_deduction(client: TestClient, test_db_session: Session):
    # Find product with stock
    prod = test_db_session.query(Product).filter(Product.stock_quantity >= 10, Product.is_active == True).first()
    assert prod is not None
    initial_stock = prod.stock_quantity

    user, token = create_sample_customer(test_db_session)

    payload = {
        "shipping_address": {
            "full_name": "Test Customer",
            "address_line1": "100 Innovation Way",
            "city": "Austin",
            "state": "TX",
            "postal_code": "78701",
            "country": "United States"
        },
        "payment_method": "card",
        "items": [
            {"product_id": prod.id, "quantity": 2}
        ]
    }

    res = client.post("/api/v1/orders", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 201
    order_data = res.json()

    assert "order_number" in order_data
    assert order_data["status"] == "pending"
    assert order_data["payment_status"] == "pending"
    assert len(order_data["items"]) == 1

    # Verify price snapshot
    item_res = order_data["items"][0]
    assert item_res["product_id"] == prod.id
    assert item_res["quantity"] == 2
    assert item_res["unit_price"] == float(prod.price)
    expected_line_total = float(prod.price) * 2
    assert abs(item_res["total_price"] - expected_line_total) < 0.01

    # Verify atomic stock decrement
    test_db_session.expire_all()
    updated_prod = test_db_session.query(Product).filter(Product.id == prod.id).one()
    assert updated_prod.stock_quantity == initial_stock - 2

def test_checkout_idempotency_prevents_duplicate_orders(client: TestClient, test_db_session: Session):
    prod = test_db_session.query(Product).filter(Product.stock_quantity >= 10, Product.is_active == True).first()
    user, token = create_sample_customer(test_db_session)

    idemp_key = f"key-{uuid.uuid4().hex}"
    payload = {
        "shipping_address": {
            "full_name": "Idemp Customer",
            "address_line1": "200 Repeat Blvd",
            "city": "New York",
            "postal_code": "10001",
            "country": "United States"
        },
        "payment_method": "card",
        "items": [
            {"product_id": prod.id, "quantity": 1}
        ],
        "idempotency_key": idemp_key
    }

    # 1. First submission
    res1 = client.post("/api/v1/orders", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert res1.status_code == 201
    order1 = res1.json()

    # 2. Duplicate retry with same idempotency key
    res2 = client.post("/api/v1/orders", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert res2.status_code == 201
    order2 = res2.json()

    assert order1["order_number"] == order2["order_number"]
    assert order1["id"] == order2["id"]

def test_checkout_rejects_insufficient_stock(client: TestClient, test_db_session: Session):
    prod = test_db_session.query(Product).filter(Product.stock_quantity > 0, Product.is_active == True).first()
    excessive_qty = prod.stock_quantity + 50

    payload = {
        "shipping_address": {
            "full_name": "Greedy Customer",
            "address_line1": "100 TooMuch Lane",
            "city": "Dallas",
            "postal_code": "75001"
        },
        "payment_method": "card",
        "items": [
            {"product_id": prod.id, "quantity": excessive_qty}
        ],
        "guest_email": "guest@example.com"
    }

    res = client.post("/api/v1/orders", json=payload)
    assert res.status_code == 400
    assert "insufficient stock" in res.json()["detail"].lower()

def test_simulate_payment_flow(client: TestClient, test_db_session: Session):
    prod = test_db_session.query(Product).filter(Product.stock_quantity >= 5, Product.is_active == True).first()
    user, token = create_sample_customer(test_db_session)

    # 1. Place order
    order_res = client.post("/api/v1/orders", json={
        "shipping_address": {
            "full_name": "Payer",
            "address_line1": "1 Payment Ave",
            "city": "Boston",
            "postal_code": "02101"
        },
        "payment_method": "card",
        "items": [{"product_id": prod.id, "quantity": 1}]
    }, headers={"Authorization": f"Bearer {token}"})
    assert order_res.status_code == 201
    order_num = order_res.json()["order_number"]

    # 2. Simulate failed payment
    fail_res = client.post(
        f"/api/v1/orders/{order_num}/pay",
        json={"outcome": "failure"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert fail_res.status_code == 200
    fail_data = fail_res.json()
    assert fail_data["success"] is False
    assert fail_data["payment_status"] == "failed"
    assert fail_data["is_simulation"] is True

    # 3. Simulate successful payment
    success_res = client.post(
        f"/api/v1/orders/{order_num}/pay",
        json={"outcome": "success", "card_last4": "4242", "card_brand": "Visa"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert success_res.status_code == 200
    succ_data = success_res.json()
    assert succ_data["success"] is True
    assert succ_data["payment_status"] == "completed"
    assert succ_data["order_status"] == "processing"

    # 4. Verify order reflects paid state
    get_res = client.get(f"/api/v1/orders/{order_num}", headers={"Authorization": f"Bearer {token}"})
    assert get_res.json()["payment_status"] == "completed"
    assert get_res.json()["status"] == "processing"
    assert len(get_res.json()["payments"]) >= 1
    assert get_res.json()["payments"][-1]["gateway_metadata"]["simulated"] is True

def test_order_cancellation_restores_inventory(client: TestClient, test_db_session: Session):
    prod = test_db_session.query(Product).filter(Product.stock_quantity >= 5, Product.is_active == True).first()
    stock_before = prod.stock_quantity
    user, token = create_sample_customer(test_db_session)

    # 1. Place order
    res = client.post("/api/v1/orders", json={
        "shipping_address": {
            "full_name": "Canceller",
            "address_line1": "99 Cancel St",
            "city": "Miami",
            "postal_code": "33101"
        },
        "payment_method": "card",
        "items": [{"product_id": prod.id, "quantity": 3}]
    }, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 201
    order_num = res.json()["order_number"]

    # Verify deducted stock
    test_db_session.expire_all()
    updated_prod = test_db_session.query(Product).filter(Product.id == prod.id).one()
    assert updated_prod.stock_quantity == stock_before - 3

    # 2. Cancel order
    cancel_res = client.post(f"/api/v1/orders/{order_num}/cancel", headers={"Authorization": f"Bearer {token}"})
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "cancelled"

    # Verify restored stock
    test_db_session.expire_all()
    restored_prod = test_db_session.query(Product).filter(Product.id == prod.id).one()
    assert restored_prod.stock_quantity == stock_before

def test_customer_can_only_view_own_orders(client: TestClient, test_db_session: Session):
    prod = test_db_session.query(Product).filter(Product.stock_quantity >= 5, Product.is_active == True).first()
    user_a, token_a = create_sample_customer(test_db_session)
    user_b, token_b = create_sample_customer(test_db_session)

    # User A places order
    order_res = client.post("/api/v1/orders", json={
        "shipping_address": {
            "full_name": "User A",
            "address_line1": "100 A Road",
            "city": "Denver",
            "postal_code": "80201"
        },
        "payment_method": "card",
        "items": [{"product_id": prod.id, "quantity": 1}]
    }, headers={"Authorization": f"Bearer {token_a}"})
    order_num = order_res.json()["order_number"]

    # User B tries to view User A's order -> 403 Forbidden
    b_res = client.get(f"/api/v1/orders/{order_num}", headers={"Authorization": f"Bearer {token_b}"})
    assert b_res.status_code == 403
    assert "permission" in b_res.json()["detail"].lower()

    # User A views own order -> 200 OK
    a_res = client.get(f"/api/v1/orders/{order_num}", headers={"Authorization": f"Bearer {token_a}"})
    assert a_res.status_code == 200
    assert a_res.json()["order_number"] == order_num

def test_webhook_signature_verification_and_idempotency(client: TestClient, test_db_session: Session):
    prod = test_db_session.query(Product).filter(Product.stock_quantity >= 5, Product.is_active == True).first()
    order = Order(
        id=str(uuid.uuid4()),
        order_number=f"FTS-WH-{uuid.uuid4().hex[:6].upper()}",
        user_id=None,
        guest_email="wh_buyer@example.com",
        status=OrderStatus.PENDING,
        subtotal=Decimal("100.00"),
        discount_amount=Decimal("0.00"),
        tax_rate=Decimal("0.0800"),
        tax_amount=Decimal("8.00"),
        shipping_fee=Decimal("0.00"),
        total_amount=Decimal("108.00"),
        payment_method="card",
        payment_status=PaymentStatus.PENDING,
        shipping_address={"full_name": "WH", "address_line1": "Street", "city": "City", "postal_code": "12345"},
        tracking_number=f"TRK-{uuid.uuid4().hex[:8].upper()}"
    )
    test_db_session.add(order)
    test_db_session.commit()

    webhook_payload = {
        "event_id": f"evt-{uuid.uuid4().hex}",
        "event_type": "payment.succeeded",
        "order_number": order.order_number,
        "amount": 108.00
    }
    raw_json = json.dumps(webhook_payload).encode("utf-8")

    # Compute valid signature
    secret = settings.SECRET_KEY.encode("utf-8")
    valid_sig = hmac.new(secret, raw_json, hashlib.sha256).hexdigest()

    # 1. Bad signature -> 400
    bad_res = client.post(
        "/api/v1/payments/webhook",
        content=raw_json,
        headers={"Content-Type": "application/json", "X-Webhook-Signature": "invalid_sig_abc"}
    )
    assert bad_res.status_code == 400

    # 2. Valid signature -> 200
    good_res = client.post(
        "/api/v1/payments/webhook",
        content=raw_json,
        headers={"Content-Type": "application/json", "X-Webhook-Signature": valid_sig}
    )
    assert good_res.status_code == 200
    assert good_res.json()["status"] == "success"

    # Verify order transitioned to COMPLETED
    test_db_session.expire_all()
    updated_order = test_db_session.query(Order).filter(Order.id == order.id).one()
    assert updated_order.payment_status == PaymentStatus.COMPLETED

    # 3. Duplicate webhook with same event_id -> 200 ignored
    dup_res = client.post(
        "/api/v1/payments/webhook",
        content=raw_json,
        headers={"Content-Type": "application/json", "X-Webhook-Signature": valid_sig}
    )
    assert dup_res.status_code == 200
    assert dup_res.json()["status"] == "ignored"
