from typing import Optional, List
from decimal import Decimal
from fastapi import APIRouter, Depends, Header, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.api.deps import get_db, get_cart_identity, CartIdentity
from app.models import Product, ProductImage
from app.models.order import Coupon
from app.schemas.cart import (
    CartItemAdd,
    CartItemUpdate,
    CartCouponApply,
    CartItemResponse,
    CartResponse,
)
from app.services.cart_service import CartService
from app.core.pricing import (
    calculate_shipping,
    calculate_tax,
    calculate_coupon_discount,
    round_currency,
    FREE_SHIPPING_THRESHOLD,
    DEFAULT_TAX_RATE,
    MAX_QUANTITY_PER_ITEM,
    MIN_QUANTITY_PER_ITEM,
)
from app.core.errors import AppException

router = APIRouter(prefix="/cart", tags=["Cart"])

@router.get("", response_model=CartResponse, summary="Retrieve active shopping cart")
def get_cart(
    cart_id: CartIdentity = Depends(get_cart_identity),
    db: Session = Depends(get_db)
):
    """
    Retrieve the current customer or guest cart with revalidated prices,
    inventory availability, discounts, sales tax, and shipping calculations.
    """
    return CartService.get_or_calculate_cart(
        db=db,
        user_id=cart_id.user_id,
        session_id=cart_id.session_id
    )

@router.post("/items", response_model=CartResponse, status_code=status.HTTP_200_OK, summary="Add item to shopping cart")
def add_cart_item(
    payload: CartItemAdd,
    cart_id: CartIdentity = Depends(get_cart_identity),
    db: Session = Depends(get_db)
):
    """
    Add a product to the cart or increment quantity if already present.
    Enforces product availability, positive stock, and non-duplicate line entries.
    """
    return CartService.add_item_to_cart(
        db=db,
        product_id_or_slug=payload.product_id,
        quantity=payload.quantity,
        user_id=cart_id.user_id,
        session_id=cart_id.session_id
    )

@router.put("/items/{item_id_or_product_id}", response_model=CartResponse, summary="Update cart item quantity")
@router.patch("/items/{item_id_or_product_id}", response_model=CartResponse, summary="Update cart item quantity (PATCH alias)")
def update_cart_item_quantity(
    item_id_or_product_id: str,
    payload: CartItemUpdate,
    cart_id: CartIdentity = Depends(get_cart_identity),
    db: Session = Depends(get_db)
):
    """
    Update quantity for an existing cart line item.
    Enforces quantity boundaries and warehouse stock availability.
    """
    return CartService.update_item_quantity(
        db=db,
        item_id_or_product_id=item_id_or_product_id,
        quantity=payload.quantity,
        user_id=cart_id.user_id,
        session_id=cart_id.session_id
    )

@router.delete("/items/{item_id_or_product_id}", response_model=CartResponse, summary="Remove item from cart")
def remove_cart_item(
    item_id_or_product_id: str,
    cart_id: CartIdentity = Depends(get_cart_identity),
    db: Session = Depends(get_db)
):
    """
    Remove a single product line item from the shopping cart.
    """
    return CartService.remove_item(
        db=db,
        item_id_or_product_id=item_id_or_product_id,
        user_id=cart_id.user_id,
        session_id=cart_id.session_id
    )

@router.delete("", response_model=CartResponse, summary="Empty shopping cart")
def clear_cart(
    cart_id: CartIdentity = Depends(get_cart_identity),
    db: Session = Depends(get_db)
):
    """
    Remove all items from the current shopping cart.
    """
    return CartService.clear_cart(
        db=db,
        user_id=cart_id.user_id,
        session_id=cart_id.session_id
    )

@router.post("/apply-coupon", response_model=CartResponse, summary="Apply promotional discount code")
@router.post("/coupon", response_model=CartResponse, summary="Apply promotional discount code (alias)")
def apply_cart_coupon(
    payload: CartCouponApply,
    cart_id: CartIdentity = Depends(get_cart_identity),
    db: Session = Depends(get_db)
):
    """
    Validate and apply a promotional discount coupon.
    Recalculates net subtotal, tax amount, and shipping fee.
    """
    code = payload.get_effective_code()
    return CartService.apply_coupon(
        db=db,
        code=code,
        user_id=cart_id.user_id,
        session_id=cart_id.session_id
    )

@router.delete("/remove-coupon", response_model=CartResponse, summary="Remove active coupon code")
def remove_cart_coupon(
    cart_id: CartIdentity = Depends(get_cart_identity),
    db: Session = Depends(get_db)
):
    """
    Remove active promotional coupon and restore standard pricing.
    """
    return CartService.remove_coupon(
        db=db,
        user_id=cart_id.user_id,
        session_id=cart_id.session_id
    )

# =============================================================================
# Stateless Calculation Endpoint
# =============================================================================
from pydantic import BaseModel, Field

class CalculateCartRequest(BaseModel):
    items: List[CartItemAdd] = Field(default_factory=list)
    coupon_code: Optional[str] = None

@router.post("/calculate", response_model=CartResponse, summary="Stateless cart calculation & revalidation")
def calculate_cart_preview(
    payload: CalculateCartRequest,
    db: Session = Depends(get_db)
):
    """
    Calculate totals for an ad-hoc selection of items without persistent state.
    Used for instant revalidation before checkout or order placement.
    """
    item_responses: List[CartItemResponse] = []
    subtotal = Decimal("0.00")
    total_qty = 0

    for input_item in payload.items:
        if input_item.quantity < MIN_QUANTITY_PER_ITEM:
            raise AppException(
                code="INVALID_QUANTITY",
                message=f"Quantity must be at least {MIN_QUANTITY_PER_ITEM}",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        if input_item.quantity > MAX_QUANTITY_PER_ITEM:
            raise AppException(
                code="EXCESSIVE_QUANTITY",
                message=f"Quantity cannot exceed {MAX_QUANTITY_PER_ITEM}",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        product = db.query(Product).filter(
            or_(Product.id == input_item.product_id, Product.slug == input_item.product_id)
        ).first()

        if not product:
            raise AppException(
                code="PRODUCT_NOT_FOUND",
                message=f"Product '{input_item.product_id}' not found",
                status_code=status.HTTP_404_NOT_FOUND
            )

        unit_price = Decimal(str(product.price))
        line_total = round_currency(unit_price * Decimal(input_item.quantity))
        subtotal += line_total
        total_qty += input_item.quantity

        is_available = bool(product.is_active)
        is_in_stock = product.stock_quantity >= input_item.quantity and is_available
        warning = None

        if not is_available:
            warning = "This product has been archived or is no longer available."
        elif product.stock_quantity < input_item.quantity:
            warning = f"Only {product.stock_quantity} units available in stock."

        image_url = None
        if product.images:
            primary_imgs = [img for img in product.images if img.is_primary]
            image_url = primary_imgs[0].url if primary_imgs else product.images[0].url

        item_responses.append(
            CartItemResponse(
                id=f"preview-{product.id}",
                product_id=product.id,
                name=product.name,
                slug=product.slug,
                sku=product.sku,
                image_url=image_url,
                category_name=product.category.name if product.category else None,
                unit_price=unit_price,
                quantity=input_item.quantity,
                line_total=line_total,
                stock_quantity=product.stock_quantity,
                is_in_stock=is_in_stock,
                is_available=is_available,
                warning=warning
            )
        )

    # Coupon Evaluation
    coupon_obj: Optional[Coupon] = None
    discount_amount = Decimal("0.00")
    is_free_shipping_coupon = False
    discount_desc = None

    if payload.coupon_code:
        coupon_obj = db.query(Coupon).filter(
            Coupon.code == payload.coupon_code.strip().upper(),
            Coupon.is_active == True
        ).first()

        if coupon_obj:
            discount_amount, is_free_shipping_coupon, discount_desc = calculate_coupon_discount(
                coupon_obj, subtotal
            )
        else:
            discount_desc = f"Coupon '{payload.coupon_code}' is invalid or expired"

    # Shipping Calculation
    shipping_fee, is_free_shipping, needed_for_free = calculate_shipping(
        subtotal, is_free_shipping_coupon=is_free_shipping_coupon
    )

    # Tax Calculation
    taxable_amount = max(Decimal("0.00"), subtotal - discount_amount)
    tax_amount = calculate_tax(taxable_amount, DEFAULT_TAX_RATE)

    # Final Total
    total = max(Decimal("0.00"), subtotal - discount_amount + tax_amount + shipping_fee)

    return CartResponse(
        items=item_responses,
        subtotal=round_currency(subtotal),
        discount_amount=round_currency(discount_amount),
        coupon_code=payload.coupon_code if coupon_obj else None,
        discount_description=discount_desc,
        tax_rate=DEFAULT_TAX_RATE,
        tax_amount=round_currency(tax_amount),
        shipping_fee=round_currency(shipping_fee),
        is_free_shipping=is_free_shipping,
        free_shipping_threshold=FREE_SHIPPING_THRESHOLD,
        amount_needed_for_free_shipping=needed_for_free,
        total=round_currency(total),
        item_count=total_qty,
        unique_item_count=len(item_responses)
    )
