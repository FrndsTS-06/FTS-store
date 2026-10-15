import uuid
from decimal import Decimal
from typing import List, Optional, Tuple, Dict
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from app.models import CartItem, Product, ProductImage, User
from app.models.order import Coupon
from app.models.enums import DiscountType
from app.core.pricing import (
    calculate_shipping,
    calculate_tax,
    calculate_coupon_discount,
    round_currency,
    MAX_QUANTITY_PER_ITEM,
    MIN_QUANTITY_PER_ITEM,
    FREE_SHIPPING_THRESHOLD,
    DEFAULT_TAX_RATE,
)
from app.schemas.cart import CartItemResponse, CartResponse
from app.core.errors import AppException
from fastapi import status

# In-memory storage for active cart coupon per session/user
_ACTIVE_COUPONS: Dict[str, str] = {}

class CartService:
    @staticmethod
    def _get_cart_key(user_id: Optional[str], session_id: Optional[str]) -> str:
        """Produce unique key for active coupon tracking."""
        if user_id:
            return f"user:{user_id}"
        if session_id:
            return f"session:{session_id}"
        return "anonymous"

    @classmethod
    def get_active_coupon(cls, user_id: Optional[str], session_id: Optional[str]) -> Optional[str]:
        return _ACTIVE_COUPONS.get(cls._get_cart_key(user_id, session_id))

    @classmethod
    def set_active_coupon(cls, user_id: Optional[str], session_id: Optional[str], code: Optional[str]):
        key = cls._get_cart_key(user_id, session_id)
        if code:
            _ACTIVE_COUPONS[key] = code.strip().upper()
        else:
            _ACTIVE_COUPONS.pop(key, None)

    @classmethod
    def get_cart_items_query(cls, db: Session, user_id: Optional[str], session_id: Optional[str]):
        """Filter cart items strictly for the authenticated user or guest session."""
        if not user_id and not session_id:
            return db.query(CartItem).filter(False)

        filters = []
        if user_id:
            filters.append(CartItem.user_id == user_id)
        elif session_id:
            filters.append(CartItem.session_id == session_id)

        return db.query(CartItem).options(
            joinedload(CartItem.product).joinedload(Product.images),
            joinedload(CartItem.product).joinedload(Product.category)
        ).filter(or_(*filters))

    @classmethod
    def get_or_calculate_cart(
        cls,
        db: Session,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        override_coupon: Optional[str] = None
    ) -> CartResponse:
        """
        Assemble the complete authoritative shopping cart with calculated line totals,
        stock revalidation, discounts, taxes, and shipping fees.
        """
        cart_items = cls.get_cart_items_query(db, user_id, session_id).order_by(CartItem.created_at.asc()).all()

        item_responses: List[CartItemResponse] = []
        subtotal = Decimal("0.00")
        total_quantity = 0

        for item in cart_items:
            product = item.product
            if not product:
                continue

            unit_price = Decimal(str(product.price))
            line_total = round_currency(unit_price * Decimal(item.quantity))
            subtotal += line_total
            total_quantity += item.quantity

            # Primary image resolution
            image_url = None
            if product.images:
                primary_imgs = [img for img in product.images if img.is_primary]
                image_url = primary_imgs[0].url if primary_imgs else product.images[0].url

            # Stock & availability status
            is_available = bool(product.is_active)
            is_in_stock = product.stock_quantity >= item.quantity and is_available
            warning = None

            if not is_available:
                warning = "This product has been archived or is no longer available."
            elif product.stock_quantity <= 0:
                warning = "Item is currently out of stock."
            elif product.stock_quantity < item.quantity:
                warning = f"Only {product.stock_quantity} units available in warehouse."

            item_responses.append(
                CartItemResponse(
                    id=item.id,
                    product_id=product.id,
                    name=product.name,
                    slug=product.slug,
                    sku=product.sku,
                    image_url=image_url,
                    category_name=product.category.name if product.category else None,
                    unit_price=unit_price,
                    quantity=item.quantity,
                    line_total=line_total,
                    stock_quantity=product.stock_quantity,
                    is_in_stock=is_in_stock,
                    is_available=is_available,
                    warning=warning
                )
            )

        # Coupon Evaluation
        coupon_code = override_coupon or cls.get_active_coupon(user_id, session_id)
        coupon_obj: Optional[Coupon] = None
        discount_amount = Decimal("0.00")
        is_free_shipping_coupon = False
        discount_desc = None

        if coupon_code:
            coupon_obj = db.query(Coupon).filter(
                Coupon.code == coupon_code.strip().upper(),
                Coupon.is_active == True
            ).first()

            if coupon_obj:
                discount_amount, is_free_shipping_coupon, discount_desc = calculate_coupon_discount(
                    coupon_obj, subtotal
                )
            else:
                discount_desc = f"Coupon '{coupon_code}' is invalid or expired"

        # Calculate Shipping
        shipping_fee, is_free_shipping, needed_for_free = calculate_shipping(
            subtotal, is_free_shipping_coupon=is_free_shipping_coupon
        )

        # Calculate Sales Tax
        taxable_amount = max(Decimal("0.00"), subtotal - discount_amount)
        tax_amount = calculate_tax(taxable_amount, DEFAULT_TAX_RATE)

        # Final Total
        final_total = max(Decimal("0.00"), subtotal - discount_amount + tax_amount + shipping_fee)

        return CartResponse(
            session_id=session_id,
            user_id=user_id,
            items=item_responses,
            subtotal=round_currency(subtotal),
            discount_amount=round_currency(discount_amount),
            coupon_code=coupon_code if coupon_obj else None,
            discount_description=discount_desc,
            tax_rate=DEFAULT_TAX_RATE,
            tax_amount=round_currency(tax_amount),
            shipping_fee=round_currency(shipping_fee),
            is_free_shipping=is_free_shipping,
            free_shipping_threshold=FREE_SHIPPING_THRESHOLD,
            amount_needed_for_free_shipping=needed_for_free,
            total=round_currency(final_total),
            item_count=total_quantity,
            unique_item_count=len(item_responses)
        )

    @classmethod
    def add_item_to_cart(
        cls,
        db: Session,
        product_id_or_slug: str,
        quantity: int = 1,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> CartResponse:
        """
        Add product to cart or increment quantity if already present.
        Validates product status, stock availability, and non-duplicate entry.
        """
        # Validate quantity bounds
        if quantity < MIN_QUANTITY_PER_ITEM:
            raise AppException(
                code="INVALID_QUANTITY",
                message=f"Quantity must be at least {MIN_QUANTITY_PER_ITEM}",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        if quantity > MAX_QUANTITY_PER_ITEM:
            raise AppException(
                code="EXCESSIVE_QUANTITY",
                message=f"Quantity cannot exceed {MAX_QUANTITY_PER_ITEM} units per item",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # Ensure session or user identity
        if not user_id and not session_id:
            session_id = str(uuid.uuid4())

        # Resolve authoritative product from database
        product = db.query(Product).filter(
            or_(Product.id == product_id_or_slug, Product.slug == product_id_or_slug)
        ).first()

        if not product:
            raise AppException(
                code="PRODUCT_NOT_FOUND",
                message=f"Product '{product_id_or_slug}' not found",
                status_code=status.HTTP_404_NOT_FOUND
            )

        if not product.is_active:
            raise AppException(
                code="PRODUCT_UNAVAILABLE",
                message=f"Product '{product.name}' is currently unavailable for purchase",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        if product.stock_quantity <= 0:
            raise AppException(
                code="OUT_OF_STOCK",
                message=f"Product '{product.name}' is completely out of stock",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # Look for existing cart item to avoid duplicates
        existing_item = cls.get_cart_items_query(db, user_id, session_id).filter(
            CartItem.product_id == product.id
        ).first()

        if existing_item:
            target_qty = existing_item.quantity + quantity
            if target_qty > MAX_QUANTITY_PER_ITEM:
                raise AppException(
                    code="EXCESSIVE_QUANTITY",
                    message=f"Total quantity cannot exceed {MAX_QUANTITY_PER_ITEM} units",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            if target_qty > product.stock_quantity:
                raise AppException(
                    code="INSUFFICIENT_STOCK",
                    message=f"Requested total quantity ({target_qty}) exceeds warehouse stock ({product.stock_quantity})",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            existing_item.quantity = target_qty
        else:
            if quantity > product.stock_quantity:
                raise AppException(
                    code="INSUFFICIENT_STOCK",
                    message=f"Requested quantity ({quantity}) exceeds available stock ({product.stock_quantity})",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            new_item = CartItem(
                id=str(uuid.uuid4()),
                user_id=user_id,
                session_id=session_id,
                product_id=product.id,
                quantity=quantity
            )
            db.add(new_item)

        db.commit()
        return cls.get_or_calculate_cart(db, user_id, session_id)

    @classmethod
    def update_item_quantity(
        cls,
        db: Session,
        item_id_or_product_id: str,
        quantity: int,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> CartResponse:
        """Update absolute quantity for a line item in cart."""
        if quantity < MIN_QUANTITY_PER_ITEM:
            raise AppException(
                code="INVALID_QUANTITY",
                message=f"Quantity must be at least {MIN_QUANTITY_PER_ITEM}. Use DELETE to remove items.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        if quantity > MAX_QUANTITY_PER_ITEM:
            raise AppException(
                code="EXCESSIVE_QUANTITY",
                message=f"Quantity cannot exceed {MAX_QUANTITY_PER_ITEM} units",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        cart_item = cls.get_cart_items_query(db, user_id, session_id).filter(
            or_(
                CartItem.id == item_id_or_product_id,
                CartItem.product_id == item_id_or_product_id
            )
        ).first()

        if not cart_item:
            raise AppException(
                code="CART_ITEM_NOT_FOUND",
                message="Cart line item not found in your shopping cart",
                status_code=status.HTTP_404_NOT_FOUND
            )

        product = cart_item.product
        if not product or not product.is_active:
            raise AppException(
                code="PRODUCT_UNAVAILABLE",
                message="Product is no longer available for purchase",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        if quantity > product.stock_quantity:
            raise AppException(
                code="INSUFFICIENT_STOCK",
                message=f"Requested quantity ({quantity}) exceeds available stock ({product.stock_quantity})",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        cart_item.quantity = quantity
        db.commit()
        return cls.get_or_calculate_cart(db, user_id, session_id)

    @classmethod
    def remove_item(
        cls,
        db: Session,
        item_id_or_product_id: str,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> CartResponse:
        """Remove a line item from the user's cart."""
        cart_item = cls.get_cart_items_query(db, user_id, session_id).filter(
            or_(
                CartItem.id == item_id_or_product_id,
                CartItem.product_id == item_id_or_product_id
            )
        ).first()

        if not cart_item:
            raise AppException(
                code="CART_ITEM_NOT_FOUND",
                message="Cart line item not found in your cart",
                status_code=status.HTTP_404_NOT_FOUND
            )

        db.delete(cart_item)
        db.commit()
        return cls.get_or_calculate_cart(db, user_id, session_id)

    @classmethod
    def clear_cart(
        cls,
        db: Session,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> CartResponse:
        """Clear all items from the current user or guest cart."""
        items = cls.get_cart_items_query(db, user_id, session_id).all()
        for item in items:
            db.delete(item)
        db.commit()
        return cls.get_or_calculate_cart(db, user_id, session_id)

    @classmethod
    def apply_coupon(
        cls,
        db: Session,
        code: str,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> CartResponse:
        """Apply promotional discount coupon to the cart."""
        clean_code = code.strip().upper()
        coupon = db.query(Coupon).filter(
            Coupon.code == clean_code,
            Coupon.is_active == True
        ).first()

        if not coupon:
            raise AppException(
                code="INVALID_COUPON",
                message=f"Coupon code '{clean_code}' is invalid or expired",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # Store active coupon for this session/user
        cls.set_active_coupon(user_id, session_id, clean_code)
        return cls.get_or_calculate_cart(db, user_id, session_id, override_coupon=clean_code)

    @classmethod
    def remove_coupon(
        cls,
        db: Session,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> CartResponse:
        """Remove active coupon from the cart."""
        cls.set_active_coupon(user_id, session_id, None)
        return cls.get_or_calculate_cart(db, user_id, session_id, override_coupon=None)
