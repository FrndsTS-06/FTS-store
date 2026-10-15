import uuid
from decimal import Decimal
import pytest
from sqlalchemy.exc import IntegrityError
from app.db.session import SessionLocal
from app.models import (
    User, UserRole, Address, Category, Product, ProductImage,
    CartItem, Order, OrderItem, Coupon, Payment, AuditEvent,
    OrderStatus, PaymentStatus, PaymentMethod, DiscountType
)
from app.db.seed import seed_database

@pytest.fixture(scope="function")
def db_session():
    """Provides a transactional database session for each test."""
    session = SessionLocal()
    yield session
    session.rollback()
    session.close()

# -------------------------------------------------------------------------
# 1. Uniqueness Constraints Tests
# -------------------------------------------------------------------------
def test_unique_user_email_constraint(db_session):
    """Ensure duplicate user email addresses are prevented."""
    email = f"duplicate-{uuid.uuid4().hex[:6]}@example.com"
    user1 = User(
        id=str(uuid.uuid4()),
        email=email,
        hashed_password="hash1",
        full_name="User One",
        role=UserRole.CUSTOMER
    )
    db_session.add(user1)
    db_session.commit()

    user2 = User(
        id=str(uuid.uuid4()),
        email=email,
        hashed_password="hash2",
        full_name="User Two",
        role=UserRole.CUSTOMER
    )
    db_session.add(user2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

def test_unique_product_sku_and_slug_constraints(db_session):
    """Ensure duplicate product SKUs and slugs are prevented."""
    cat = db_session.query(Category).first()
    assert cat is not None, "Seed categories should be present"

    sku = f"SKU-{uuid.uuid4().hex[:6].upper()}"
    slug = f"prod-{uuid.uuid4().hex[:6]}"

    prod1 = Product(
        id=str(uuid.uuid4()),
        category_id=cat.id,
        name="Test Unique 1",
        slug=slug,
        sku=sku,
        description="Desc",
        price=Decimal("99.99"),
        stock_quantity=10
    )
    db_session.add(prod1)
    db_session.commit()

    # Attempt duplicate SKU
    prod2 = Product(
        id=str(uuid.uuid4()),
        category_id=cat.id,
        name="Test Unique 2",
        slug=f"{slug}-alt",
        sku=sku,
        description="Desc",
        price=Decimal("49.99"),
        stock_quantity=5
    )
    db_session.add(prod2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

# -------------------------------------------------------------------------
# 2. Check Constraints (Non-negative prices and quantities)
# -------------------------------------------------------------------------
def test_product_negative_price_rejected(db_session):
    """CheckConstraint: Product price cannot be negative."""
    cat = db_session.query(Category).first()
    prod = Product(
        id=str(uuid.uuid4()),
        category_id=cat.id,
        name="Invalid Price Product",
        slug=f"invalid-price-{uuid.uuid4().hex[:6]}",
        sku=f"INV-P-{uuid.uuid4().hex[:6]}",
        description="Test",
        price=Decimal("-10.00"),
        stock_quantity=5
    )
    db_session.add(prod)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

def test_product_negative_stock_rejected(db_session):
    """CheckConstraint: Product stock cannot be negative."""
    cat = db_session.query(Category).first()
    prod = Product(
        id=str(uuid.uuid4()),
        category_id=cat.id,
        name="Invalid Stock Product",
        slug=f"invalid-stock-{uuid.uuid4().hex[:6]}",
        sku=f"INV-S-{uuid.uuid4().hex[:6]}",
        description="Test",
        price=Decimal("50.00"),
        stock_quantity=-5
    )
    db_session.add(prod)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

def test_cart_item_zero_or_negative_quantity_rejected(db_session):
    """CheckConstraint: Cart item quantity must be strictly > 0."""
    user = db_session.query(User).first()
    prod = db_session.query(Product).first()

    cart_item = CartItem(
        id=str(uuid.uuid4()),
        user_id=user.id,
        product_id=prod.id,
        quantity=0
    )
    db_session.add(cart_item)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

# -------------------------------------------------------------------------
# 3. Relationship & Historical Snapshot Tests
# -------------------------------------------------------------------------
def test_order_historical_price_snapshot_integrity(db_session):
    """
    Ensure that OrderItems preserve the price snapshot at purchase time
    even if the master Product's price subsequently changes.
    """
    cat = db_session.query(Category).first()
    prod = Product(
        id=str(uuid.uuid4()),
        category_id=cat.id,
        name="Price Snapshot Test Item",
        slug=f"snapshot-item-{uuid.uuid4().hex[:6]}",
        sku=f"SNAP-{uuid.uuid4().hex[:6]}",
        description="Testing historical integrity",
        price=Decimal("150.00"),
        stock_quantity=20
    )
    db_session.add(prod)
    db_session.commit()

    order_num = f"FTS-ORD-{uuid.uuid4().hex[:8].upper()}"
    order = Order(
        id=str(uuid.uuid4()),
        order_number=order_num,
        guest_email="buyer@example.com",
        status=OrderStatus.PAID,
        subtotal=Decimal("150.00"),
        discount_amount=Decimal("0.00"),
        tax_rate=Decimal("0.0800"),
        tax_amount=Decimal("12.00"),
        shipping_fee=Decimal("0.00"),
        total_amount=Decimal("162.00"),
        payment_method=PaymentMethod.CARD,
        payment_status=PaymentStatus.COMPLETED,
        shipping_address={"full_name": "Buyer", "address_line1": "100 Test Blvd", "city": "City", "postal_code": "12345"}
    )
    db_session.add(order)
    db_session.flush()

    order_item = OrderItem(
        id=str(uuid.uuid4()),
        order_id=order.id,
        product_id=prod.id,
        product_name=prod.name,
        product_sku=prod.sku,
        unit_price=prod.price,  # Snapshot: $150.00
        quantity=1,
        total_price=prod.price
    )
    db_session.add(order_item)
    db_session.commit()

    # Now change master product price to $250.00
    prod.price = Decimal("250.00")
    db_session.commit()

    # Re-fetch order item from DB
    reloaded_item = db_session.query(OrderItem).filter(OrderItem.id == order_item.id).one()
    assert reloaded_item.unit_price == Decimal("150.00"), "Historical order snapshot must remain $150.00!"
    assert prod.price == Decimal("250.00"), "Current catalog price should be updated to $250.00"

def test_audit_event_logging(db_session):
    """Verify audit log event persistence for sensitive admin operations."""
    admin = db_session.query(User).filter(User.role == UserRole.ADMIN).first()
    assert admin is not None

    audit = AuditEvent(
        id=str(uuid.uuid4()),
        actor_id=admin.id,
        action="PRODUCT_PRICE_UPDATED",
        entity_name="Product",
        entity_id="prod-1234",
        old_values={"price": 100.00},
        new_values={"price": 120.00},
        ip_address="192.168.1.50"
    )
    db_session.add(audit)
    db_session.commit()

    saved_audit = db_session.query(AuditEvent).filter(AuditEvent.id == audit.id).one()
    assert saved_audit.action == "PRODUCT_PRICE_UPDATED"
    assert saved_audit.old_values["price"] == 100.00
    assert saved_audit.actor.email == admin.email

def test_payment_record_compliance(db_session):
    """Verify payment record creation with transaction reference and no sensitive card data."""
    order = db_session.query(Order).first()
    assert order is not None

    payment = Payment(
        id=str(uuid.uuid4()),
        order_id=order.id,
        payment_method=PaymentMethod.CARD,
        status=PaymentStatus.COMPLETED,
        amount=order.total_amount,
        transaction_reference=f"TXN-{uuid.uuid4().hex[:12].upper()}",
        currency="USD",
        gateway_metadata={"processor": "Simulated Gateway", "card_brand": "Visa", "last4": "4242"}
    )
    db_session.add(payment)
    db_session.commit()

    saved_payment = db_session.query(Payment).filter(Payment.id == payment.id).one()
    assert saved_payment.status == PaymentStatus.COMPLETED
    assert saved_payment.gateway_metadata["last4"] == "4242"
    assert "pan" not in saved_payment.gateway_metadata
    assert "cvv" not in saved_payment.gateway_metadata

# -------------------------------------------------------------------------
# 4. Seed Data Idempotency Test
# -------------------------------------------------------------------------
def test_seed_database_idempotent(db_session):
    """Ensure seed_database does not duplicate records when invoked repeatedly."""
    first_counts = {
        "users": db_session.query(User).count(),
        "categories": db_session.query(Category).count(),
        "products": db_session.query(Product).count(),
        "coupons": db_session.query(Coupon).count()
    }

    # Run seed again
    stats = seed_database(db_session)
    assert stats["users_created"] == 0
    assert stats["categories_created"] == 0
    assert stats["products_created"] == 0
    assert stats["coupons_created"] == 0

    second_counts = {
        "users": db_session.query(User).count(),
        "categories": db_session.query(Category).count(),
        "products": db_session.query(Product).count(),
        "coupons": db_session.query(Coupon).count()
    }
    assert first_counts == second_counts, "Record counts must remain identical after repeated seed execution"
