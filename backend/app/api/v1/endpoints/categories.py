import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_db, get_current_admin
from app.models import Category, Product, User
from app.schemas.catalog import CategoryCreate, CategoryUpdate, CategoryResponse
from app.core.errors import AppException
from app.services.admin_service import log_audit_event

router = APIRouter(prefix="/categories", tags=["Categories"])

def _enrich_category_response(cat: Category, db: Session) -> CategoryResponse:
    item_count = db.query(func.count(Product.id)).filter(
        Product.category_id == cat.id,
        Product.is_active == True
    ).scalar() or 0

    return CategoryResponse(
        id=cat.id,
        name=cat.name,
        slug=cat.slug,
        description=cat.description,
        icon_name=cat.icon_name,
        image_url=cat.image_url,
        is_active=cat.is_active,
        item_count=item_count,
        created_at=cat.created_at,
        updated_at=cat.updated_at
    )

@router.get("", response_model=List[CategoryResponse], summary="List all categories")
def list_categories(
    include_inactive: bool = Query(False, description="Include inactive/archived categories"),
    db: Session = Depends(get_db)
):
    """
    Retrieve all product categories with dynamic active product counts.
    """
    query = db.query(Category)
    if not include_inactive:
        query = query.filter(Category.is_active == True)

    categories = query.order_by(Category.name.asc()).all()
    return [_enrich_category_response(c, db) for c in categories]

@router.get("/{id_or_slug}", response_model=CategoryResponse, summary="Retrieve a category by ID or slug")
def get_category(
    id_or_slug: str,
    db: Session = Depends(get_db)
):
    """
    Retrieve single category by its unique slug identifier or UUID.
    """
    category = db.query(Category).filter(
        (Category.id == id_or_slug) | (Category.slug == id_or_slug)
    ).first()

    if not category:
        raise AppException(
            code="CATEGORY_NOT_FOUND",
            message=f"Category '{id_or_slug}' not found",
            status_code=status.HTTP_404_NOT_FOUND
        )

    return _enrich_category_response(category, db)

@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED, summary="Create category (Admin Only)")
def create_category(
    payload: CategoryCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new product department/category.
    Requires administrative privileges.
    """
    existing = db.query(Category).filter(Category.slug == payload.slug.strip().lower()).first()
    if existing:
        raise AppException(
            code="DUPLICATE_CATEGORY_SLUG",
            message=f"Category with slug '{payload.slug}' already exists",
            status_code=status.HTTP_409_CONFLICT
        )

    new_cat = Category(
        id=str(uuid.uuid4()),
        name=payload.name.strip(),
        slug=payload.slug.strip().lower(),
        description=payload.description,
        icon_name=payload.icon_name,
        image_url=payload.image_url,
        is_active=payload.is_active
    )
    db.add(new_cat)

    log_audit_event(
        db=db,
        actor_id=admin.id,
        action="CATEGORY_CREATE",
        entity_name="Category",
        entity_id=new_cat.id,
        new_values={"name": new_cat.name, "slug": new_cat.slug}
    )

    db.commit()
    db.refresh(new_cat)

    return _enrich_category_response(new_cat, db)

@router.put("/{category_id}", response_model=CategoryResponse, summary="Update category (Admin Only)")
def update_category(
    category_id: str,
    payload: CategoryUpdate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Update an existing category's metadata or visibility.
    Requires administrative privileges.
    """
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise AppException(
            code="CATEGORY_NOT_FOUND",
            message=f"Category with ID '{category_id}' not found",
            status_code=status.HTTP_404_NOT_FOUND
        )

    if payload.slug is not None:
        clean_slug = payload.slug.strip().lower()
        duplicate = db.query(Category).filter(
            Category.slug == clean_slug,
            Category.id != category_id
        ).first()
        if duplicate:
            raise AppException(
                code="DUPLICATE_CATEGORY_SLUG",
                message=f"Category with slug '{clean_slug}' already exists",
                status_code=status.HTTP_409_CONFLICT
            )
        cat.slug = clean_slug

    if payload.name is not None:
        cat.name = payload.name.strip()
    if payload.description is not None:
        cat.description = payload.description
    if payload.icon_name is not None:
        cat.icon_name = payload.icon_name
    if payload.image_url is not None:
        cat.image_url = payload.image_url
    if payload.is_active is not None:
        cat.is_active = payload.is_active

    log_audit_event(
        db=db,
        actor_id=admin.id,
        action="CATEGORY_UPDATE",
        entity_name="Category",
        entity_id=cat.id,
        new_values={"name": cat.name, "slug": cat.slug, "is_active": cat.is_active}
    )

    db.commit()
    db.refresh(cat)
    return _enrich_category_response(cat, db)

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Archive category (Admin Only)")
def delete_category(
    category_id: str,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Soft-archive a category by marking is_active=False.
    Requires administrative privileges.
    """
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise AppException(
            code="CATEGORY_NOT_FOUND",
            message=f"Category with ID '{category_id}' not found",
            status_code=status.HTTP_404_NOT_FOUND
        )

    cat.is_active = False

    log_audit_event(
        db=db,
        actor_id=admin.id,
        action="CATEGORY_ARCHIVE",
        entity_name="Category",
        entity_id=cat.id,
        new_values={"is_active": False}
    )

    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
