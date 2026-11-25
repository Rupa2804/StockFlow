from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.database import get_db
from app.models.category import Category
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryRead
from app.services.category_service import (
    create_category,
    get_category,
    list_categories,
)


router = APIRouter(prefix="/categories", tags=["categories"])


@router.post(
    "",
    response_model=CategoryRead,
    status_code=status.HTTP_201_CREATED,
)
def add_category(
    request: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Category:
    try:
        return create_category(db, request, current_user.organization_id)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A category with this name already exists",
        ) from exc


@router.get("", response_model=list[CategoryRead])
def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Category]:
    return list_categories(db, current_user.organization_id)


@router.get("/{category_id}", response_model=CategoryRead)
def get_category_by_id(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Category:
    category = get_category(db, category_id, current_user.organization_id)
    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )
    return category
