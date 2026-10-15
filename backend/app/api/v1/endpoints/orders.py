import hmac
import hashlib
from typing import List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.models.enums import UserRole
from app.api.deps import get_current_user, get_cart_identity, CartIdentity
from app.schemas.order import (
    OrderCreatePayload,
    OrderResponse,
    OrderListResponse,
    SimulatePaymentPayload,
    SimulatePaymentResponse,
)
from app.services.order_service import (
    create_order,
    simulate_order_payment,
    cancel_order,
    get_customer_orders,
    get_order_by_number,
)

router = APIRouter(prefix="/orders", tags=["Orders"])

# Optional auth dependency that returns User or None
def get_optional_current_user(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not authorization:
        return None
    try:
        from app.core.security import decode_access_token
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            payload = decode_access_token(parts[1])
            sub = payload.get("sub")
            if sub:
                user = db.query(User).filter(User.id == sub, User.is_active == True).first()
                return user
    except Exception:
        pass
    return None

@router.post(
    "",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Order",
    description="Submits customer details and cart items to atomically create an order with immutable purchase price snapshots."
)
def checkout_order(
    payload: OrderCreatePayload,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    cart_ident: CartIdentity = Depends(get_cart_identity),
    user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    order = create_order(
        db=db,
        payload=payload,
        user=user,
        session_id=cart_ident.session_id,
        idempotency_key=idempotency_key
    )
    return order

@router.get(
    "",
    response_model=OrderListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Customer Orders",
    description="Retrieve historical orders placed by the currently authenticated customer."
)
@router.get(
    "/my-orders",
    response_model=OrderListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Customer Orders (alias)",
    description="Retrieve historical orders placed by the currently authenticated customer."
)
def list_my_orders(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    orders = get_customer_orders(db, user)
    return OrderListResponse(
        total=len(orders),
        items=[OrderResponse.model_validate(o) for o in orders]
    )

@router.get(
    "/{order_number}",
    response_model=OrderResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Order Details",
    description="Retrieve details and items for a specific order. Enforces customer ownership."
)
def get_order(
    order_number: str,
    user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    order = get_order_by_number(db, order_number, user)
    return order

@router.post(
    "/{order_number}/pay",
    response_model=SimulatePaymentResponse,
    status_code=status.HTTP_200_OK,
    summary="Simulate Order Payment",
    description="Clearly labeled demo payment simulation flow with no real money movement."
)
def pay_order_simulation(
    order_number: str,
    payload: SimulatePaymentPayload,
    user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    return simulate_order_payment(db, order_number, payload, user)

@router.post(
    "/{order_number}/cancel",
    response_model=OrderResponse,
    status_code=status.HTTP_200_OK,
    summary="Cancel Order",
    description="Cancels an order before shipping and restores reserved inventory stock."
)
def cancel_customer_order(
    order_number: str,
    user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    return cancel_order(db, order_number, user)

# Payment Webhook Router
payment_router = APIRouter(prefix="/payments", tags=["Payments"])

_PROCESSED_WEBHOOK_EVENTS = set()

@payment_router.post(
    "/webhook",
    status_code=status.HTTP_200_OK,
    summary="Payment Provider Webhook",
    description="Receives and validates server-to-server webhook notifications with signature verification."
)
async def payment_webhook(
    request: Request,
    signature: Optional[str] = Header(None, alias="X-Webhook-Signature"),
    db: Session = Depends(get_db)
):
    raw_body = await request.body()
    
    # 1. Verify HMAC Signature
    expected_secret = settings.SECRET_KEY.encode("utf-8")
    expected_signature = hmac.new(expected_secret, raw_body, hashlib.sha256).hexdigest()

    if not signature or not hmac.compare_digest(signature, expected_signature):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or missing webhook signature."
        )

    import json
    try:
        data = json.loads(raw_body.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload.")

    event_id = data.get("event_id")
    if not event_id:
        raise HTTPException(status_code=400, detail="Missing event_id in webhook.")

    # 2. Idempotency check on webhook event
    if event_id in _PROCESSED_WEBHOOK_EVENTS:
        return {"status": "ignored", "detail": "Duplicate event already processed."}

    _PROCESSED_WEBHOOK_EVENTS.add(event_id)

    order_number = data.get("order_number")
    event_type = data.get("event_type")

    if order_number and event_type == "payment.succeeded":
        from app.models.order import Order
        from app.models.enums import OrderStatus, PaymentStatus
        order = db.query(Order).filter(Order.order_number == order_number).first()
        if order and order.payment_status != PaymentStatus.COMPLETED:
            order.payment_status = PaymentStatus.COMPLETED
            order.status = OrderStatus.PROCESSING
            db.commit()

    return {"status": "success", "event_id": event_id}
