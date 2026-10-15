import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from app.db.base import Base

def get_utc_now():
    return datetime.now(timezone.utc)

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    actor_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(80), nullable=False, index=True)
    entity_name = Column(String(80), nullable=False)
    entity_id = Column(String(80), nullable=False, index=True)
    old_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False, index=True)

    # Relationship
    actor = relationship("User", back_populates="audit_events")

    def __repr__(self):
        return f"<AuditEvent {self.action} on {self.entity_name}:{self.entity_id} by {self.actor_id}>"
