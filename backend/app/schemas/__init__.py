from typing import List, Optional
from pydantic import BaseModel, Field

class Review(BaseModel):
    user: str
    rating: int = Field(..., ge=1, le=5)
    comment: str
    date: str

class Category(BaseModel):
    id: str
    name: str
    slug: str
    icon: str
    description: str
    item_count: int = 0

class Product(BaseModel):
    id: str
    name: str
    slug: str
    category: str
    price: float
    original_price: Optional[float] = None
    discount_pct: Optional[int] = None
    rating: float = 4.5
    review_count: int = 0
    stock: int = 50
    badge: Optional[str] = None
    description: str
    features: List[str] = []
    image: str
    tags: List[str] = []
    created_at: str

class ProductFilterParams(BaseModel):
    category: Optional[str] = None
    search: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    sort_by: Optional[str] = "featured"
    badge: Optional[str] = None

class ProductListResponse(BaseModel):
    total: int
    count: int
    items: List[Product]
    categories: List[Category]

class CartItemInput(BaseModel):
    product_id: str
    quantity: int = Field(..., gt=0)

class CartItemDetail(BaseModel):
    product_id: str
    product_name: str
    product_image: str
    category: str
    unit_price: float
    quantity: int
    total_price: float

class CartValidateRequest(BaseModel):
    items: List[CartItemInput]
    coupon_code: Optional[str] = None

class CartCalculationResponse(BaseModel):
    items: List[CartItemDetail]
    subtotal: float
    discount_amount: float
    discount_applied: Optional[str] = None
    tax_rate: float
    tax_amount: float
    shipping_fee: float
    is_free_shipping: bool
    free_shipping_threshold: float
    total: float
    item_count: int

class CustomerInfo(BaseModel):
    full_name: str
    email: str
    phone: Optional[str] = None
    address: str
    city: str
    postal_code: str
    country: str = "United States"

class OrderCreateRequest(BaseModel):
    customer: CustomerInfo
    items: List[CartItemInput]
    coupon_code: Optional[str] = None
    payment_method: str = "card"

class OrderResponse(BaseModel):
    order_id: str
    status: str
    customer: CustomerInfo
    summary: CartCalculationResponse
    payment_method: str
    created_at: str
    tracking_number: str

class CouponValidateRequest(BaseModel):
    code: str
    subtotal: float

class CouponValidateResponse(BaseModel):
    valid: bool
    code: str
    discount_pct: int
    message: str
