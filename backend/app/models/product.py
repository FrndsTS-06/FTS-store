import uuid
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import (
    Column, String, Boolean, DateTime, Text, Integer,
    Numeric, ForeignKey, CheckConstraint
)
from sqlalchemy.orm import relationship
from app.db.base import Base

def get_utc_now():
    return datetime.now(timezone.utc)

class Product(Base):
    __tablename__ = "products"

    __table_args__ = (
        CheckConstraint("price >= 0", name="chk_product_price_non_negative"),
        CheckConstraint("compare_at_price IS NULL OR compare_at_price >= 0", name="chk_compare_at_price_non_negative"),
        CheckConstraint("stock_quantity >= 0", name="chk_stock_quantity_non_negative"),
        CheckConstraint("rating >= 0 AND rating <= 5", name="chk_rating_range"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    category_id = Column(String(36), ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    slug = Column(String(280), unique=True, nullable=False, index=True)
    sku = Column(String(80), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    compare_at_price = Column(Numeric(10, 2), nullable=True)
    stock_quantity = Column(Integer, default=0, nullable=False)
    badge = Column(String(50), nullable=True)
    rating = Column(Numeric(3, 2), default=Decimal("5.00"), nullable=False)
    review_count = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=False)

    # Relationships
    category = relationship("Category", back_populates="products")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan", order_by="ProductImage.display_order")
    order_items = relationship("OrderItem", back_populates="product")
    cart_items = relationship("CartItem", back_populates="product", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Product {self.name} (${self.price}, SKU={self.sku})>"

class ProductImage(Base):
    __tablename__ = "product_images"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    url = Column(String(500), nullable=False)
    alt_text = Column(String(255), nullable=True)
    is_primary = Column(Boolean, default=False, nullable=False)
    display_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    # Relationship
    product = relationship("Product", back_populates="images")

    def __repr__(self):
        return f"<ProductImage {self.url} (Primary={self.is_primary})>"
