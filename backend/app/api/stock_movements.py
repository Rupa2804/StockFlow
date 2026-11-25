from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.database import get_db
from app.models.product import Product
from app.models.stock_movement import StockMovement
from app.models.user import User
from app.schemas.stock_movement import StockMovementCreate, StockMovementRead
from app.services.inventory_service import (
    list_product_movements,
    record_stock_movement,
)


router = APIRouter(tags=["stock"])


@router.post(
    "/products/{product_id}/stock-movements",
    response_model=StockMovementRead,
    status_code=status.HTTP_201_CREATED,
)
def add_stock_movement(
    product_id: int,
    request: StockMovementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StockMovement:
    try:
        return record_stock_movement(db, product_id, current_user, request)
    except LookupError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except ValueError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.get(
    "/products/{product_id}/stock-movements",
    response_model=list[StockMovementRead],
)
def get_stock_movements(
    product_id: int,
    db: Session = Depends(get_db),
) -> list[StockMovement]:
    if db.get(Product, product_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
    movements = list_product_movements(db, product_id)
    return movements
