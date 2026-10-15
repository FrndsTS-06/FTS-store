from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

class ShippingAddressSchema(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    phone: Optional[str] = Field(None, max_length=50)
    address_line1: str = Field(..., min_length=3, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    city: str = Field(..., min_length=2, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    postal_code: str = Field(..., min_length=3, max_length=30)
    country: str = Field("United States", min_length=2, max_length=100)

class CheckoutItemInput(BaseModel):
    product_id: str
    quantity: int = Field(..., ge=1, le=99)

class OrderCreatePayload(BaseModel):
    shipping_address: ShippingAddressSchema
    payment_method: str = Field("card", description="Payment method: card, paypal, cod")
    coupon_code: Optional[str] = None
    items: Optional[List[CheckoutItemInput]] = Field(
        None,
        description="Optional explicit items list; if omitted or empty, checks out active cart"
    )
    idempotency_key: Optional[str] = Field(None, max_length=100)
    guest_email: Optional[EmailStr] = None

    @field_validator("payment_method")
    @classmethod
    def validate_method(cls, v: str) -> str:
        valid = ["card", "paypal", "cod"]
        normalized = v.lower().strip()
        if normalized not in valid:
            raise ValueError(f"Invalid payment method '{v}'. Must be one of: {valid}")
        return normalized

class OrderItemResponse(BaseModel):
    id: str
    product_id: Optional[str]
    product_name: str
    product_sku: str
    unit_price: float
    quantity: int
    total_price: float
    image_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class PaymentResponse(BaseModel):
    id: str
    payment_method: str
    status: str
    amount: float
    transaction_reference: Optional[str]
    currency: str = "USD"
    gateway_metadata: Optional[dict] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class OrderResponse(BaseModel):
    id: str
    order_number: str
    idempotency_key: Optional[str] = None
    tracking_number: Optional[str]
    status: str
    payment_status: str
    subtotal: float
    discount_amount: float
    coupon_code: Optional[str]
    tax_rate: float
    tax_amount: float
    shipping_fee: float
    total_amount: float
    payment_method: str
    shipping_address: dict
    items: List[OrderItemResponse]
    payments: List[PaymentResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class OrderListResponse(BaseModel):
    total: int
    items: List[OrderResponse]

class SimulatePaymentPayload(BaseModel):
    outcome: str = Field("success", description="Simulation outcome: 'success' or 'failure'")
    card_last4: Optional[str] = Field("4242", min_length=4, max_length=4)
    card_brand: Optional[str] = "Visa"

    @field_validator("outcome")
    @classmethod
    def validate_outcome(cls, v: str) -> str:
        normalized = v.lower().strip()
        if normalized not in ["success", "failure"]:
            raise ValueError("Outcome must be either 'success' or 'failure'")
        return normalized

class SimulatePaymentResponse(BaseModel):
    success: bool
    order_number: str
    payment_status: str
    order_status: str
    transaction_reference: str
    message: str
    is_simulation: bool = True
