from fastapi import APIRouter, HTTPException
from app.database import db
from app.schemas import OrderCreateRequest, OrderResponse

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.post("", response_model=OrderResponse)
def create_order(payload: OrderCreateRequest):
    """
    Submit and process an order with customer billing/shipping details and cart items.
    """
    if not payload.items:
        raise HTTPException(status_code=400, detail="Cannot create an order with an empty cart.")
    
    order = db.create_order(payload)
    return order

@router.get("/{order_id}", response_model=OrderResponse)
def get_order_details(order_id: str):
    """
    Retrieve order details and status tracking by order ID.
    """
    order = db.get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail=f"Order '{order_id}' not found")
    return order
