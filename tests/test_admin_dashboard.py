import uuid
import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import User, Product, Category, Order, OrderItem, AuditEvent
from app.models.enums import UserRole, OrderStatus, PaymentStatus, PaymentMethod

@pytest.fixture
def admin_user(db: Session) -> User:
    email = f"admin_{uuid.uuid4().hex[:8]}@frndstech.com"
    user = User(
        id=str(uuid.uuid4()),
        email=email,
        hashed_password="$2b$12$e6mZ7dD9Z9q2xN8tCjM7g.oUu6CkW7yD0f6j9Gf4qZ0jYfXQy0p4G",
        full_name="Platform Administrator",
        role=UserRole.ADMIN,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture
def admin_headers(admin_user: User) -> dict:
    from app.core.security import create_access_token
    token = create_access_token(
        subject=admin_user.id,
        role=admin_user.role.value,
        email=admin_user.email
    )
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def customer_user(db: Session) -> User:
    email = f"cust_{uuid.uuid4().hex[:8]}@example.com"
    user = User(
        id=str(uuid.uuid4()),
        email=email,
        hashed_password="$2b$12$e6mZ7dD9Z9q2xN8tCjM7g.oUu6CkW7yD0f6j9Gf4qZ0jYfXQy0p4G",
        full_name="Regular Customer",
        role=UserRole.CUSTOMER,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture
def customer_headers(customer_user: User) -> dict:
    from app.core.security import create_access_token
    token = create_access_token(
        subject=customer_user.id,
        role=customer_user.role.value,
        email=customer_user.email
    )
    return {"Authorization": f"Bearer {token}"}

def test_admin_metrics_access_control(
    client: TestClient,
    admin_headers: dict,
    customer_headers: dict
):
    """Verify strictly enforced role-based authorization on metrics endpoint."""
    # 1. Unauthenticated request rejected
    res_unauth = client.get("/api/v1/admin/metrics")
    assert res_unauth.status_code == 401

    # 2. Customer request rejected with 403 Forbidden
    res_cust = client.get("/api/v1/admin/metrics", headers=customer_headers)
    assert res_cust.status_code == 403

    # 3. Administrator request accepted
    res_admin = client.get("/api/v1/admin/metrics", headers=admin_headers)
    assert res_admin.status_code == 200
    data = res_admin.json()
    assert "total_orders" in data
    assert "total_revenue" in data
    assert "total_products" in data
    assert "active_products" in data
    assert "low_stock_products" in data
    assert "recent_orders" in data

def test_admin_orders_filtering_and_pagination(
    client: TestClient,
    admin_headers: dict,
    customer_headers: dict
):
    """Verify order querying, searching, and access control."""
    # Customer rejected
    res_cust = client.get("/api/v1/admin/orders", headers=customer_headers)
    assert res_cust.status_code == 403

    # Admin accepted with query parameters
    res_admin = client.get(
        "/api/v1/admin/orders?page=1&page_size=10&sort_by=newest",
        headers=admin_headers
    )
    assert res_admin.status_code == 200
    data = res_admin.json()
    assert "total" in data
    assert "page" in data
    assert "items" in data
    assert data["page"] == 1
    assert data["page_size"] == 10

def test_admin_order_status_valid_lifecycle_transitions(
    client: TestClient,
    admin_headers: dict,
    customer_headers: dict,
    db: Session
):
    """Test full allowed order lifecycle transitions and audit event generation."""
    # 1. Create a test product and order
    cat = Category(
        id=str(uuid.uuid4()),
        name=f"Cat {uuid.uuid4().hex[:6]}",
        slug=f"cat-{uuid.uuid4().hex[:6]}",
        is_active=True
    )
    prod = Product(
        id=str(uuid.uuid4()),
        category_id=cat.id,
        name="Lifecycle Product",
        slug=f"lifecycle-prod-{uuid.uuid4().hex[:6]}",
        sku=f"SKU-{uuid.uuid4().hex[:6].upper()}",
        description="A lifecycle test product description",
        price=Decimal("150.00"),
        stock_quantity=20,
        is_active=True
    )
    order_num = f"FTS-TRANS-{uuid.uuid4().hex[:6].upper()}"
    order = Order(
        id=str(uuid.uuid4()),
        order_number=order_num,
        status=OrderStatus.PENDING,
        subtotal=Decimal("150.00"),
        discount_amount=Decimal("0.00"),
        tax_rate=Decimal("0.08"),
        tax_amount=Decimal("12.00"),
        shipping_fee=Decimal("0.00"),
        total_amount=Decimal("162.00"),
        payment_method=PaymentMethod.CARD,
        payment_status=PaymentStatus.PENDING,
        shipping_address={"full_name": "Lifecycle Buyer", "city": "Austin", "country": "US"}
    )
    db.add_all([cat, prod, order])
    db.commit()

    # Customer cannot update order status
    res_cust = client.patch(
        f"/api/v1/admin/orders/{order_num}/status",
        json={"status": "processing"},
        headers=customer_headers
    )
    assert res_cust.status_code == 403

    # Transition 1: pending -> processing
    res_proc = client.patch(
        f"/api/v1/admin/orders/{order_num}/status",
        json={"status": "processing", "notes": "Approved for warehouse packing"},
        headers=admin_headers
    )
    assert res_proc.status_code == 200
    assert res_proc.json()["status"] == "processing"

    # Transition 2: processing -> shipped
    res_ship = client.patch(
        f"/api/v1/admin/orders/{order_num}/status",
        json={"status": "shipped", "notes": "Carrier pickup completed"},
        headers=admin_headers
    )
    assert res_ship.status_code == 200
    assert res_ship.json()["status"] == "shipped"

    # Transition 3: shipped -> delivered
    res_deliv = client.patch(
        f"/api/v1/admin/orders/{order_num}/status",
        json={"status": "delivered", "notes": "Customer signature received"},
        headers=admin_headers
    )
    assert res_deliv.status_code == 200
    assert res_deliv.json()["status"] == "delivered"

    # Verify AuditEvents were recorded
    events = db.query(AuditEvent).filter(
        AuditEvent.entity_name == "Order",
        AuditEvent.entity_id == order.id
    ).all()
    assert len(events) >= 3

def test_admin_order_status_invalid_transitions_rejected(
    client: TestClient,
    admin_headers: dict,
    db: Session
):
    """Verify that disallowed state machine transitions are rejected with 400 Bad Request."""
    order_num = f"FTS-TERM-{uuid.uuid4().hex[:6].upper()}"
    order = Order(
        id=str(uuid.uuid4()),
        order_number=order_num,
        status=OrderStatus.DELIVERED,
        subtotal=Decimal("100.00"),
        total_amount=Decimal("108.00"),
        payment_method=PaymentMethod.CARD,
        payment_status=PaymentStatus.COMPLETED,
        shipping_address={"full_name": "Terminal Buyer"}
    )
    db.add(order)
    db.commit()

    # Attempt invalid transition from delivered to pending
    res_invalid = client.patch(
        f"/api/v1/admin/orders/{order_num}/status",
        json={"status": "pending"},
        headers=admin_headers
    )
    assert res_invalid.status_code == 400
    assert "invalid order status transition" in res_invalid.json()["detail"].lower()

def test_admin_cancellation_restores_inventory(
    client: TestClient,
    admin_headers: dict,
    db: Session
):
    """Verify that admin order cancellation atomically restores inventory."""
    cat = Category(
        id=str(uuid.uuid4()),
        name=f"Stock Cat {uuid.uuid4().hex[:6]}",
        slug=f"stock-cat-{uuid.uuid4().hex[:6]}",
        is_active=True
    )
    prod = Product(
        id=str(uuid.uuid4()),
        category_id=cat.id,
        name="Restorable Product",
        slug=f"restorable-{uuid.uuid4().hex[:6]}",
        sku=f"RESTORE-{uuid.uuid4().hex[:6].upper()}",
        description="A restorable test product description",
        price=Decimal("100.00"),
        stock_quantity=10,  # Starts at 10
        is_active=True
    )
    order_num = f"FTS-CANC-{uuid.uuid4().hex[:6].upper()}"
    order = Order(
        id=str(uuid.uuid4()),
        order_number=order_num,
        status=OrderStatus.PENDING,
        subtotal=Decimal("200.00"),
        total_amount=Decimal("216.00"),
        payment_method=PaymentMethod.CARD,
        payment_status=PaymentStatus.COMPLETED,
        shipping_address={"full_name": "Cancel Buyer"}
    )
    item = OrderItem(
        id=str(uuid.uuid4()),
        order_id=order.id,
        product_id=prod.id,
        product_name=prod.name,
        product_sku=prod.sku,
        unit_price=Decimal("100.00"),
        quantity=3,
        total_price=Decimal("300.00")
    )
    db.add_all([cat, prod, order, item])
    db.commit()

    # Cancel order as administrator
    res = client.patch(
        f"/api/v1/admin/orders/{order_num}/status",
        json={"status": "cancelled", "notes": "Customer requested full refund"},
        headers=admin_headers
    )
    assert res.status_code == 200
    assert res.json()["status"] == "cancelled"
    assert res.json()["payment_status"] == "refunded"

    # Verify inventory was restored from 10 to 13
    db.refresh(prod)
    assert prod.stock_quantity == 13

def test_admin_product_crud_and_audit_logging(
    client: TestClient,
    admin_headers: dict,
    customer_headers: dict,
    db: Session
):
    """Test product creation, updating, stock adjustment, archiving, and audit logging."""
    cat = Category(
        id=str(uuid.uuid4()),
        name=f"Hardware {uuid.uuid4().hex[:6]}",
        slug=f"hardware-{uuid.uuid4().hex[:6]}",
        is_active=True
    )
    db.add(cat)
    db.commit()

    # 1. Create product
    prod_payload = {
        "name": "Audit Test Device",
        "slug": f"audit-device-{uuid.uuid4().hex[:6]}",
        "sku": f"DEV-{uuid.uuid4().hex[:6].upper()}",
        "category_id": cat.id,
        "price": 89.99,
        "stock_quantity": 25,
        "description": "Enterprise grade audit test device"
    }

    # Customer cannot create product
    assert client.post("/api/v1/products", json=prod_payload, headers=customer_headers).status_code == 403

    # Admin creates product
    res_create = client.post("/api/v1/products", json=prod_payload, headers=admin_headers)
    assert res_create.status_code == 201
    prod_id = res_create.json()["id"]

    # Verify AuditEvent
    create_evt = db.query(AuditEvent).filter(
        AuditEvent.action == "PRODUCT_CREATE",
        AuditEvent.entity_id == prod_id
    ).first()
    assert create_evt is not None

    # 2. Update stock
    res_stock = client.patch(
        f"/api/v1/products/{prod_id}/stock",
        json={"stock_quantity": 40},
        headers=admin_headers
    )
    assert res_stock.status_code == 200
    assert res_stock.json()["stock_quantity"] == 40

    stock_evt = db.query(AuditEvent).filter(
        AuditEvent.action == "PRODUCT_STOCK_ADJUST",
        AuditEvent.entity_id == prod_id
    ).first()
    assert stock_evt is not None
    assert stock_evt.new_values["stock_quantity"] == 40

    # 3. Archive product
    res_del = client.delete(f"/api/v1/products/{prod_id}", headers=admin_headers)
    assert res_del.status_code == 204

    archive_evt = db.query(AuditEvent).filter(
        AuditEvent.action == "PRODUCT_ARCHIVE",
        AuditEvent.entity_id == prod_id
    ).first()
    assert archive_evt is not None

def test_admin_audit_logs_endpoint(
    client: TestClient,
    admin_headers: dict,
    customer_headers: dict
):
    """Verify that only administrators can inspect audit logs."""
    res_cust = client.get("/api/v1/admin/audit-logs", headers=customer_headers)
    assert res_cust.status_code == 403

    res_admin = client.get("/api/v1/admin/audit-logs?limit=10", headers=admin_headers)
    assert res_admin.status_code == 200
    logs = res_admin.json()
    assert isinstance(logs, list)
    if len(logs) > 0:
        assert "action" in logs[0]
        assert "entity_name" in logs[0]
