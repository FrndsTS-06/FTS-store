import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, DateTime, Integer, ForeignKey, CheckConstraint
)
from sqlalchemy.orm import relationship
from app.db.base import Base

def get_utc_now():
    return datetime.now(timezone.utc)

class CartItem(Base):
    __tablename__ = "cart_items"

    __table_args__ = (
        CheckConstraint("quantity > 0", name="chk_cart_item_quantity_positive"),
        CheckConstraint("user_id IS NOT NULL OR session_id IS NOT NULL", name="chk_cart_item_owner_present"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    session_id = Column(String(100), nullable=True, index=True)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=False)

    # Relationships
    user = relationship("User", back_populates="cart_items")
    product = relationship("Product", back_populates="cart_items")

    def __repr__(self):
        return f"<CartItem Product={self.product_id} Qty={self.quantity}>"
