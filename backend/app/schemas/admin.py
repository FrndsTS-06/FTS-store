from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field

class AdminRecentOrderSummary(BaseModel):
    id: str
    order_number: str
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    total_amount: float
    status: str
    payment_status: str
    payment_method: str
    item_count: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AdminDashboardMetricsResponse(BaseModel):
    total_orders: int
    total_revenue: float
    total_products: int
    active_products: int
    low_stock_products: int
    out_of_stock_products: int
    registered_customers: int
    recent_orders: List[AdminRecentOrderSummary]

class AdminOrderListItem(BaseModel):
    id: str
    order_number: str
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    status: str
    payment_status: str
    payment_method: str
    total_amount: float
    item_count: int
    tracking_number: Optional[str] = None
    shipping_city: Optional[str] = None
    shipping_country: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AdminOrderListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    items: List[AdminOrderListItem]

class AdminOrderUpdateStatusPayload(BaseModel):
    status: str = Field(..., description="Target status: pending, processing, shipped, delivered, cancelled")
    notes: Optional[str] = Field(None, max_length=500, description="Optional administrative notes")

class AuditEventResponse(BaseModel):
    id: str
    actor_id: Optional[str] = None
    actor_email: Optional[str] = None
    action: str
    entity_name: str
    entity_id: str
    old_values: Optional[Dict[str, Any]] = None
    new_values: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
