from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.category import Category
from app.schemas.category import CategoryCreate


def create_category(
    db: Session,
    request: CategoryCreate,
    organization_id: int,
) -> Category:
    category = Category(
        name=request.name,
        description=request.description,
        organization_id=organization_id,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def get_category(db: Session, category_id: int, organization_id: int) -> Category | None:
    return db.scalar(
        select(Category).where(
            Category.id == category_id,
            Category.organization_id == organization_id,
        )
    )


def list_categories(db: Session, organization_id: int) -> list[Category]:
    statement = (
        select(Category)
        .where(Category.organization_id == organization_id)
        .order_by(Category.name)
    )
    return list(db.scalars(statement).all())
