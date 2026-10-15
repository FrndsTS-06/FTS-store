import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Boolean, DateTime, ForeignKey, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.models.enums import UserRole

def get_utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    role = Column(SQLEnum(UserRole, native_enum=False), default=UserRole.CUSTOMER, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=False)

    # Relationships
    addresses = relationship("Address", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="user")
    cart_items = relationship("CartItem", back_populates="user", cascade="all, delete-orphan")
    audit_events = relationship("AuditEvent", back_populates="actor")

    def __repr__(self):
        return f"<User {self.email} ({self.role})>"

class Address(Base):
    __tablename__ = "addresses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    full_name = Column(String(150), nullable=False)
    phone = Column(String(50), nullable=True)
    address_line1 = Column(String(255), nullable=False)
    address_line2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=True)
    postal_code = Column(String(30), nullable=False)
    country = Column(String(100), default="United States", nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=False)

    # Relationship
    user = relationship("User", back_populates="addresses")

    def __repr__(self):
        return f"<Address {self.city}, {self.postal_code}>"
