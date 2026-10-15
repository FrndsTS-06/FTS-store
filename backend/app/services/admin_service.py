import uuid
from typing import List, Optional, Tuple, Dict, Any
from decimal import Decimal
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_, desc, asc

from app.models import Order, OrderItem, Product, User, Category, AuditEvent
from app.models.enums import OrderStatus, PaymentStatus, UserRole, PaymentMethod
from app.schemas.admin import (
    AdminDashboardMetricsResponse,
    AdminRecentOrderSummary,
    AdminOrderListItem,
    AdminOrderListResponse,
    AuditEventResponse,
)

# =============================================================================
# Order State Machine Allowed Transitions
# =============================================================================
ALLOWED_STATUS_TRANSITIONS: Dict[OrderStatus, List[OrderStatus]] = {
    OrderStatus.PENDING: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
    OrderStatus.PROCESSING: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
    OrderStatus.SHIPPED: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
    OrderStatus.DELIVERED: [],  # Terminal completed state
    OrderStatus.CANCELLED: [],  # Terminal cancelled state
}

def log_audit_event(
    db: Session,
    actor_id: Optional[str],
    action: str,
    entity_name: str,
    entity_id: str,
    old_values: Optional[dict] = None,
    new_values: Optional[dict] = None,
    ip_address: Optional[str] = None
) -> AuditEvent:
    """Helper to record immutable audit events for sensitive administrative mutations."""
    event = AuditEvent(
        id=str(uuid.uuid4()),
        actor_id=actor_id,
        action=action,
        entity_name=entity_name,
        entity_id=str(entity_id),
        old_values=old_values,
        new_values=new_values,
        ip_address=ip_address
    )
    db.add(event)
    return event

def get_dashboard_metrics(db: Session) -> AdminDashboardMetricsResponse:
    """
    Compute real-time administrative summary metrics:
    total orders, revenue, product counts, stock alerts, and recent orders.
    """
    total_orders = db.query(func.count(Order.id)).scalar() or 0

    # Revenue: sum of paid or active non-cancelled orders
    total_revenue_dec = db.query(
        func.coalesce(func.sum(Order.total_amount), Decimal("0.00"))
    ).filter(
        Order.status != OrderStatus.CANCELLED,
        Order.payment_status.in_([PaymentStatus.COMPLETED, PaymentStatus.PENDING])
    ).scalar() or Decimal("0.00")
    total_revenue = float(total_revenue_dec)

    total_products = db.query(func.count(Product.id)).scalar() or 0
    active_products = db.query(func.count(Product.id)).filter(Product.is_active == True).scalar() or 0

    low_stock_products = db.query(func.count(Product.id)).filter(
        Product.is_active == True,
        Product.stock_quantity <= 5,
        Product.stock_quantity > 0
    ).scalar() or 0

    out_of_stock_products = db.query(func.count(Product.id)).filter(
        Product.is_active == True,
        Product.stock_quantity <= 0
    ).scalar() or 0

    registered_customers = db.query(func.count(User.id)).filter(
        User.role == UserRole.CUSTOMER
    ).scalar() or 0

    recent_orders_raw = db.query(Order).options(
        joinedload(Order.user),
        joinedload(Order.items)
    ).order_by(Order.created_at.desc()).limit(6).all()

    recent_orders: List[AdminRecentOrderSummary] = []
    for o in recent_orders_raw:
        cust_name = None
        cust_email = o.guest_email
        if o.user:
            cust_name = o.user.full_name
            cust_email = o.user.email
        elif o.shipping_address and isinstance(o.shipping_address, dict):
            cust_name = o.shipping_address.get("full_name")

        item_count = sum(item.quantity for item in o.items)

        recent_orders.append(
            AdminRecentOrderSummary(
                id=o.id,
                order_number=o.order_number,
                customer_name=cust_name,
                customer_email=cust_email,
                total_amount=float(o.total_amount),
                status=o.status.value,
                payment_status=o.payment_status.value,
                payment_method=o.payment_method.value,
                item_count=item_count,
                created_at=o.created_at
            )
        )

    return AdminDashboardMetricsResponse(
        total_orders=total_orders,
        total_revenue=total_revenue,
        total_products=total_products,
        active_products=active_products,
        low_stock_products=low_stock_products,
        out_of_stock_products=out_of_stock_products,
        registered_customers=registered_customers,
        recent_orders=recent_orders
    )

def get_admin_orders(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    status_filter: Optional[str] = None,
    payment_status_filter: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = "newest"
) -> AdminOrderListResponse:
    """
    Search, filter, sort, and paginate orders for administrators.
    """
    page = max(1, page)
    page_size = min(max(1, page_size), 100)

    query = db.query(Order).options(
        joinedload(Order.user),
        joinedload(Order.items)
    )

    if status_filter and status_filter.strip():
        norm_status = status_filter.strip().lower()
        query = query.filter(Order.status == OrderStatus(norm_status))

    if payment_status_filter and payment_status_filter.strip():
        norm_pay = payment_status_filter.strip().lower()
        query = query.filter(Order.payment_status == PaymentStatus(norm_pay))

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.outerjoin(User, Order.user_id == User.id).filter(
            or_(
                Order.order_number.ilike(term),
                Order.tracking_number.ilike(term),
                Order.guest_email.ilike(term),
                User.email.ilike(term),
                User.full_name.ilike(term),
            )
        )

    # Sorting
    if sort_by == "oldest":
        query = query.order_by(Order.created_at.asc())
    elif sort_by == "total-high":
        query = query.order_by(Order.total_amount.desc())
    elif sort_by == "total-low":
        query = query.order_by(Order.total_amount.asc())
    else:  # newest default
        query = query.order_by(Order.created_at.desc())

    total = query.count()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    orders_page = query.offset((page - 1) * page_size).limit(page_size).all()

    items: List[AdminOrderListItem] = []
    for o in orders_page:
        cust_name = None
        cust_email = o.guest_email
        city = None
        country = None

        if o.user:
            cust_name = o.user.full_name
            cust_email = o.user.email
        if o.shipping_address and isinstance(o.shipping_address, dict):
            if not cust_name:
                cust_name = o.shipping_address.get("full_name")
            city = o.shipping_address.get("city")
            country = o.shipping_address.get("country")

        item_count = sum(it.quantity for it in o.items)

        items.append(
            AdminOrderListItem(
                id=o.id,
                order_number=o.order_number,
                customer_name=cust_name,
                customer_email=cust_email,
                status=o.status.value,
                payment_status=o.payment_status.value,
                payment_method=o.payment_method.value,
                total_amount=float(o.total_amount),
                item_count=item_count,
                tracking_number=o.tracking_number,
                shipping_city=city,
                shipping_country=country,
                created_at=o.created_at,
                updated_at=o.updated_at
            )
        )

    return AdminOrderListResponse(
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        items=items
    )

def update_admin_order_status(
    db: Session,
    order_number: str,
    target_status_str: str,
    admin: User,
    ip_address: Optional[str] = None,
    notes: Optional[str] = None
) -> Order:
    """
    Validate allowed transitions, mutate status, restore inventory upon cancellation,
    and log an immutable AuditEvent.
    """
    order = db.query(Order).options(
        joinedload(Order.items).joinedload(OrderItem.product),
        joinedload(Order.payments)
    ).filter(Order.order_number == order_number).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order '{order_number}' not found."
        )

    try:
        target_status = OrderStatus(target_status_str.strip().lower())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid target order status: '{target_status_str}'."
        )

    current_status = order.status

    # If status is already the same, idempotent confirmation
    if current_status == target_status:
        return order

    allowed_targets = ALLOWED_STATUS_TRANSITIONS.get(current_status, [])
    if target_status not in allowed_targets:
        allowed_names = [s.value for s in allowed_targets]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Invalid order status transition from '{current_status.value}' to '{target_status.value}'. "
                f"Allowed transitions from '{current_status.value}': {allowed_names or 'None (Terminal state)'}."
            )
        )

    old_status_val = order.status.value
    old_payment_status_val = order.payment_status.value

    # Apply transition mutations
    order.status = target_status

    # Special handling for CANCELLED: restore inventory and refund if paid
    if target_status == OrderStatus.CANCELLED:
        for item in order.items:
            product = item.product or db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                product.stock_quantity += item.quantity
                product.is_in_stock = (product.stock_quantity > 0)
                db.add(product)

        if order.payment_status == PaymentStatus.COMPLETED:
            order.payment_status = PaymentStatus.REFUNDED

    # Special handling for DELIVERED: mark COD as completed
    elif target_status == OrderStatus.DELIVERED:
        if order.payment_method == PaymentMethod.COD and order.payment_status == PaymentStatus.PENDING:
            order.payment_status = PaymentStatus.COMPLETED

    # Record Audit Event
    log_audit_event(
        db=db,
        actor_id=admin.id,
        action="ORDER_STATUS_UPDATE",
        entity_name="Order",
        entity_id=order.id,
        old_values={
            "status": old_status_val,
            "payment_status": old_payment_status_val,
        },
        new_values={
            "status": order.status.value,
            "payment_status": order.payment_status.value,
            "admin_notes": notes,
        },
        ip_address=ip_address
    )

    db.commit()
    db.refresh(order)
    return order

def get_admin_audit_logs(db: Session, limit: int = 50) -> List[AuditEventResponse]:
    """Retrieve recent audit events for admin inspection."""
    limit = min(max(1, limit), 200)
    events = db.query(AuditEvent).options(
        joinedload(AuditEvent.actor)
    ).order_by(AuditEvent.created_at.desc()).limit(limit).all()

    result: List[AuditEventResponse] = []
    for ev in events:
        actor_email = ev.actor.email if ev.actor else None
        result.append(
            AuditEventResponse(
                id=ev.id,
                actor_id=ev.actor_id,
                actor_email=actor_email,
                action=ev.action,
                entity_name=ev.entity_name,
                entity_id=ev.entity_id,
                old_values=ev.old_values,
                new_values=ev.new_values,
                ip_address=ev.ip_address,
                created_at=ev.created_at
            )
        )
    return result
