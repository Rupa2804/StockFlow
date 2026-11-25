from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.product import Product
from app.models.stock_movement import StockMovement
from app.models.user import User
from app.schemas.product import ProductCreate, ProductUpdate


def create_product(
    db: Session,
    request: ProductCreate,
    organization_id: int,
) -> Product:
    data = request.model_dump(exclude={"unit_price", "selling_price"})
    selling_price = (
        request.selling_price
        if request.selling_price is not None
        else request.unit_price
    )
    unit_price = (
        request.unit_price
        if request.unit_price is not None
        else selling_price
    )
    product = Product(
        **data,
        organization_id=organization_id,
        unit_price=unit_price,
        selling_price=selling_price,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def get_product(
    db: Session,
    product_id: int,
    organization_id: int,
) -> Product | None:
    return db.scalar(
        select(Product).where(
            Product.id == product_id,
            Product.organization_id == organization_id,
        )
    )


def list_products(
    db: Session,
    organization_id: int,
    category_id: int | None = None,
    search: str | None = None,
    offset: int = 0,
    limit: int = 100,
) -> list[Product]:
    statement = (
        select(Product)
        .where(Product.organization_id == organization_id)
        .order_by(Product.id)
        .offset(offset)
        .limit(limit)
    )
    if category_id is not None:
        statement = statement.where(Product.category_id == category_id)
    if search:
        search_pattern = f"%{search.strip()}%"
        statement = statement.where(
            Product.name.ilike(search_pattern) | Product.sku.ilike(search_pattern)
        )
    return list(db.scalars(statement).all())


def update_product(
    db: Session,
    product: Product,
    request: ProductUpdate,
    actor: User,
) -> Product:
    changes = request.model_dump(exclude_unset=True)
    if changes.get("category_id") is not None:
        category = db.scalar(
            select(Category).where(
                Category.id == changes["category_id"],
                Category.organization_id == product.organization_id,
            )
        )
        if category is None:
            raise ValueError("Category not found in this organization")
    if "selling_price" in changes:
        changes["unit_price"] = changes["selling_price"]
    elif "unit_price" in changes:
        changes["selling_price"] = changes["unit_price"]

    quantity_change = None
    if "stock_quantity" in changes:
        quantity_change = changes["stock_quantity"] - product.stock_quantity

    for field, value in changes.items():
        setattr(product, field, value)
    if quantity_change:
        db.add(
            StockMovement(
                product_id=product.id,
                user_id=actor.id,
                organization_id=product.organization_id,
                movement_type="in" if quantity_change > 0 else "out",
                quantity=abs(quantity_change),
                note="Quantity changed through product update",
            )
        )
    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product: Product) -> None:
    db.delete(product)
    db.commit()
