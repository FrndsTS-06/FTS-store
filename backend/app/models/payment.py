import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, DateTime, Numeric, ForeignKey, CheckConstraint, JSON, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.models.enums import PaymentStatus, PaymentMethod

def get_utc_now():
    return datetime.now(timezone.utc)

class Payment(Base):
    __tablename__ = "payments"

    __table_args__ = (
        CheckConstraint("amount >= 0", name="chk_payment_amount_non_negative"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    payment_method = Column(SQLEnum(PaymentMethod, native_enum=False), nullable=False)
    status = Column(SQLEnum(PaymentStatus, native_enum=False), default=PaymentStatus.PENDING, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    transaction_reference = Column(String(100), unique=True, nullable=True, index=True)
    currency = Column(String(10), default="USD", nullable=False)
    # Strictly safe audit metadata — NEVER stores PAN, card numbers or CVV
    gateway_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=False)

    # Relationship
    order = relationship("Order", back_populates="payments")

    def __repr__(self):
        return f"<Payment Order={self.order_id} Amount=${self.amount} Status={self.status}>"
