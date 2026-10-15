from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from app.database import db
from app.schemas import Product, ProductListResponse

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("", response_model=ProductListResponse)
def list_products(
    category: Optional[str] = Query(None, description="Category slug (e.g. electronics, fashion, home)"),
    search: Optional[str] = Query(None, description="Search term for product name/tags/description"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price filter"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price filter"),
    badge: Optional[str] = Query(None, description="Filter by badge like Trending, Best Seller"),
    sort_by: Optional[str] = Query("featured", description="Sort order: featured, price-low, price-high, rating, newest")
):
    """
    Search, filter, and sort products across all categories.
    """
    items = db.get_products(
        category=category,
        search=search,
        min_price=min_price,
        max_price=max_price,
        badge=badge,
        sort_by=sort_by or "featured"
    )
    categories = db.get_categories()
    return ProductListResponse(
        total=len(items),
        count=len(items),
        items=items,
        categories=categories
    )

@router.get("/featured", response_model=List[Product])
def get_featured_products(limit: int = Query(6, ge=1, le=20)):
    """Retrieve curated featured / trending products."""
    all_products = db.get_products(sort_by="rating")
    return all_products[:limit]

@router.get("/{product_id}", response_model=Product)
def get_product(product_id: str):
    """Retrieve detailed product information by ID or slug."""
    product = db.get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail=f"Product '{product_id}' not found")
    return product
