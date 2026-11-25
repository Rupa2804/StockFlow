from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.database import get_db
from app.models.product import Product
from app.models.user import User
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate
from app.services.category_service import get_category
from app.services.product_service import (
    create_product,
    delete_product,
    get_product,
    list_products,
    update_product,
)


router = APIRouter(prefix="/products", tags=["products"])


@router.post("", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def add_product(
    request: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Product:
    if request.category_id is not None and get_category(
        db,
        request.category_id,
        current_user.organization_id,
    ) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found in this organization",
        )
    try:
        return create_product(db, request, current_user.organization_id)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A product with this SKU already exists",
        ) from exc


@router.get("", response_model=list[ProductRead])
def get_products(
    category_id: int | None = None,
    search: str | None = Query(default=None, max_length=100),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Product]:
    return list_products(
        db,
        organization_id=current_user.organization_id,
        category_id=category_id,
        search=search,
        offset=offset,
        limit=limit,
    )


@router.get("/{product_id}", response_model=ProductRead)
def get_product_by_id(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Product:
    product = get_product(db, product_id, current_user.organization_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.patch("/{product_id}", response_model=ProductRead)
def edit_product(
    product_id: int,
    request: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Product:
    product = get_product(db, product_id, current_user.organization_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    try:
        return update_product(db, product, request, current_user)
    except ValueError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A product with this SKU already exists",
        ) from exc


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    product = get_product(db, product_id, current_user.organization_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    try:
        delete_product(db, product)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A product with stock history cannot be deleted",
        ) from exc
