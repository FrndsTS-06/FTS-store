import uuid
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status, Response
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, desc, asc

from app.api.deps import get_db, get_current_admin
from app.models import Product, ProductImage, Category, User
from app.schemas.catalog import (
    ProductCreate,
    ProductUpdate,
    ProductStockUpdate,
    ProductResponse,
    ProductListResponse,
    ProductImageResponse,
    CategoryResponse,
)
from app.core.errors import AppException
from app.services.admin_service import log_audit_event

router = APIRouter(prefix="/products", tags=["Products"])

ALLOWED_SORT_OPTIONS = {
    "price-low": (Product.price.asc(), Product.id.asc()),
    "price_asc": (Product.price.asc(), Product.id.asc()),
    "price-high": (Product.price.desc(), Product.id.asc()),
    "price_desc": (Product.price.desc(), Product.id.asc()),
    "name-asc": (Product.name.asc(), Product.id.asc()),
    "name_asc": (Product.name.asc(), Product.id.asc()),
    "name-desc": (Product.name.desc(), Product.id.asc()),
    "name_desc": (Product.name.desc(), Product.id.asc()),
    "newest": (Product.created_at.desc(), Product.id.asc()),
    "oldest": (Product.created_at.asc(), Product.id.asc()),
    "rating": (Product.rating.desc(), Product.review_count.desc(), Product.id.asc()),
    "featured": (Product.badge.isnot(None).desc(), Product.rating.desc(), Product.created_at.desc()),
}

def _enrich_product(p: Product) -> ProductResponse:
    """Transform Product ORM entity into public ProductResponse with computed fields."""
    is_in_stock = p.stock_quantity > 0
    if p.stock_quantity <= 0:
        stock_status = "out_of_stock"
    elif p.stock_quantity <= 5:
        stock_status = "low_stock"
    else:
        stock_status = "in_stock"

    discount_pct = None
    if p.compare_at_price and p.compare_at_price > p.price:
        discount_pct = int(round(((p.compare_at_price - p.price) / p.compare_at_price) * 100))

    images_resp = [
        ProductImageResponse(
            id=img.id,
            url=img.url,
            alt_text=img.alt_text,
            is_primary=img.is_primary,
            display_order=img.display_order,
            created_at=img.created_at
        )
        for img in sorted(p.images, key=lambda x: (not x.is_primary, x.display_order))
    ]

    primary_url = None
    for img in images_resp:
        if img.is_primary:
            primary_url = img.url
            break
    if not primary_url and images_resp:
        primary_url = images_resp[0].url

    category_resp = None
    if p.category:
        category_resp = CategoryResponse(
            id=p.category.id,
            name=p.category.name,
            slug=p.category.slug,
            description=p.category.description,
            icon_name=p.category.icon_name,
            image_url=p.category.image_url,
            is_active=p.category.is_active,
            item_count=0,
            created_at=p.category.created_at,
            updated_at=p.category.updated_at
        )

    return ProductResponse(
        id=p.id,
        name=p.name,
        slug=p.slug,
        sku=p.sku,
        description=p.description,
        price=p.price,
        compare_at_price=p.compare_at_price,
        discount_pct=discount_pct,
        stock_quantity=p.stock_quantity,
        is_in_stock=is_in_stock,
        stock_status=stock_status,
        badge=p.badge,
        rating=p.rating,
        review_count=p.review_count,
        is_active=p.is_active,
        category=category_resp,
        images=images_resp,
        primary_image=primary_url,
        created_at=p.created_at,
        updated_at=p.updated_at
    )

@router.get("", response_model=ProductListResponse, summary="List and filter catalog products")
def list_products(
    category: Optional[str] = Query(None, description="Category filter (slug or ID)"),
    search: Optional[str] = Query(None, description="Search keyword in name or description"),
    min_price: Optional[Decimal] = Query(None, ge=0, description="Minimum price filter"),
    max_price: Optional[Decimal] = Query(None, ge=0, description="Maximum price filter"),
    badge: Optional[str] = Query(None, description="Badge filter, e.g. Trending, Sale, Best Seller"),
    in_stock_only: bool = Query(False, description="Filter only products with available inventory"),
    include_inactive: bool = Query(False, description="Include inactive/archived products (admin use)"),
    sort_by: str = Query("newest", description="Sorting criteria: price-low, price-high, name-asc, name-desc, newest, oldest, rating, featured"),
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    page_size: int = Query(12, ge=1, le=100, description="Items per page (max 100)"),
    db: Session = Depends(get_db)
):
    """
    Search, filter, sort, and paginate active products in the catalogue.
    Inactive products are hidden by default to ensure only purchasable goods are returned.
    """
    # 1. Validate price range
    if min_price is not None and max_price is not None and min_price > max_price:
        raise AppException(
            code="INVALID_PRICE_RANGE",
            message="min_price cannot be greater than max_price",
            status_code=status.HTTP_400_BAD_REQUEST
        )

    # 2. Validate sort criteria
    clean_sort = sort_by.strip().lower()
    if clean_sort not in ALLOWED_SORT_OPTIONS:
        allowed_keys = ", ".join(ALLOWED_SORT_OPTIONS.keys())
        raise AppException(
            code="INVALID_SORT_OPTION",
            message=f"Invalid sort option '{sort_by}'. Allowed options: {allowed_keys}",
            status_code=status.HTTP_400_BAD_REQUEST
        )

    # 3. Build query with eager-loaded relations
    query = db.query(Product).options(
        joinedload(Product.images),
        joinedload(Product.category)
    )

    # Active filter
    if not include_inactive:
        query = query.filter(Product.is_active == True)

    # Category filter
    if category:
        clean_cat = category.strip()
        query = query.join(Product.category).filter(
            or_(Category.slug == clean_cat, Category.id == clean_cat)
        )

    # Keyword search across name and description
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_term),
                Product.description.ilike(search_term)
            )
        )

    # Price range filters
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    # Badge filter
    if badge:
        query = query.filter(Product.badge.ilike(badge.strip()))

    # In-stock filter
    if in_stock_only:
        query = query.filter(Product.stock_quantity > 0)

    # Compute total matching records
    total = query.distinct().count()

    # Apply sorting
    sort_clauses = ALLOWED_SORT_OPTIONS[clean_sort]
    query = query.order_by(*sort_clauses)

    # Apply pagination
    offset = (page - 1) * page_size
    items = query.offset(offset).limit(page_size).all()

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return ProductListResponse(
        items=[_enrich_product(p) for p in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/featured", response_model=List[ProductResponse], summary="Retrieve curated featured products")
def get_featured_products(
    limit: int = Query(8, ge=1, le=50, description="Maximum featured items to return"),
    db: Session = Depends(get_db)
):
    """
    Retrieve top featured or highly rated active products for storefront highlights.
    """
    products = (
        db.query(Product)
        .options(joinedload(Product.images), joinedload(Product.category))
        .filter(Product.is_active == True)
        .order_by(
            Product.badge.isnot(None).desc(),
            Product.rating.desc(),
            Product.created_at.desc()
        )
        .limit(limit)
        .all()
    )
    return [_enrich_product(p) for p in products]

@router.get("/{id_or_slug}", response_model=ProductResponse, summary="Retrieve product by ID or slug")
def get_product(
    id_or_slug: str,
    include_inactive: bool = Query(False, description="Allow viewing inactive product"),
    db: Session = Depends(get_db)
):
    """
    Retrieve single product details by either UUID ID or unique URL slug.
    Excludes inactive products by default to ensure only active products are public.
    """
    query = db.query(Product).options(
        joinedload(Product.images),
        joinedload(Product.category)
    ).filter(
        or_(Product.id == id_or_slug, Product.slug == id_or_slug)
    )

    if not include_inactive:
        query = query.filter(Product.is_active == True)

    product = query.first()

    if not product:
        raise AppException(
            code="PRODUCT_NOT_FOUND",
            message=f"Product '{id_or_slug}' not found",
            status_code=status.HTTP_404_NOT_FOUND
        )

    return _enrich_product(product)

@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED, summary="Create product (Admin Only)")
def create_product(
    payload: ProductCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new product with associated images and stock.
    Requires administrative privileges.
    """
    # 1. Verify category exists
    cat = db.query(Category).filter(Category.id == payload.category_id).first()
    if not cat:
        raise AppException(
            code="CATEGORY_NOT_FOUND",
            message=f"Category with ID '{payload.category_id}' does not exist",
            status_code=status.HTTP_404_NOT_FOUND
        )

    # 2. Check unique slug
    clean_slug = payload.slug.strip().lower()
    if db.query(Product).filter(Product.slug == clean_slug).first():
        raise AppException(
            code="DUPLICATE_PRODUCT_SLUG",
            message=f"Product with slug '{clean_slug}' already exists",
            status_code=status.HTTP_409_CONFLICT
        )

    # 3. Check unique SKU
    clean_sku = payload.sku.strip().upper()
    if db.query(Product).filter(Product.sku == clean_sku).first():
        raise AppException(
            code="DUPLICATE_PRODUCT_SKU",
            message=f"Product with SKU '{clean_sku}' already exists",
            status_code=status.HTTP_409_CONFLICT
        )

    # 4. Create Product instance
    new_product = Product(
        id=str(uuid.uuid4()),
        category_id=payload.category_id,
        name=payload.name.strip(),
        slug=clean_slug,
        sku=clean_sku,
        description=payload.description.strip(),
        price=payload.price,
        compare_at_price=payload.compare_at_price,
        stock_quantity=payload.stock_quantity,
        badge=payload.badge,
        is_active=payload.is_active
    )
    db.add(new_product)
    db.flush()

    # 5. Persist gallery images if supplied
    if payload.images:
        for idx, img_in in enumerate(payload.images):
            image_record = ProductImage(
                id=str(uuid.uuid4()),
                product_id=new_product.id,
                url=img_in.url.strip(),
                alt_text=img_in.alt_text,
                is_primary=img_in.is_primary or (idx == 0),
                display_order=img_in.display_order if img_in.display_order > 0 else idx
            )
            db.add(image_record)

    log_audit_event(
        db=db,
        actor_id=admin.id,
        action="PRODUCT_CREATE",
        entity_name="Product",
        entity_id=new_product.id,
        new_values={
            "name": new_product.name,
            "sku": new_product.sku,
            "price": float(new_product.price),
            "stock": new_product.stock_quantity,
        }
    )

    db.commit()
    db.refresh(new_product)

    return _enrich_product(new_product)

@router.put("/{product_id}", response_model=ProductResponse, summary="Update product (Admin Only)")
def update_product(
    product_id: str,
    payload: ProductUpdate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Update an existing product's details, pricing, or media.
    Requires administrative privileges.
    """
    product = db.query(Product).options(
        joinedload(Product.images),
        joinedload(Product.category)
    ).filter(Product.id == product_id).first()

    if not product:
        raise AppException(
            code="PRODUCT_NOT_FOUND",
            message=f"Product with ID '{product_id}' not found",
            status_code=status.HTTP_404_NOT_FOUND
        )

    # Verify category if changing
    if payload.category_id is not None:
        cat = db.query(Category).filter(Category.id == payload.category_id).first()
        if not cat:
            raise AppException(
                code="CATEGORY_NOT_FOUND",
                message=f"Category with ID '{payload.category_id}' does not exist",
                status_code=status.HTTP_404_NOT_FOUND
            )
        product.category_id = payload.category_id

    # Check unique slug if changing
    if payload.slug is not None:
        clean_slug = payload.slug.strip().lower()
        duplicate_slug = db.query(Product).filter(
            Product.slug == clean_slug,
            Product.id != product_id
        ).first()
        if duplicate_slug:
            raise AppException(
                code="DUPLICATE_PRODUCT_SLUG",
                message=f"Product with slug '{clean_slug}' already exists",
                status_code=status.HTTP_409_CONFLICT
            )
        product.slug = clean_slug

    # Check unique SKU if changing
    if payload.sku is not None:
        clean_sku = payload.sku.strip().upper()
        duplicate_sku = db.query(Product).filter(
            Product.sku == clean_sku,
            Product.id != product_id
        ).first()
        if duplicate_sku:
            raise AppException(
                code="DUPLICATE_PRODUCT_SKU",
                message=f"Product with SKU '{clean_sku}' already exists",
                status_code=status.HTTP_409_CONFLICT
            )
        product.sku = clean_sku

    if payload.name is not None:
        product.name = payload.name.strip()
    if payload.description is not None:
        product.description = payload.description.strip()
    if payload.price is not None:
        product.price = payload.price
    if payload.compare_at_price is not None:
        product.compare_at_price = payload.compare_at_price
    if payload.stock_quantity is not None:
        product.stock_quantity = payload.stock_quantity
    if payload.badge is not None:
        product.badge = payload.badge
    if payload.is_active is not None:
        product.is_active = payload.is_active

    # Replace gallery images if explicitly provided
    if payload.images is not None:
        db.query(ProductImage).filter(ProductImage.product_id == product.id).delete()
        for idx, img_in in enumerate(payload.images):
            image_record = ProductImage(
                id=str(uuid.uuid4()),
                product_id=product.id,
                url=img_in.url.strip(),
                alt_text=img_in.alt_text,
                is_primary=img_in.is_primary or (idx == 0),
                display_order=img_in.display_order if img_in.display_order > 0 else idx
            )
            db.add(image_record)

    log_audit_event(
        db=db,
        actor_id=admin.id,
        action="PRODUCT_UPDATE",
        entity_name="Product",
        entity_id=product.id,
        new_values={
            "name": product.name,
            "sku": product.sku,
            "price": float(product.price),
            "stock": product.stock_quantity,
            "is_active": product.is_active,
        }
    )

    db.commit()
    db.refresh(product)

    return _enrich_product(product)

@router.patch("/{product_id}/stock", response_model=ProductResponse, summary="Quick stock adjustment (Admin Only)")
def update_product_stock(
    product_id: str,
    payload: ProductStockUpdate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Rapidly update warehouse stock quantity for a single product.
    Requires administrative privileges.
    """
    product = db.query(Product).options(
        joinedload(Product.images),
        joinedload(Product.category)
    ).filter(Product.id == product_id).first()

    if not product:
        raise AppException(
            code="PRODUCT_NOT_FOUND",
            message=f"Product with ID '{product_id}' not found",
            status_code=status.HTTP_404_NOT_FOUND
        )

    old_stock = product.stock_quantity
    product.stock_quantity = payload.stock_quantity

    log_audit_event(
        db=db,
        actor_id=admin.id,
        action="PRODUCT_STOCK_ADJUST",
        entity_name="Product",
        entity_id=product.id,
        old_values={"stock_quantity": old_stock},
        new_values={"stock_quantity": payload.stock_quantity}
    )

    db.commit()
    db.refresh(product)

    return _enrich_product(product)

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Archive product (Admin Only)")
def delete_product(
    product_id: str,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Soft-archive a product by marking is_active=False.
    Historical orders retain referential integrity while hiding it from shoppers.
    Requires administrative privileges.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise AppException(
            code="PRODUCT_NOT_FOUND",
            message=f"Product with ID '{product_id}' not found",
            status_code=status.HTTP_404_NOT_FOUND
        )

    product.is_active = False

    log_audit_event(
        db=db,
        actor_id=admin.id,
        action="PRODUCT_ARCHIVE",
        entity_name="Product",
        entity_id=product.id,
        new_values={"is_active": False}
    )

    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
