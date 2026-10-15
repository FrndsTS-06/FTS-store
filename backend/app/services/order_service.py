import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.core.pricing import (
    calculate_coupon_discount,
    calculate_shipping,
    calculate_tax,
    round_currency,
)
from app.models.enums import OrderStatus, PaymentStatus, PaymentMethod, DiscountType
from app.models.order import Order, OrderItem, Coupon
from app.models.payment import Payment
from app.models.product import Product
from app.models.cart import CartItem
from app.models.user import User
from app.schemas.order import (
    OrderCreatePayload,
    SimulatePaymentPayload,
    SimulatePaymentResponse,
)

def create_order(
    db: Session,
    payload: OrderCreatePayload,
    user: Optional[User] = None,
    session_id: Optional[str] = None,
    idempotency_key: Optional[str] = None,
) -> Order:
    """
    Execute complete atomic checkout transaction:
    1. Idempotency validation: returns existing order if key matches.
    2. Resolves items from payload or persistent cart.
    3. Revalidates stock bounds atomically.
    4. Authoritatively recalculates decimal subtotal, discounts, shipping, tax, and total.
    5. Deducts stock quantity atomically.
    6. Creates order and order items with immutable price snapshots.
    7. Empties persistent cart.
    """
    effective_idempotency_key = idempotency_key or payload.idempotency_key
    if effective_idempotency_key:
        existing = db.query(Order).filter(Order.idempotency_key == effective_idempotency_key).first()
        if existing:
            return existing

    # Step 1: Collect item requirements
    items_to_checkout: List[Tuple[str, int]] = []

    if payload.items and len(payload.items) > 0:
        items_to_checkout = [(item.product_id, item.quantity) for item in payload.items]
    else:
        # Load from active cart
        cart_query = db.query(CartItem)
        if user:
            cart_query = cart_query.filter(CartItem.user_id == user.id)
        elif session_id:
            cart_query = cart_query.filter(CartItem.session_id == session_id)
        else:
            cart_query = cart_query.filter(False)

        cart_records = cart_query.all()
        if not cart_records:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot checkout with an empty shopping cart."
            )
        items_to_checkout = [(ci.product_id, ci.quantity) for ci in cart_records]

    if not items_to_checkout:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create an order with an empty cart."
        )

    # Step 2: Validate products, stock, and calculate line totals
    line_items_data = []
    subtotal = Decimal("0.00")
    products_to_update = []

    for product_id, quantity in items_to_checkout:
        prod_q = db.query(Product).filter(Product.id == product_id)
        if db.bind and db.bind.dialect.name == "postgresql":
            prod_q = prod_q.with_for_update()
        product = prod_q.first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product with ID '{product_id}' does not exist."
            )
        if not product.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product '{product.name}' is no longer available for purchase."
            )
        if product.stock_quantity < quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for '{product.name}'. Requested {quantity}, but only {product.stock_quantity} available."
            )

        unit_price = Decimal(str(product.price))
        line_total = round_currency(unit_price * Decimal(quantity))
        subtotal += line_total

        line_items_data.append({
            "product": product,
            "product_id": product.id,
            "product_name": product.name,
            "product_sku": product.sku,
            "unit_price": unit_price,
            "quantity": quantity,
            "total_price": line_total
        })
        products_to_update.append((product, quantity))

    subtotal = round_currency(subtotal)

    # Step 3: Revalidate Coupon if provided
    discount_amount = Decimal("0.00")
    applied_coupon_code = None

    is_free_shipping_coupon = False
    if payload.coupon_code and payload.coupon_code.strip():
        code_upper = payload.coupon_code.strip().upper()
        coupon = db.query(Coupon).filter(Coupon.code == code_upper, Coupon.is_active == True).first()
        if coupon and subtotal >= Decimal(str(coupon.min_order_amount or "0.00")):
            discount_amount, is_free_shipping_coupon, _ = calculate_coupon_discount(coupon, subtotal)
            applied_coupon_code = coupon.code
            coupon.uses_count += 1
            db.add(coupon)

    # Step 4: Authoritative Monetary Calculation
    taxable_amount = max(Decimal("0.00"), subtotal - discount_amount)
    shipping_fee, _, _ = calculate_shipping(subtotal, is_free_shipping_coupon=is_free_shipping_coupon)
    tax_amount = calculate_tax(taxable_amount)
    total_amount = round_currency(taxable_amount + shipping_fee + tax_amount)

    # Step 5: Atomic stock deduction
    for product, qty in products_to_update:
        product.stock_quantity -= qty
        product.is_in_stock = (product.stock_quantity > 0)
        db.add(product)

    # Step 6: Create Order & OrderItems
    now_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    order_number = f"FTS-{now_str}-{uuid.uuid4().hex[:6].upper()}"
    tracking_number = f"TRK-{uuid.uuid4().hex[:10].upper()}"

    payment_method_enum = PaymentMethod(payload.payment_method.lower())

    guest_email = None
    if not user:
        if not payload.guest_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Guest email address is required for guest checkout."
            )
        guest_email = payload.guest_email.strip().lower()

    order = Order(
        id=str(uuid.uuid4()),
        order_number=order_number,
        idempotency_key=effective_idempotency_key,
        user_id=user.id if user else None,
        guest_email=guest_email,
        status=OrderStatus.PENDING,
        subtotal=subtotal,
        discount_amount=discount_amount,
        coupon_code=applied_coupon_code,
        tax_rate=Decimal("0.0800"),
        tax_amount=tax_amount,
        shipping_fee=shipping_fee,
        total_amount=total_amount,
        payment_method=payment_method_enum,
        payment_status=PaymentStatus.PENDING,
        shipping_address=payload.shipping_address.model_dump(),
        tracking_number=tracking_number
    )
    db.add(order)
    db.flush()

    for item_data in line_items_data:
        order_item = OrderItem(
            id=str(uuid.uuid4()),
            order_id=order.id,
            product_id=item_data["product_id"],
            product_name=item_data["product_name"],
            product_sku=item_data["product_sku"],
            unit_price=item_data["unit_price"],
            quantity=item_data["quantity"],
            total_price=item_data["total_price"]
        )
        db.add(order_item)

    # Step 7: Clear cart items
    if user:
        db.query(CartItem).filter(CartItem.user_id == user.id).delete(synchronize_session=False)
    elif session_id:
        db.query(CartItem).filter(CartItem.session_id == session_id).delete(synchronize_session=False)

    db.commit()
    db.refresh(order)
    return order

def simulate_order_payment(
    db: Session,
    order_number: str,
    payload: SimulatePaymentPayload,
    user: Optional[User] = None
) -> SimulatePaymentResponse:
    """
    Process simulated demo payment.
    Strictly verifies order existence, authorization, and updates payment state.
    """
    order = db.query(Order).filter(Order.order_number == order_number).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order '{order_number}' not found."
        )

    if user and user.role.value != "admin":
        if order.user_id and order.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to pay for this order."
            )

    if order.payment_status == PaymentStatus.COMPLETED:
        return SimulatePaymentResponse(
            success=True,
            order_number=order.order_number,
            payment_status=order.payment_status.value,
            order_status=order.status.value,
            transaction_reference="EXISTING-TRANSACTION",
            message="Order has already been successfully paid.",
            is_simulation=True
        )

    txn_ref = f"SIM-TXN-{uuid.uuid4().hex[:10].upper()}"

    if payload.outcome == "success":
        order.payment_status = PaymentStatus.COMPLETED
        order.status = OrderStatus.PROCESSING

        payment = Payment(
            id=str(uuid.uuid4()),
            order_id=order.id,
            payment_method=order.payment_method,
            status=PaymentStatus.COMPLETED,
            amount=order.total_amount,
            transaction_reference=txn_ref,
            currency="USD",
            gateway_metadata={
                "processor": "FTS Demo Payment Simulator",
                "mode": "simulation",
                "simulated": True,
                "card_brand": payload.card_brand or "Visa",
                "card_last4": payload.card_last4 or "4242"
            }
        )
        db.add(payment)
        db.commit()
        db.refresh(order)

        return SimulatePaymentResponse(
            success=True,
            order_number=order.order_number,
            payment_status=order.payment_status.value,
            order_status=order.status.value,
            transaction_reference=txn_ref,
            message="Simulated payment processed successfully (no real funds transferred).",
            is_simulation=True
        )
    else:
        order.payment_status = PaymentStatus.FAILED

        payment = Payment(
            id=str(uuid.uuid4()),
            order_id=order.id,
            payment_method=order.payment_method,
            status=PaymentStatus.FAILED,
            amount=order.total_amount,
            transaction_reference=txn_ref,
            currency="USD",
            gateway_metadata={
                "processor": "FTS Demo Payment Simulator",
                "mode": "simulation",
                "simulated": True,
                "failure_reason": "Card declined (simulated failure)"
            }
        )
        db.add(payment)
        db.commit()
        db.refresh(order)

        return SimulatePaymentResponse(
            success=False,
            order_number=order.order_number,
            payment_status=order.payment_status.value,
            order_status=order.status.value,
            transaction_reference=txn_ref,
            message="Simulated payment failed: Card declined by payment gateway.",
            is_simulation=True
        )

def cancel_order(
    db: Session,
    order_number: str,
    user: Optional[User] = None
) -> Order:
    """
    Cancel an order and atomically restore reserved inventory stock.
    """
    order = db.query(Order).filter(Order.order_number == order_number).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order '{order_number}' not found."
        )

    if user and user.role.value != "admin":
        if order.user_id and order.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to cancel this order."
            )

    if order.status in [OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.CANCELLED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order cannot be cancelled in its current state ('{order.status.value}')."
        )

    # Restore inventory
    for item in order.items:
        if item.product_id:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                product.stock_quantity += item.quantity
                product.is_in_stock = True
                db.add(product)

    order.status = OrderStatus.CANCELLED
    if order.payment_status == PaymentStatus.COMPLETED:
        order.payment_status = PaymentStatus.REFUNDED
        refund_payment = Payment(
            id=str(uuid.uuid4()),
            order_id=order.id,
            payment_method=order.payment_method,
            status=PaymentStatus.REFUNDED,
            amount=order.total_amount,
            transaction_reference=f"REFUND-{uuid.uuid4().hex[:10].upper()}",
            currency="USD",
            gateway_metadata={
                "processor": "FTS Demo Payment Simulator",
                "refunded": True,
                "reason": "Customer cancellation"
            }
        )
        db.add(refund_payment)

    db.commit()
    db.refresh(order)
    return order

def get_customer_orders(db: Session, user: User, limit: int = 50) -> List[Order]:
    """
    Retrieve order history for an authenticated customer.
    Customers can only view their own orders.
    """
    return (
        db.query(Order)
        .filter(Order.user_id == user.id)
        .order_by(Order.created_at.desc())
        .limit(limit)
        .all()
    )

def get_order_by_number(
    db: Session,
    order_number: str,
    user: Optional[User] = None
) -> Order:
    """
    Retrieve single order by order number with strict authorization checks.
    """
    order = db.query(Order).filter(Order.order_number == order_number).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order '{order_number}' not found."
        )

    if user and user.role.value != "admin":
        if order.user_id and order.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view this order."
            )

    return order
