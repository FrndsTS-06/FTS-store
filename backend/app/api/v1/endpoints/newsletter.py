import re
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, EmailStr
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.newsletter import NewsletterSubscription

router = APIRouter(prefix="/newsletter", tags=["Newsletter"])

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

class NewsletterSubscribeRequest(BaseModel):
    email: str = Field(..., description="Customer email address to subscribe")
    source: str = Field(default="homepage_strip", description="Subscription entry point")

class NewsletterSubscribeResponse(BaseModel):
    success: bool
    message: str
    discount_code: str
    already_subscribed: bool

@router.post(
    "/subscribe",
    response_model=NewsletterSubscribeResponse,
    status_code=status.HTTP_200_OK,
    summary="Subscribe to the FTS Store tech newsletter"
)
def subscribe_newsletter(
    payload: NewsletterSubscribeRequest,
    db: Session = Depends(get_db)
):
    clean_email = payload.email.strip().lower()

    if not clean_email or not EMAIL_REGEX.match(clean_email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address (e.g. name@example.com)."
        )

    # Check for existing subscription
    existing = db.query(NewsletterSubscription).filter(NewsletterSubscription.email == clean_email).first()
    if existing:
        if not existing.is_active:
            existing.is_active = True
            db.commit()
            return NewsletterSubscribeResponse(
                success=True,
                message="Welcome back! Your subscription to FTS Store insider alerts has been reactivated.",
                discount_code="INSIDER15",
                already_subscribed=False
            )
        return NewsletterSubscribeResponse(
            success=True,
            message="You are already subscribed to FTS Store updates. Use code INSIDER15 at checkout!",
            discount_code="INSIDER15",
            already_subscribed=True
        )

    # Create new subscription
    new_sub = NewsletterSubscription(
        email=clean_email,
        source=payload.source or "homepage_strip",
        is_active=True
    )
    db.add(new_sub)
    db.commit()

    return NewsletterSubscribeResponse(
        success=True,
        message="🎉 Thank you for subscribing! Use promo code INSIDER15 for 15% off your next order.",
        discount_code="INSIDER15",
        already_subscribed=False
    )
