import uuid
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import (
    Column, String, Boolean, DateTime, Integer, Numeric,
    ForeignKey, CheckConstraint, JSON, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.models.enums import OrderStatus, PaymentStatus, PaymentMethod, DiscountType

def get_utc_now():
    return datetime.now(timezone.utc)

class Order(Base):
    __tablename__ = "orders"

    __table_args__ = (
        CheckConstraint("subtotal >= 0", name="chk_order_subtotal_non_negative"),
        CheckConstraint("discount_amount >= 0", name="chk_order_discount_non_negative"),
        CheckConstraint("tax_amount >= 0", name="chk_order_tax_non_negative"),
        CheckConstraint("shipping_fee >= 0", name="chk_order_shipping_non_negative"),
        CheckConstraint("total_amount >= 0", name="chk_order_total_non_negative"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_number = Column(String(40), unique=True, nullable=False, index=True)
    idempotency_key = Column(String(100), unique=True, nullable=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    guest_email = Column(String(255), nullable=True)
    status = Column(SQLEnum(OrderStatus, native_enum=False), default=OrderStatus.PENDING, nullable=False, index=True)
    subtotal = Column(Numeric(10, 2), nullable=False)
    discount_amount = Column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    coupon_code = Column(String(50), nullable=True)
    tax_rate = Column(Numeric(5, 4), default=Decimal("0.0800"), nullable=False)
    tax_amount = Column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    shipping_fee = Column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    payment_method = Column(SQLEnum(PaymentMethod, native_enum=False), nullable=False)
    payment_status = Column(SQLEnum(PaymentStatus, native_enum=False), default=PaymentStatus.PENDING, nullable=False)
    shipping_address = Column(JSON, nullable=False)
    tracking_number = Column(String(60), unique=True, nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=False)

    # Relationships
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="order", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Order {self.order_number} ({self.status}, Total=${self.total_amount})>"

class OrderItem(Base):
    __tablename__ = "order_items"

    __table_args__ = (
        CheckConstraint("unit_price >= 0", name="chk_order_item_unit_price_non_negative"),
        CheckConstraint("quantity > 0", name="chk_order_item_quantity_positive"),
        CheckConstraint("total_price >= 0", name="chk_order_item_total_price_non_negative"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="SET NULL"), nullable=True, index=True)
    product_name = Column(String(255), nullable=False)
    product_sku = Column(String(80), nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    quantity = Column(Integer, nullable=False)
    total_price = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")

    def __repr__(self):
        return f"<OrderItem {self.product_name} x{self.quantity} (${self.total_price})>"

class Coupon(Base):
    __tablename__ = "coupons"

    __table_args__ = (
        CheckConstraint("discount_value >= 0", name="chk_coupon_discount_value_non_negative"),
        CheckConstraint("min_order_amount >= 0", name="chk_coupon_min_order_non_negative"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String(50), unique=True, nullable=False, index=True)
    discount_type = Column(SQLEnum(DiscountType, native_enum=False), default=DiscountType.PERCENTAGE, nullable=False)
    discount_value = Column(Numeric(10, 2), nullable=False)
    min_order_amount = Column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    max_uses = Column(Integer, nullable=True)
    uses_count = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    valid_from = Column(DateTime(timezone=True), nullable=True)
    valid_until = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    def __repr__(self):
        return f"<Coupon {self.code} ({self.discount_type}: {self.discount_value})>"
