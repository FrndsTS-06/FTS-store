from typing import List
from fastapi import APIRouter, HTTPException
from app.database import db
from app.schemas import Category

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("", response_model=List[Category])
def get_all_categories():
    """Retrieve all product categories with item counts and metadata."""
    return db.get_categories()

@router.get("/{slug}", response_model=Category)
def get_category_by_slug(slug: str):
    """Retrieve a single category by its slug identifier."""
    category = db.get_category_by_slug(slug)
    if not category:
        raise HTTPException(status_code=404, detail=f"Category '{slug}' not found")
    return category
