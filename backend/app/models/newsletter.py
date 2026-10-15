import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime
from app.db.base import Base

def get_utc_now():
    return datetime.now(timezone.utc)

class NewsletterSubscription(Base):
    __tablename__ = "newsletter_subscriptions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    source = Column(String(50), default="homepage_strip", nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    def __repr__(self):
        return f"<NewsletterSubscription {self.email} (active={self.is_active})>"
