from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.stock_movement import StockMovement
from app.models.user import User
from app.schemas.stock_movement import StockMovementCreate


def record_stock_movement(
    db: Session,
    product_id: int,
    organization_id: int,
    user: User,
    request: StockMovementCreate,
) -> StockMovement:
    product = db.scalar(
        select(Product)
        .where(
            Product.id == product_id,
            Product.organization_id == organization_id,
        )
        .with_for_update()
    )
    if product is None:
        raise LookupError("Product not found")
    if request.movement_type == "out" and request.quantity > product.stock_quantity:
        raise ValueError("Stock-out quantity exceeds available inventory")

    if request.movement_type == "in":
        product.stock_quantity += request.quantity
    else:
        product.stock_quantity -= request.quantity

    movement = StockMovement(
        product_id=product.id,
        user_id=user.id,
        organization_id=organization_id,
        movement_type=request.movement_type,
        quantity=request.quantity,
        note=request.note,
    )
    db.add(movement)
    db.commit()
    db.refresh(movement)
    return movement


def list_product_movements(
    db: Session,
    product_id: int,
    organization_id: int,
) -> list[StockMovement]:
    statement = (
        select(StockMovement)
        .where(StockMovement.product_id == product_id)
        .where(StockMovement.organization_id == organization_id)
        .order_by(StockMovement.created_at.desc(), StockMovement.id.desc())
    )
    return list(db.scalars(statement).all())
