from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


def create_product(db: Session, request: ProductCreate) -> Product:
    product = Product(**request.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def get_product(db: Session, product_id: int) -> Product | None:
    return db.get(Product, product_id)


def list_products(
    db: Session,
    category_id: int | None = None,
    offset: int = 0,
    limit: int = 100,
) -> list[Product]:
    statement = select(Product).order_by(Product.id).offset(offset).limit(limit)
    if category_id is not None:
        statement = statement.where(Product.category_id == category_id)
    return list(db.scalars(statement).all())


def update_product(db: Session, product: Product, request: ProductUpdate) -> Product:
    changes = request.model_dump(exclude_unset=True)
    if changes.get("category_id") is not None:
        category = db.get(Category, changes["category_id"])
        if category is None:
            raise ValueError("Category not found")
    for field, value in changes.items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product: Product) -> None:
    db.delete(product)
    db.commit()
