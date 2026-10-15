from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

# =============================================================================
# Category Schemas
# =============================================================================
class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Category display name")
    slug: str = Field(..., min_length=1, max_length=120, description="URL-friendly slug")
    description: Optional[str] = Field(None, description="Category overview")
    icon_name: Optional[str] = Field(None, max_length=50, description="Icon reference name")
    image_url: Optional[str] = Field(None, max_length=500, description="Banner image URL")
    is_active: bool = Field(True, description="Category active visibility flag")

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    slug: Optional[str] = Field(None, min_length=1, max_length=120)
    description: Optional[str] = None
    icon_name: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None

class CategoryResponse(CategoryBase):
    id: str
    item_count: int = Field(0, description="Active products in category")
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# =============================================================================
# Product Image Schemas
# =============================================================================
class ProductImageBase(BaseModel):
    url: str = Field(..., min_length=5, max_length=500, description="Public image URL")
    alt_text: Optional[str] = Field(None, max_length=255, description="Image accessibility label")
    is_primary: bool = Field(False, description="Primary thumbnail indicator")
    display_order: int = Field(0, ge=0, description="Display sequence order")

class ProductImageCreate(ProductImageBase):
    pass

class ProductImageResponse(ProductImageBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# =============================================================================
# Product Schemas
# =============================================================================
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Product full name")
    slug: str = Field(..., min_length=1, max_length=280, description="URL slug")
    sku: str = Field(..., min_length=1, max_length=80, description="Unique stock keeping unit")
    description: str = Field(..., min_length=1, description="Detailed product description")
    price: Decimal = Field(..., gt=0, description="Unit retail price (must be positive)")
    compare_at_price: Optional[Decimal] = Field(None, ge=0, description="Original MSRP for strike-through discount")
    stock_quantity: int = Field(0, ge=0, description="Available warehouse inventory units")
    category_id: str = Field(..., min_length=1, description="Associated category ID")
    badge: Optional[str] = Field(None, max_length=50, description="Promotional badge like Trending, Sale")
    is_active: bool = Field(True, description="Active catalog visibility")

class ProductCreate(ProductBase):
    images: Optional[List[ProductImageCreate]] = Field(default_factory=list, description="Product gallery images")

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    slug: Optional[str] = Field(None, min_length=1, max_length=280)
    sku: Optional[str] = Field(None, min_length=1, max_length=80)
    description: Optional[str] = Field(None, min_length=1)
    price: Optional[Decimal] = Field(None, gt=0)
    compare_at_price: Optional[Decimal] = Field(None, ge=0)
    stock_quantity: Optional[int] = Field(None, ge=0)
    category_id: Optional[str] = None
    badge: Optional[str] = None
    is_active: Optional[bool] = None
    images: Optional[List[ProductImageCreate]] = None

class ProductStockUpdate(BaseModel):
    stock_quantity: int = Field(..., ge=0, description="Updated absolute warehouse inventory quantity")

class ProductResponse(BaseModel):
    id: str
    name: str
    slug: str
    sku: str
    description: str
    price: Decimal
    compare_at_price: Optional[Decimal] = None
    discount_pct: Optional[int] = None
    stock_quantity: int
    is_in_stock: bool
    stock_status: str  # in_stock, low_stock, out_of_stock
    badge: Optional[str] = None
    rating: Decimal
    review_count: int
    is_active: bool
    category: Optional[CategoryResponse] = None
    images: List[ProductImageResponse] = Field(default_factory=list)
    primary_image: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ProductListResponse(BaseModel):
    items: List[ProductResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
