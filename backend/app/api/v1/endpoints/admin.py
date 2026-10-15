from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Request, status, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_db, get_current_admin
from app.models import User, Order
from app.schemas.order import OrderResponse
from app.schemas.admin import (
    AdminDashboardMetricsResponse,
    AdminOrderListResponse,
    AdminOrderUpdateStatusPayload,
    AuditEventResponse,
)
from app.services.admin_service import (
    get_dashboard_metrics,
    get_admin_orders,
    update_admin_order_status,
    get_admin_audit_logs,
)

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])

@router.get(
    "/metrics",
    response_model=AdminDashboardMetricsResponse,
    summary="Admin Dashboard Metrics",
    description="Retrieve high-level business analytics, stock alerts, and recent orders."
)
def get_metrics(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    return get_dashboard_metrics(db)

@router.get(
    "/orders",
    response_model=AdminOrderListResponse,
    summary="List All Orders (Admin)",
    description="Search, filter by status, sort, and paginate orders across all customers."
)
def list_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, description="Filter by OrderStatus"),
    payment_status: Optional[str] = Query(None, description="Filter by PaymentStatus"),
    search: Optional[str] = Query(None, description="Search order number or customer"),
    sort_by: str = Query("newest", description="Sorting criteria: newest, oldest, total-high, total-low"),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    return get_admin_orders(
        db=db,
        page=page,
        page_size=page_size,
        status_filter=status,
        payment_status_filter=payment_status,
        search=search,
        sort_by=sort_by
    )

@router.get(
    "/orders/{order_number}",
    response_model=OrderResponse,
    summary="Get Order Details (Admin)",
    description="Retrieve full details, delivery address, price snapshots, and payment records for any order."
)
def get_admin_order_detail(
    order_number: str,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    order = db.query(Order).options(
        joinedload(Order.items),
        joinedload(Order.payments)
    ).filter(Order.order_number == order_number).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order '{order_number}' not found."
        )

    return order

@router.patch(
    "/orders/{order_number}/status",
    response_model=OrderResponse,
    summary="Update Order Status (Admin)",
    description="Execute an allowed order status transition, restore inventory if cancelling, and record audit event."
)
def update_order_status(
    order_number: str,
    payload: AdminOrderUpdateStatusPayload,
    request: Request,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    client_ip = request.client.host if request.client else None
    return update_admin_order_status(
        db=db,
        order_number=order_number,
        target_status_str=payload.status,
        admin=admin,
        ip_address=client_ip,
        notes=payload.notes
    )

@router.get(
    "/audit-logs",
    response_model=List[AuditEventResponse],
    summary="Admin Audit Trail",
    description="Retrieve immutable audit events for sensitive administrative modifications."
)
def get_audit_trail(
    limit: int = Query(50, ge=1, le=200),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    return get_admin_audit_logs(db, limit=limit)
