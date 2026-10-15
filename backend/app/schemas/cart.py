from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator

# =============================================================================
# Input Payloads
# =============================================================================
class CartItemAdd(BaseModel):
    product_id: str = Field(..., min_length=1, description="Target product ID or slug")
    quantity: int = Field(1, ge=1, le=99, description="Quantity to add (1-99)")

class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=1, le=99, description="Absolute new quantity (1-99)")

class CartCouponApply(BaseModel):
    coupon_code: Optional[str] = Field(None, min_length=1, max_length=50, description="Promo coupon code")
    code: Optional[str] = Field(None, min_length=1, max_length=50, description="Promo coupon code alias")

    @field_validator("coupon_code", mode="before")
    @classmethod
    def fallback_code(cls, v, values):
        return v

    def get_effective_code(self) -> str:
        c = self.coupon_code or self.code
        if not c or not c.strip():
            raise ValueError("coupon_code or code is required")
        return c.strip()


# =============================================================================
# Output Responses
# =============================================================================
class CartItemResponse(BaseModel):
    id: str = Field(..., description="Unique cart line item ID")
    product_id: str = Field(..., description="Product UUID")
    name: str = Field(..., description="Product title")
    slug: str = Field(..., description="Product URL slug")
    sku: str = Field(..., description="Product SKU")
    image_url: Optional[str] = Field(None, description="Primary thumbnail image")
    category_name: Optional[str] = Field(None, description="Category name")
    unit_price: Decimal = Field(..., description="Authoritative unit price from database")
    quantity: int = Field(..., description="Selected quantity in cart")
    line_total: Decimal = Field(..., description="Calculated line total (unit_price * quantity)")
    stock_quantity: int = Field(..., description="Current available inventory")
    is_in_stock: bool = Field(..., description="True if stock_quantity >= quantity")
    is_available: bool = Field(True, description="True if product is active and purchasable")
    warning: Optional[str] = Field(None, description="Warning if stock is limited or unavailable")

    model_config = ConfigDict(from_attributes=True)

class CartResponse(BaseModel):
    session_id: Optional[str] = Field(None, description="Guest session identifier")
    user_id: Optional[str] = Field(None, description="Authenticated customer ID")
    items: List[CartItemResponse] = Field(default_factory=list, description="Cart item lines")
    subtotal: Decimal = Field(Decimal("0.00"), description="Sum of all item line totals")
    discount_amount: Decimal = Field(Decimal("0.00"), description="Discount deducted by coupon")
    coupon_code: Optional[str] = Field(None, description="Active coupon code applied")
    discount_description: Optional[str] = Field(None, description="Description of applied promotion")
    tax_rate: Decimal = Field(Decimal("0.08"), description="Applicable sales tax rate (8.00%)")
    tax_amount: Decimal = Field(Decimal("0.00"), description="Sales tax amount")
    shipping_fee: Decimal = Field(Decimal("0.00"), description="Shipping fee ($9.99 or $0.00)")
    is_free_shipping: bool = Field(False, description="True if free shipping threshold reached")
    free_shipping_threshold: Decimal = Field(Decimal("100.00"), description="Threshold for free shipping ($100.00)")
    amount_needed_for_free_shipping: Decimal = Field(Decimal("100.00"), description="Amount needed to qualify for free shipping")
    total: Decimal = Field(Decimal("0.00"), description="Final estimated total")
    item_count: int = Field(0, description="Sum of all item quantities in cart")
    unique_item_count: int = Field(0, description="Number of distinct product lines")

    model_config = ConfigDict(from_attributes=True)
