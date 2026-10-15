from typing import Dict
from fastapi import APIRouter
from app.database import db
from app.schemas import (
    CartValidateRequest, CartCalculationResponse,
    CouponValidateRequest, CouponValidateResponse
)

router = APIRouter(prefix="/cart", tags=["Cart"])

@router.post("/calculate", response_model=CartCalculationResponse)
def calculate_cart_totals(payload: CartValidateRequest):
    """
    Validate items in cart and calculate subtotal, discounts, shipping, and taxes.
    """
    return db.calculate_cart(items=payload.items, coupon_code=payload.coupon_code)

@router.post("/coupon/validate", response_model=CouponValidateResponse)
def validate_coupon(payload: CouponValidateRequest):
    """
    Check if a coupon code is valid and return discount percentage.
    """
    is_valid, pct, msg = db.validate_coupon(payload.code)
    return CouponValidateResponse(
        valid=is_valid,
        code=payload.code.upper(),
        discount_pct=pct,
        message=msg
    )

@router.get("/coupons", response_model=Dict[str, int])
def list_available_coupons():
    """
    Retrieve active promo codes for customer testing.
    """
    return db._coupons
