from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings


settings = get_settings()

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_db_tables() -> None:
    from app.models.category import Category
    from app.models.product import Product
    from app.models.stock_movement import StockMovement
    from app.models.user import User

    models = (Category, Product, StockMovement, User)
    Base.metadata.create_all(bind=engine, tables=[model.__table__ for model in models])